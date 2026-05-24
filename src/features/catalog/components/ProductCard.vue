<template>
  <div class="product-card" @mouseenter="hovered = true" @mouseleave="hovered = false">
    <div class="image-wrap" @click="goToDetails">
      <div class="badge-wrap">
        <span v-if="isHot" class="badge-s badge-hot">HOT</span>
        <span v-if="isNew" class="badge-s badge-new">NEW</span>
      </div>
      <img :src="imageUrl" :alt="product.name" class="product-img" />
      
      <div class="quick-view" :class="{ 'view-visible': hovered }">
        <button class="btn-quick" @click.stop="addToCart">Add to Cart</button>
      </div>
    </div>
    
    <div class="product-info">
      <div class="info-top">
        <h3 class="product-title" @click="goToDetails">{{ product.name }}</h3>
        <span class="product-price">{{ product.price }}€</span>
      </div>
      <p class="product-cat">{{ product.category || 'Collection' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Product, productService } from '@shared/models/product';
import { useCartStore } from '@shared/models/cart';

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
  const dateStr = props.product.date_availability;
  if (!dateStr) return false;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return diff >= 0 && diff <= 1;
});

const isNew = computed(() => {
  const dateStr = props.product.date_availability;
  if (!dateStr) return false;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return diff > 1 && diff <= 7;
});
</script>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  background: transparent;
  transition: opacity 0.3s;
}

.image-wrap {
  position: relative;
  aspect-ratio: 1;
  background-color: #f7f7f7;
  overflow: hidden;
  cursor: pointer;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover .product-img {
  transform: scale(1.05);
}

.badge-wrap {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.badge-s {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.3rem 0.6rem;
  font-weight: 600;
  background: #fff;
  color: #111;
  border: 1px solid #eeeeee;
}

.badge-hot {
  background: #111;
  color: #fff;
  border: none;
}

.quick-view {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.view-visible {
  transform: translateY(0);
}

.btn-quick {
  width: 100%;
  background: #111;
  color: #fff;
  border: none;
  padding: 0.8rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-quick:hover {
  background: #333;
}

/* Info */
.product-info {
  padding: 1.25rem 0;
}

.info-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.3rem;
}

.product-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: #111;
  margin: 0;
  cursor: pointer;
}

.product-price {
  font-size: 0.95rem;
  font-weight: 400;
  color: #111;
}

.product-cat {
  font-size: 0.75rem;
  color: #888;
  margin: 0;
}
</style>