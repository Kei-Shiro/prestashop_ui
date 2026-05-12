import { createRouter, createWebHashHistory } from 'vue-router';
import ShopLayout from '../layouts/ShopLayout.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: ShopLayout,
      children: [
        { path: '', name: 'Home', component: () => import('../pages/HomePage.vue') },
        { path: 'product/:id', name: 'ProductDetail', component: () => import('../pages/ProductDetailPage.vue') },
        { path: 'checkout', name: 'Checkout', component: () => import('../pages/CheckoutPage.vue') },
        { path: 'my-orders', name: 'MyOrders', component: () => import('../pages/MyOrdersPage.vue') },
        { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: '/' }
      ]
    }
  ]
});

export default router;
