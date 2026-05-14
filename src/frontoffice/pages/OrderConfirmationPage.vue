<template>
  <div class="confirm-page">
    <div class="confirm-box">
      <div class="confirm-icon">OK</div>
      <h2 class="confirm-title">Merci pour votre commande !</h2>
      <p class="confirm-order">Votre numero de commande : <strong>{{ orderId }}</strong></p>
      <p class="confirm-email">Un email de confirmation vous a ete envoye.</p>
      <router-link to="/orders" class="btn-orders">Voir mes commandes</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const orderId = route.params.orderId;
</script>

<style scoped>
.confirm-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 64px 24px;
}
.confirm-box {
  max-width: 480px;
  width: 100%;
  text-align: center;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  border-radius: 4px;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #16a34a;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-title {
  font-family: Georgia, serif;
  font-size: 1.5rem;
  color: #14532d;
  margin: 0;
}
.confirm-order {
  font-size: 0.9375rem;
  color: #166534;
  margin: 0;
}
.confirm-email {
  font-size: 0.875rem;
  color: #15803d;
  margin: 0;
}
.btn-orders {
  display: inline-block;
  margin-top: 8px;
  border: 1px solid #0f172a;
  color: #0f172a;
  background: transparent;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
  padding: 10px 28px;
  text-decoration: none;
  transition: background 0.25s, color 0.25s;
}
.btn-orders:hover { background: #0f172a; color: #fff; }
</style>