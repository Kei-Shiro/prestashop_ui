<template>
  <div class="detail-page">
    <div v-if="loading" class="state-loading">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
    <div v-else-if="error" class="state-error">{{ error }}</div>
    <div v-else-if="product" class="detail-grid">
      <div class="detail-img-wrap">
        <img :src="mainImage" :alt="product.name" class="detail-img" />
      </div>
      <div class="detail-info">
        <h1 class="detail-name">{{ product.name }}</h1>
        <p class="detail-price">{{ displayPrice }} &euro;</p>

        <div class="detail-stock">
          <span v-if="Number(displayStock) > 0" class="stock-available">
            En stock ({{ displayStock }} disponible{{ Number(displayStock) > 1 ? 's' : '' }})
          </span>
          <span v-else class="stock-unavailable">Rupture de stock</span>
        </div>

        <div class="detail-desc" v-html="product.description"></div>

        <!-- Dynamic Attribute Selectors -->
        <div v-for="group in attributeGroups" :key="group.id" class="detail-option">
          <label>{{ group.name }} :</label>
          <select v-model="selectedOptions[group.id]" class="opt-select">
            <option v-for="val in group.values" :key="val.id" :value="val.id">
              {{ val.name }}
            </option>
          </select>
        </div>

        <div class="detail-actions">
          <div class="qty-ctrl">
            <button class="qty-btn" @click="quantity > 1 && quantity--">&minus;</button>
            <input type="number" v-model.number="quantity" min="1" class="qty-input" />
            <button class="qty-btn" @click="quantity++">&#43;</button>
          </div>
          <button @click="addToCart" class="btn-cart" :disabled="Number(displayStock) <= 0">
            {{ Number(displayStock) > 0 ? 'Ajouter au panier' : 'Indisponible' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useProduct } from '@features/catalog/composables/useProduct';
import { productService } from '@shared/models/product';
import { useCartStore } from '@shared/models/cart';
import { ensureArray } from '@shared/utils/arrayUtils';

const route = useRoute();
const { currentProduct, loading, error, fetchProduct } = useProduct();
const cartStore = useCartStore();
const quantity = ref(1);

const combinations = ref<any[]>([]);
const attributeGroups = ref<any[]>([]);
const selectedOptions = reactive<Record<string, string>>({});
const combinationStock = ref<string | null>(null);

const product = computed(() => currentProduct.value);
const mainImage = computed(() => product.value ? productService.getImageUrl(product.value.id_product, product.value.id_default_image) : '');

// Find matching combination based on selected options
const selectedCombination = computed(() => {
    if (combinations.value.length === 0) return null;
    
    return combinations.value.find(c => {
        const comboVals = c.associations?.product_option_values?.product_option_value;
        const vals = ensureArray(comboVals);
        
        // Check if every selected option matches this combination
        return Object.entries(selectedOptions).every(([groupId, valId]) => {
            return vals.some((v: any) => productService.extractIdValue(v.id || v) === String(valId));
        });
    });
});

const displayPrice = computed(() => {
    if (!product.value) return '0.00';
    const basePriceTTC = parseFloat(product.value.price);
    const taxRate = product.value.tax_rate || 0;
    
    if (selectedCombination.value) {
        const impactHT = parseFloat(selectedCombination.value.price || '0');
        const impactTTC = impactHT * (1 + taxRate / 100);
        return (basePriceTTC + impactTTC).toFixed(2);
    }
    return basePriceTTC.toFixed(2);
});

const displayStock = computed(() => {
    if (combinations.value.length > 0) {
        return combinationStock.value ?? '0';
    }
    return product.value?.quantity ?? '0';
});

onMounted(async () => {
    const productId = parseInt(route.params.id as string);
    await fetchProduct(productId);
    
    // Fetch combinations
    combinations.value = await productService.getCombinations(productId);
    
    if (combinations.value.length > 0) {
        const [allVals, allOpts] = await Promise.all([
            productService.getProductOptionValues(),
            productService.getProductOptions()
        ]);

        // Map combinations to identify unique attributes
        const usedValIds = new Set<string>();
        combinations.value.forEach(c => {
            const comboVals = c.associations?.product_option_values?.product_option_value;
            const vals = ensureArray(comboVals);
            vals.forEach((v: any) => {
                const vid = productService.extractIdValue(v.id || v);
                if (vid) usedValIds.add(vid);
            });
        });

        const prodVals = allVals.filter(v => usedValIds.has(productService.extractIdValue(v.id)));
        const usedGroupIds = new Set(prodVals.map(v => productService.extractIdValue(v.id_attribute_group)));
        
        attributeGroups.value = allOpts
            .filter(o => usedGroupIds.has(productService.extractIdValue(o.id)))
            .map(o => ({
                id: productService.extractIdValue(o.id),
                name: productService.extractLanguageValue(o.name || o.public_name),
                values: prodVals
                    .filter(v => productService.extractIdValue(v.id_attribute_group) === productService.extractIdValue(o.id))
                    .map(v => ({
                        id: productService.extractIdValue(v.id),
                        name: productService.extractLanguageValue(v.name)
                    }))
            }));

        // Initialize selection
        attributeGroups.value.forEach(g => {
            if (g.values.length > 0) selectedOptions[g.id] = g.values[0].id;
        });
    }
});

// Watch for selection changes to update stock
watch(selectedCombination, async (newCombo) => {
    if (newCombo) {
        const comboId = productService.extractIdValue(newCombo.id);
        combinationStock.value = await productService.getCombinationStock(parseInt(comboId));
    } else {
        combinationStock.value = null;
    }
}, { immediate: true });

const addToCart = () => {
    if (!product.value) return;
    const comboId = selectedCombination.value ? productService.extractIdValue(selectedCombination.value.id) : '0';
    cartStore.addProduct(product.value, quantity.value, comboId, parseFloat(displayPrice.value));
};
</script>

<style scoped>
.detail-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 64px 24px;
}

