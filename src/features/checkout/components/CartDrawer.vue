<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@features/checkout/stores/cartStore';
import CartItemRow from './CartItemRow.vue';
import BaseButton from '@shared/ui/components/BaseButton.vue';

interface Props {
  show: boolean;
}

interface Emits {
  close: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();
const cartStore = useCartStore();

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const isEmpty = computed(() => cartStore.items.length === 0);

const handleUpdateQuantity = (productId: string | number, quantity: number, combinationId: string) => {
  cartStore.updateQuantity(productId, quantity, combinationId);
};

const handleRemove = (productId: string | number, combinationId: string) => {
  cartStore.removeProduct(productId, combinationId);
};

const handleClose = () => {
  emit('close');
};

const handleCheckout = () => {
  handleClose();
  router.push('/checkout');
};
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="cart-drawer-backdrop"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="slide">
      <div v-if="show" class="cart-drawer">
        <!-- Header -->
        <div class="cart-drawer__header">
          <h2 class="cart-drawer__title">Mon panier</h2>
          <button
            class="cart-drawer__close"
            @click="handleClose"
            aria-label="Fermer le panier"
          >
            ×
          </button>
        </div>

        <!-- Body -->
        <div class="cart-drawer__body">
          <!-- Empty state -->
          <div v-if="isEmpty" class="cart-drawer__empty">
            <div class="cart-drawer__empty-icon">🛒</div>
            <p class="cart-drawer__empty-text">Votre panier est vide</p>
          </div>

          <!-- Items list -->
          <div v-else class="cart-drawer__items">
            <CartItemRow
              v-for="item in cartStore.items"
              :key="String(item.product.id_product) + '-' + (item.id_product_attribute || '0')"
              :item="item"
              @update-quantity="handleUpdateQuantity"
              @remove="handleRemove"
            />
          </div>
        </div>

        <!-- Footer -->
        <div v-if="!isEmpty" class="cart-drawer__footer">
          <div class="cart-drawer__total">
            <span class="cart-drawer__total-label">Total</span>
            <span class="cart-drawer__total-value">{{ formatPrice(cartStore.totalAmount) }}</span>
          </div>
          <BaseButton
            variant="primary"
            size="lg"
            class="cart-drawer__checkout"
            @click="handleCheckout"
          >
            Passer commande
          </BaseButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cart-drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 480px;
  background-color: var(--color-surface, #ffffff);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.cart-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6, 1.5rem);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.cart-drawer__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-main, #1e293b);
  margin: 0;
}

.cart-drawer__close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm, 4px);
  background-color: transparent;
  color: var(--color-text-muted, #64748b);
  font-size: 1.5rem;
  cursor: pointer;
  transition: var(--transition-fast, 150ms);
}

.cart-drawer__close:hover {
  color: var(--color-text-main, #1e293b);
  background-color: var(--color-bg, #f8fafc);
}

.cart-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4, 1rem);
}

.cart-drawer__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--space-8, 2rem);
  text-align: center;
}

.cart-drawer__empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4, 1rem);
  opacity: 0.5;
}

.cart-drawer__empty-text {
  font-size: 1rem;
  color: var(--color-text-muted, #64748b);
  margin: 0;
}

.cart-drawer__items {
  display: flex;
  flex-direction: column;
}

.cart-drawer__footer {
  padding: var(--space-6, 1.5rem);
  border-top: 1px solid var(--color-border, #e2e8f0);
  background-color: var(--color-surface, #ffffff);
}

.cart-drawer__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4, 1rem);
}

.cart-drawer__total-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-main, #1e293b);
}

.cart-drawer__total-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-main, #1e293b);
}

.cart-drawer__checkout {
  width: 100%;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 300ms ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 640px) {
  .cart-drawer {
    max-width: 100%;
  }
}
</style>