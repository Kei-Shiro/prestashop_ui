<script setup lang="ts">
import { computed } from 'vue';
import type { CartItem } from '@shared/models/cart';

interface Props {
  item: CartItem;
}

interface Emits {
  updateQuantity: [productId: string | number, quantity: number, combinationId: string];
  remove: [productId: string | number, combinationId: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const productId = computed(() => props.item.product.id_product);
const combinationId = computed(() => props.item.id_product_attribute || '0');

const unitPrice = computed(() => {
  const price = typeof props.item.product.price === 'string'
    ? parseFloat(props.item.product.price)
    : props.item.product.price;
  return price;
});

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const productImage = computed(() => {
  const images = props.item.product.images;
  if (images && images.length > 0) {
    return images[0];
  }
  if (props.item.product.id_default_image) {
    // Note: This might need adjustment if using the proxy URL from productService
    return `/prestashop/api/images/products/${productId.value}/${props.item.product.id_default_image}`;
  }
  return '/img/no-image.jpg';
});

const handleDecrease = () => {
  if (props.item.quantity > 1) {
    emit('updateQuantity', productId.value, props.item.quantity - 1, combinationId.value);
  } else {
    emit('remove', productId.value, combinationId.value);
  }
};

const handleIncrease = () => {
  emit('updateQuantity', productId.value, props.item.quantity + 1, combinationId.value);
};

const handleRemove = () => {
  emit('remove', productId.value, combinationId.value);
};
</script>

<template>
  <div class="cart-item-row">
    <div class="cart-item-row__image">
      <img :src="productImage" :alt="item.product.name" />
    </div>

    <div class="cart-item-row__info">
      <h4 class="cart-item-row__name">{{ item.product.name }}</h4>
      <p v-if="combinationId !== '0'" class="cart-item-row__variant">
        Variante #{{ combinationId }}
      </p>
      <span class="cart-item-row__price">{{ formatPrice(unitPrice) }}</span>
    </div>

    <div class="cart-item-row__quantity">
      <button
        class="quantity-btn quantity-btn--decrease"
        @click="handleDecrease"
        aria-label="Diminuer la quantité"
      >
        −
      </button>
      <span class="quantity-value">{{ item.quantity }}</span>
      <button
        class="quantity-btn quantity-btn--increase"
        @click="handleIncrease"
        aria-label="Augmenter la quantité"
      >
        +
      </button>
    </div>

    <div class="cart-item-row__total">
      <span class="total-price">{{ formatPrice(item.total_price) }}</span>
    </div>

    <button
      class="cart-item-row__remove"
      @click="handleRemove"
      aria-label="Retirer du panier"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.cart-item-row {
  display: grid;
  grid-template-columns: 80px 1fr auto auto 40px;
  gap: var(--space-4, 1rem);
  align-items: center;
  padding: var(--space-4, 1rem);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.cart-item-row__image {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
  background-color: var(--color-bg, #f8fafc);
}

.cart-item-row__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-row__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 0.25rem);
}

.cart-item-row__name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-main, #1e293b);
  margin: 0;
  line-height: 1.4;
}

.cart-item-row__variant {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
  margin: 0;
}

.cart-item-row__price {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
}

.cart-item-row__quantity {
  display: flex;
  align-items: center;
  gap: var(--space-2, 0.5rem);
}

.quantity-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-sm, 4px);
  background-color: var(--color-surface, #ffffff);
  color: var(--color-text-main, #1e293b);
  font-size: 1rem;
  cursor: pointer;
  transition: var(--transition-fast, 150ms);
}

.quantity-btn:hover {
  background-color: var(--color-bg, #f8fafc);
  border-color: var(--color-text-muted, #64748b);
}

.quantity-btn:active {
  transform: scale(0.95);
}

.quantity-value {
  min-width: 32px;
  text-align: center;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-main, #1e293b);
}

.cart-item-row__total {
  min-width: 90px;
  text-align: right;
}

.total-price {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-main, #1e293b);
}

.cart-item-row__remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm, 4px);
  background-color: transparent;
  color: var(--color-text-muted, #64748b);
  font-size: 1.25rem;
  cursor: pointer;
  transition: var(--transition-fast, 150ms);
}

.cart-item-row__remove:hover {
  color: var(--color-danger, #b00020);
  background-color: rgba(176, 0, 32, 0.05);
}

/* Responsive */
@media (max-width: 640px) {
  .cart-item-row {
    grid-template-columns: 60px 1fr;
    grid-template-rows: auto auto auto;
    gap: var(--space-3, 0.75rem);
  }

  .cart-item-row__image {
    width: 60px;
    height: 60px;
    grid-row: span 2;
  }

  .cart-item-row__quantity {
    grid-column: 2;
    justify-self: start;
  }

  .cart-item-row__total {
    grid-column: 2;
    text-align: left;
  }

  .cart-item-row__remove {
    position: absolute;
    top: var(--space-2, 0.5rem);
    right: var(--space-2, 0.5rem);
  }
}
</style>