/* States */
.state-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 80px 0;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  animation: pulse 1.2s ease-in-out infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1); }
}
.state-error {
  color: #7f1d1d;
  text-align: center;
  padding: 80px 0;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: start;
}
@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; gap: 32px; }
}

/* Image */
.detail-img-wrap {
  aspect-ratio: 3/4;
  overflow: hidden;
  background: #f8fafc;
  position: sticky;
  top: 96px;
}
.detail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* Info */
.detail-info { padding: 40px 0; }
.detail-name {
  font-family: Georgia, serif;
  font-size: 2.25rem;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
}
.detail-price {
  font-size: 1.125rem;
  color: #64748b;
  letter-spacing: 0.05em;
  margin: 0 0 40px;
}
.detail-desc {
  font-size: 0.9375rem;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 24px;
}

.detail-stock {
  margin-bottom: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}
.stock-available { color: #16a34a; }
.stock-unavailable { color: #dc2626; }

.detail-option {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.detail-option label {
  font-size: 0.9375rem;
  color: #475569;
  font-weight: 500;
  min-width: 70px;
}
.opt-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  font-size: 0.875rem;
  color: #1e293b;
  outline: none;
  min-width: 120px;
}
.opt-select:focus { border-color: #0f172a; }

/* Actions */
.detail-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  border-top: 1px solid #f1f5f9;
  padding-top: 40px;
  flex-wrap: wrap;
}
.qty-ctrl {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  height: 48px;
}
.qty-btn {
  padding: 0 16px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.125rem;
  cursor: pointer;
  height: 100%;
  transition: color 0.2s;
}
.qty-btn:hover { color: #0f172a; }
.qty-input {
  width: 48px;
  text-align: center;
  border: none;
  outline: none;
  font-size: 0.9375rem;
  color: #0f172a;
  -moz-appearance: textfield;
}
.qty-input::-webkit-inner-spin-button,
.qty-input::-webkit-outer-spin-button { -webkit-appearance: none; }

.btn-cart {
  flex: 1;
  min-width: 160px;
  height: 48px;
  background: #0f172a;
  color: #fff;
  border: none;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.25s;
}
.btn-cart:hover { background: #1e293b; }
</style>