import { createRouter, createWebHashHistory } from 'vue-router';
import UserSelectionPage from '../pages/UserSelectionPage.vue';
import ShopPage from '../pages/ShopPage.vue';
import ProductDetailPage from '../pages/ProductDetailPage.vue';
import CartPage from '../pages/CartPage.vue';
import CheckoutPage from '../pages/CheckoutPage.vue';
import OrderConfirmationPage from '../pages/OrderConfirmationPage.vue';
import MyOrdersPage from '../pages/MyOrderPage.vue';
import ReorderPage from '../pages/ReorderPage.vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import { useCustomerAuthStore as useAuthStore } from '@shared/models/auth';


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
      { path: 'orders', component: MyOrdersPage, meta: { requiresAuth: true } },
      { path: 'reorder', component: ReorderPage, meta: { requiresAuth: true } }
    ]
  },
  // Catch-all route to redirect /index.front.html to root
  { path: '/index.front.html', redirect: '/' },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  authStore.restoreSession();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/'; // redirige vers sélection utilisateur
  }
  
  return true;
});

export default router;