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
        <p class="detail-price">{{ product.price }} &euro;</p>
        <div class="detail-desc" v-html="product.description"></div>

        <div v-if="sizes.length > 0" class="detail-option">
          <label>Taille :</label>
          <select v-model="selectedSize" class="opt-select">
            <option v-for="s in sizes" :key="s.id" :value="s.id">{{ productService.extractLanguageValue(s.name) }}</option>
          </select>
        </div>

        <div v-if="colors.length > 0" class="detail-option">
          <label>Couleur :</label>
          <select v-model="selectedColor" class="opt-select">
            <option v-for="c in colors" :key="c.id" :value="c.id">{{ productService.extractLanguageValue(c.name) }}</option>
          </select>
        </div>

        <div class="detail-actions">
          <div class="qty-ctrl">
            <button class="qty-btn" @click="quantity > 1 && quantity--">&minus;</button>
            <input type="number" v-model.number="quantity" min="1" class="qty-input" />
            <button class="qty-btn" @click="quantity++">&#43;</button>
          </div>
          <button @click="addToCart" class="btn-cart">Ajouter au panier</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProduct } from '@shared/composables/useProduct';
import { useCartStore } from '../stores/cart';
import productService from '@shared/services/product-service';

const route = useRoute();
const { currentProduct, loading, error, fetchProduct } = useProduct();
const cartStore = useCartStore();
const quantity = ref(1);

const sizes = ref<any[]>([]);
const colors = ref<any[]>([]);
const selectedSize = ref('');
const selectedColor = ref('');

const product = computed(() => currentProduct.value);
const mainImage = computed(() => product.value ? productService.getImageUrl(product.value.id_product, product.value.id_default_image) : ''
);

onMounted(async () => {
    await fetchProduct(parseInt(route.params.id as string));
    if (product.value?.product_option_values) {
        const [allVals, allOpts] = await Promise.all([
            productService.getProductOptionValues(),
            productService.getProductOptions()
        ]);

        const sizeGroup = allOpts.find(o => {
            const name = productService.extractLanguageValue(o.name).toLowerCase();
            return name === 'taille' || name === 'size';
        });
        const colorGroup = allOpts.find(o => {
            const name = productService.extractLanguageValue(o.name).toLowerCase();
            return String(o.is_color_group) === '1' || name === 'couleur' || name === 'color';
        });

        const prodOptIds = product.value.product_option_values.map((o: any) => String(o.id));
        const prodVals = allVals.filter(v => prodOptIds.includes(String(v.id)));

        if (sizeGroup) {
            sizes.value = prodVals.filter(v => String(v.id_attribute_group) === String(sizeGroup.id));
            if (sizes.value.length > 0) selectedSize.value = sizes.value[0].id;
        }
        if (colorGroup) {
            colors.value = prodVals.filter(v => String(v.id_attribute_group) === String(colorGroup.id));
            if (colors.value.length > 0) selectedColor.value = colors.value[0].id;
        }
    }
});
const addToCart = () => { if (product.value) cartStore.addProduct(product.value, quantity.value); };
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