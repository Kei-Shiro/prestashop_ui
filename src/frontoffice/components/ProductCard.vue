<template>
  <div class="card" @mouseenter="hovered = true" @mouseleave="hovered = false">
    <div class="card-badges">
      <span v-if="isHot" class="badge badge-hot">HOT</span>
      <span v-if="isNew" class="badge badge-new">NEW</span>
    </div>
    <div class="card-img" @click="goToDetails">
      <img :src="imageUrl" :alt="product.name" :class="['card-img-inner', hovered && 'card-img-zoom']" />
      <div :class="['card-img-overlay', hovered && 'card-img-overlay-visible']"></div>
    </div>
    <div class="card-body">
      <h2 class="card-name" @click="goToDetails">{{ product.name }}</h2>
      <p class="card-price">{{ product.price }} &euro;</p>
      <button class="card-btn" @click="addToCart">Ajouter</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Product } from '@shared/types/product';
import { useCartStore } from '../stores/cart';
import productService from '../../shared/services/product-service';

const props = defineProps<{ product: Product }>();
const cartStore = useCartStore();
const router = useRouter();
const hovered = ref(false);

const imageUrl = computed(() =>
    productService.getImageUrl(props.product.id_product, props.product.id_default_image)
);
const goToDetails = () => router.push(`/product/${props.product.id_product}`);
const addToCart = () => cartStore.addProduct(props.product, 1);

const isHot = computed(() => {
  if (!props.product.date_add) return false;
  const diff = Math.floor((Date.now() - new Date(props.product.date_add).getTime()) / 86400000);
  return diff <= 1 && diff >= 0;
});
const isNew = computed(() => {
  if (!props.product.date_add) return false;
  const diff = Math.floor((Date.now() - new Date(props.product.date_add).getTime()) / 86400000);
  return diff > 1 && diff <= 7;
});
</script>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}

/* Badges */
.card-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  gap: 6px;
}
.badge {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 3px 10px;
  font-weight: 500;
  color: #fff;
}
.badge-hot { background: #7f1d1d; }
.badge-new { background: #0f172a; }

/* Image */
.card-img {
  position: relative;
  aspect-ratio: 4/5;
  overflow: hidden;
  background: #f8fafc;
  cursor: pointer;
}
.card-img-inner {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.6s ease;
}
.card-img-zoom { transform: scale(1.05); }
.card-img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.05);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.card-img-overlay-visible { opacity: 1; }

/* Body */
.card-body {
  padding: 20px 4px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  text-align: center;
  gap: 4px;
}
.card-name {
  font-family: Georgia, serif;
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  transition: color 0.2s;
}
.card-name:hover { color: #64748b; }
.card-price {
  font-size: 0.875rem;
  color: #64748b;
  letter-spacing: 0.05em;
  margin: 0 0 12px;
}
.card-btn {
  margin-top: auto;
  width: 100%;
  border: 1px solid #0f172a;
  background: transparent;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 500;
  padding: 12px;
  cursor: pointer;
  transition: background 0.25s, color 0.25s;
}
.card-btn:hover {
  background: #0f172a;
  color: #fff;
}
</style>