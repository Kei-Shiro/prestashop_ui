import { createRouter, createWebHistory } from 'vue-router';
import UserSelectionPage from '../pages/UserSelectionPage.vue';
import ShopPage from '../pages/ShopPage.vue';
import ProductDetailPage from '../pages/ProductDetailPage.vue';
import CartPage from '../pages/CartPage.vue';
import CheckoutPage from '../pages/CheckoutPage.vue';
import OrderConfirmationPage from '../pages/OrderConfirmationPage.vue';
import MyOrdersPage from '../pages/MyOrdersPage.vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', component: UserSelectionPage }, // nouvelle page d'accueil
      { path: 'shop', component: ShopPage, meta: { requiresAuth: false } },
      { path: 'product/:id', component: ProductDetailPage },
      { path: 'cart', component: CartPage },
      { path: 'checkout', component: CheckoutPage, meta: { requiresAuth: true } },
      { path: 'order-confirmation/:orderId', component: OrderConfirmationPage, meta: { requiresAuth: true } },
      { path: 'orders', component: MyOrdersPage, meta: { requiresAuth: true } }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  authStore.restoreSession();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/'); // redirige vers sélection utilisateur
  } else {
    next();
  }
});

export default router;