<template>
  <div class="checkout-page">
    <h1 class="page-title">Validation</h1>
    <form @submit.prevent="handleSubmit" class="checkout-form">

      <div v-if="authStore.isAnonymous" class="form-section">
        <div class="form-row">
          <input v-model="form.firstname" type="text" placeholder="Prenom" required class="form-input" />
          <input v-model="form.lastname" type="text" placeholder="Nom" required class="form-input" />
        </div>
        <input v-model="form.email" type="email" placeholder="Email" required class="form-input" :class="{ 'input-error': errors.email }" />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        <input v-model="form.phone" type="tel" placeholder="Telephone" required class="form-input" :class="{ 'input-error': errors.phone }" />
        <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
      </div>

      <div v-else class="user-info-box">
        <span class="user-name">{{ authStore.user?.firstname }} {{ authStore.user?.lastname }}</span>
        <span class="user-email">{{ authStore.user?.email }}</span>
      </div>

      <div class="form-section">
        <input v-model="form.address" type="text" placeholder="Adresse" required class="form-input" />
        <div class="form-row">
          <input v-model="form.city" type="text" placeholder="Ville" required class="form-input" />
          <div>
            <input v-model="form.postal_code" type="text" placeholder="Code postal" required class="form-input" :class="{ 'input-error': errors.postal_code }" />
            <span v-if="errors.postal_code" class="field-error">{{ errors.postal_code }}</span>
          </div>
        </div>
      </div>

      <div class="order-summary">
        <h3 class="summary-title">Recapitulatif</h3>
        <div class="summary-row">
          <span>Paiement</span>
          <span>A la livraison</span>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <span class="summary-amount">{{ cartStore.totalAmount }} &euro;</span>
        </div>
      </div>

      <button type="submit" :disabled="isSubmitting" class="btn-submit">
        <span v-if="isSubmitting" class="btn-spinner"></span>
        <span v-else>Confirmer la commande</span>
      </button>
      <p v-if="error" class="form-error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { useCheckout } from '@shared/composables/useCheckout';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const { submitOrder, loading, error } = useCheckout();

const form = reactive({
  firstname: authStore.user?.firstname || '',
  lastname: authStore.user?.lastname || '',
  email: authStore.user?.email || '',
  phone: '',
  address: '',
  city: '',
  postal_code: ''
});

// Validation
const errors = ref<Record<string, string>>({});

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-+()]{8,}$/;
  return phoneRegex.test(phone);
};

const validatePostalCode = (code: string): boolean => {
  const postalRegex = /^\d{5}$/;
  return postalRegex.test(code);
};

const isSubmitting = computed(() => loading.value);

const handleSubmit = () => {
  errors.value = {};

  if (!validateEmail(form.email)) {
    errors.value.email = 'Email invalide';
  }
  if (!validatePhone(form.phone)) {
    errors.value.phone = 'Telephone invalide (8 chiffres minimum)';
  }
  if (!validatePostalCode(form.postal_code)) {
    errors.value.postal_code = 'Code postal invalide (5 chiffres)';
  }

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  doSubmit();
};

const doSubmit = async () => {
  try {
    const orderId = await submitOrder(form);
    router.push(`/order-confirmation/${orderId}`);
  } catch (e) {
    console.error('Order submission failed:', e);
  }
};
</script>

<style scoped>
.checkout-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 24px;
}
.page-title {
  font-family: Georgia, serif;
  font-size: 2rem;
  color: #0f172a;
  text-align: center;
  margin: 0 0 40px;
  letter-spacing: -0.02em;
}
.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Form fields */
.form-section { display: flex; flex-direction: column; gap: 0; }
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }

.form-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid #cbd5e1;
  background: transparent;
  padding: 12px 0;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-input::placeholder { color: #94a3b8; }
.form-input:focus { border-bottom-color: #0f172a; }

/* User info */
.user-info-box {
  background: #f8fafc;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #f1f5f9;
}
.user-name { font-weight: 500; color: #0f172a; font-size: 0.9375rem; }
.user-email { font-size: 0.875rem; color: #475569; }

/* Summary */
.order-summary {
  background: #f8fafc;
  padding: 32px;
  border: 1px solid #f1f5f9;
}
.summary-title {
  font-family: Georgia, serif;
  font-size: 1.125rem;
  color: #0f172a;
  margin: 0 0 16px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #475569;
  margin-bottom: 8px;
}
.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #0f172a;
  border-top: 1px solid #e2e8f0;
  margin-top: 16px;
  padding-top: 16px;
}
.summary-amount {
  font-family: Georgia, serif;
  font-size: 1.25rem;
}

/* Submit */
.btn-submit {
  width: 100%;
  background: #0f172a;
  color: #fff;
  border: none;
  padding: 16px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.25s;
}
.btn-submit:hover:not(:disabled) { background: #1e293b; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.form-error {
  color: #7f1d1d;
  text-align: center;
  font-size: 0.8125rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}
.input-error { border-bottom-color: #dc2626 !important; }
.field-error {
  display: block;
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 4px;
}
</style>