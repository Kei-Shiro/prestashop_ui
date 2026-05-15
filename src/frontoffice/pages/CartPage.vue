<template>
  <div class="cart-page">
    <h1 class="page-title">Votre Panier</h1>

    <div v-if="cartStore.items.length === 0" class="cart-empty">
      <p class="cart-empty-text">Votre panier est actuellement vide.</p>
      <router-link to="/shop" class="btn-outline">Decouvrir la collection</router-link>
    </div>

    <div v-else>
      <div class="cart-list">
        <div v-for="item in cartStore.items" :key="item.product.id_product" class="cart-item">
          <div class="cart-item-img">
            <img :src="getImageUrl(item.product)" class="cart-img" />
          </div>
          <div class="cart-item-info">
            <h3 class="cart-item-name">{{ item.product.name }}</h3>
            <p class="cart-item-price">{{ item.product.price }} &euro;</p>          </div>
          <div class="qty-ctrl">
            <button class="qty-btn" @click="cartStore.updateQuantity(item.product.id_product, item.quantity - 1)">&minus;</button>
            <span class="qty-val">{{ item.quantity }}</span>
            <button class="qty-btn" @click="cartStore.updateQuantity(item.product.id_product, item.quantity + 1)">&plus;</button>
          </div>
          <div class="cart-item-total">{{ Number(item.total_price).toFixed(2) }} &euro;</div>
          <button class="cart-remove" @click="cartStore.removeProduct(item.product.id_product)">Retirer</button>
        </div>
      </div>

      <div class="cart-footer">
        <div class="cart-subtotal">
          <span class="subtotal-label">Sous-total</span>
          <span class="subtotal-amount">{{ cartStore.totalAmount.toFixed(2) }} &euro;</span>
        </div>
        <router-link to="/checkout" class="btn-primary">Proceder au paiement</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import productService from '@features/catalog/services/product-service';
import {useCartStore} from "@features/checkout/stores/cartStore";

const cartStore = useCartStore();
const getImageUrl = (product: any) =>
    productService.getImageUrl(product.id_product, product.id_default_image);
</script>

<style scoped>
.cart-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 64px 24px;
}
.page-title {
  font-family: Georgia, serif;
  font-size: 2rem;
  color: #0f172a;
  text-align: center;
  margin: 0 0 48px;
  letter-spacing: -0.02em;
}

/* Empty */
.cart-empty {
  text-align: center;
  padding: 80px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.cart-empty-text {
  color: #64748b;
  letter-spacing: 0.04em;
  margin: 0 0 24px;
}

/* List */
.cart-list { border-top: 1px solid #e2e8f0; }
.cart-item {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px 0;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.cart-item-img {
  width: 80px;
  height: 104px;
  background: #f8fafc;
  overflow: hidden;
  flex-shrink: 0;
}
.cart-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.cart-item:hover .cart-img { transform: scale(1.05); }
.cart-item-info { flex: 1; min-width: 120px; }
.cart-item-name {
  font-family: Georgia, serif;
  font-size: 1rem;
  color: #0f172a;
  margin: 0 0 4px;
}
.cart-item-price { font-size: 0.875rem; color: #64748b; margin: 0; }

/* Qty */
.qty-ctrl {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  height: 40px;
}
.qty-btn {
  padding: 0 12px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.2s;
  height: 100%;
}
.qty-btn:hover { color: #0f172a; }
.qty-val {
  width: 32px;
  text-align: center;
  font-size: 0.875rem;
}

.cart-item-total {
  width: 80px;
  text-align: right;
  font-weight: 500;
  color: #0f172a;
}
.cart-remove {
  background: none;
  border: none;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
}
.cart-remove:hover { color: #7f1d1d; }

/* Footer */
.cart-footer {
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 24px;
}
.cart-subtotal {
  display: flex;
  justify-content: space-between;
  width: 320px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}
.subtotal-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}
.subtotal-amount {
  font-family: Georgia, serif;
  font-size: 1.25rem;
  color: #0f172a;
}

/* Buttons */
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
  transition: background 0.25s, color 0.25s;
}
.btn-outline:hover { background: #0f172a; color: #fff; }
.btn-primary {
  display: block;
  width: 320px;
  text-align: center;
  background: #0f172a;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  padding: 16px 32px;
  text-decoration: none;
  transition: background 0.25s;
}
.btn-primary:hover { background: #1e293b; }

@media (max-width: 600px) {
  .cart-item { justify-content: center; text-align: center; }
  .cart-item-total, .cart-subtotal, .btn-primary { width: 100%; }
}
</style>