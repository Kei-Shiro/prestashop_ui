<template>
  <div class="reorder-page">
    <div class="back-link">
      <router-link to="/orders" class="btn-back">
        &larr; Retour à mes commandes
      </router-link>
    </div>

    <h1 class="page-title">Renouveler la commande #{{ orderId }}</h1>
    <p class="page-subtitle" v-if="multiplier > 1">Multiplicateur de quantité appliqué : x{{ multiplier }}</p>

    <div v-if="isLoading" class="state-msg">
      <div class="spinner"></div>
      <p>Vérification de la disponibilité des stocks en cours...</p>
    </div>
    <div v-else-if="error" class="state-error">
      <p>{{ error }}</p>
      <router-link to="/orders" class="btn-outline">Retour à la liste</router-link>
    </div>
    <div v-else class="reorder-container">
      <div class="items-section">
        <h2 class="section-title">Vérification des articles</h2>
        <div class="items-list">
          <div v-for="item in items" :key="item.id_product + '-' + item.id_product_attribute" class="item-card" :class="{ 'item-unavailable': !item.available }">
            <div class="item-img-container">
              <img :src="getImageUrl(item)" class="item-img" @error="handleImageError" />
            </div>
            <div class="item-details">
              <h3 class="item-name">{{ item.name }}</h3>
              <p class="item-ref">Réf produit : #{{ item.id_product }} <span v-if="item.id_product_attribute && item.id_product_attribute !== '0'">| Variante : #{{ item.id_product_attribute }}</span></p>
              <div class="stock-info">
                <span class="qty-required">Requis : <strong>{{ item.quantity }}</strong></span>
                <span class="stock-available">En stock : <strong>{{ item.current_stock }}</strong></span>
                <span class="price-unit">PU (TTC) : <strong>{{ item.unit_price.toFixed(2) }} &euro;</strong></span>
                <span class="price-total">Total (TTC) : <strong>{{ (item.unit_price * item.quantity).toFixed(2) }} &euro;</strong></span>
              </div>
            </div>
            <div class="item-status">
              <span v-if="item.available" class="badge badge-success">
                ✓ Disponible
              </span>
              <span v-else class="badge badge-danger">
                ✗ Stock insuffisant
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-card">
          <h2 class="summary-title">Résumé du renouvellement</h2>
          
          <div class="summary-row">
            <span>Articles uniques</span>
            <span>{{ items.length }}</span>
          </div>
          <div class="summary-row">
            <span>Quantité totale d'articles</span>
            <span>{{ totalQuantity }}</span>
          </div>
          <div class="summary-row total-row">
            <span>Estimation totale</span>
            <span>{{ totalAmount.toFixed(2) }} &euro;</span>
          </div>

          <div v-if="!isStockSufficient" class="warning-box">
            <p><strong>Stock insuffisant !</strong> Certains articles de cette commande ne sont pas disponibles en quantité suffisante. Vous ne pouvez pas passer cette commande.</p>
          </div>

          <button 
            @click="confirmReorder" 
            class="btn-order" 
            :disabled="!isStockSufficient || isSubmitting"
            :class="{ 'btn-submitting': isSubmitting }"
          >
            <span v-if="isSubmitting">Commande en cours...</span>
            <span v-else>Passer la commande</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderService } from '@shared/models/order';
import { productService } from '@shared/models/product';

const route = useRoute();
const router = useRouter();

const orderId = Number(route.query.orderId);
const multiplier = Number(route.query.multiplier) || 1;

const items = ref<any[]>([]);
const isStockSufficient = ref(false);
const isLoading = ref(true);
const isSubmitting = ref(false);
const error = ref<string | null>(null);

const getImageUrl = (item: any) => productService.getImageUrl(item.id_product, item.id_default_image);

const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + item.quantity, 0);
});

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
});

const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).src = '/favicon.svg';
};

const verifyStock = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await orderService.checkReorderStock(orderId, multiplier);
    if (res.success) {
      items.value = res.itemsToOrder || [];
      isStockSufficient.value = res.available;
    } else {
      error.value = res.error || "Impossible de vérifier la commande.";
    }
  } catch (err: any) {
    error.value = err.message || "Erreur de chargement.";
  } finally {
    isLoading.value = false;
  }
};

const confirmReorder = async () => {
  if (!isStockSufficient.value || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await orderService.reorder(orderId, multiplier);
    if (res.success && res.orderId) {
      router.push(`/order-confirmation/${res.orderId}`);
    } else {
      alert(res.error || "Une erreur est survenue lors de la création de la commande.");
    }
  } catch (err: any) {
    alert(err.message || "Erreur lors de la validation.");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  if (!orderId) {
    error.value = "ID de commande manquant dans la requête.";
    isLoading.value = false;
    return;
  }
  verifyStock();
});
</script>

<style scoped>
.reorder-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 64px 24px;
}
.back-link {
  margin-bottom: 24px;
}
.btn-back {
  text-decoration: none;
  color: #64748b;
  font-size: 0.875rem;
  transition: color 0.2s;
}
.btn-back:hover {
  color: #0f172a;
}
.page-title {
  font-family: Georgia, serif;
  font-size: 2rem;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 0.9375rem;
  color: #64748b;
  margin-bottom: 40px;
}

/* Loader */
.state-msg {
  text-align: center;
  padding: 64px 0;
  color: #64748b;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0f172a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.state-error {
  text-align: center;
  padding: 48px;
  border: 1px solid #fee2e2;
  background: #fef2f2;
  border-radius: 4px;
  color: #ef4444;
}

/* Layout */
.reorder-container {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}

.items-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.item-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  transition: all 0.2s;
}
.item-card.item-unavailable {
  border-color: #fca5a5;
  background: #fff5f5;
}
.item-img-container {
  width: 64px;
  height: 84px;
  background: #f8fafc;
  overflow: hidden;
  border-radius: 4px;
  flex-shrink: 0;
}
.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-details {
  flex: 1;
}
.item-name {
  font-family: Georgia, serif;
  font-size: 0.9375rem;
  color: #0f172a;
  margin: 0 0 4px;
}
.item-ref {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0 0 8px;
}
.stock-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 0.8125rem;
  color: #64748b;
}
.badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 4px;
}
.badge-success {
  background: #dcfce7;
  color: #15803d;
}
.badge-danger {
  background: #fee2e2;
  color: #b91c1c;
}

/* Summary Card */
.summary-card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 24px;
  background: #f8fafc;
}
.summary-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 20px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 12px;
}
.total-row {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  margin-bottom: 20px;
}
.warning-box {
  background: #fee2e2;
  border-left: 3px solid #ef4444;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 0.8125rem;
  color: #991b1b;
  margin-bottom: 20px;
}
.warning-box p {
  margin: 0;
  line-height: 1.4;
}

.btn-order {
  display: block;
  width: 100%;
  background: #0f172a;
  color: #fff;
  border: none;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 600;
  padding: 16px;
  cursor: pointer;
  transition: background 0.25s;
  border-radius: 4px;
}
.btn-order:hover:not(:disabled) {
  background: #1e293b;
}
.btn-order:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}

.btn-outline {
  display: inline-block;
  border: 1px solid #0f172a;
  color: #0f172a;
  background: transparent;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  padding: 12px 32px;
  text-decoration: none;
  transition: all 0.2s;
  border-radius: 4px;
  margin-top: 16px;
}
.btn-outline:hover {
  background: #0f172a;
  color: #fff;
}

@media (max-width: 768px) {
  .reorder-container {
    grid-template-columns: 1fr;
  }
}
</style>
