import { createRouter, createWebHashHistory } from 'vue-router';
import ShopLayout from '../layouts/ShopLayout.vue';
import HomePage from '../pages/HomePage.vue';
import ProductDetailPage from '../pages/ProductDetailPage.vue';
import CheckoutPage from '../pages/CheckoutPage.vue';
import MyOrdersPage from '../pages/MyOrdersPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: ShopLayout,
      children: [
        { path: '', component: HomePage },
        { path: 'product/:id', component: ProductDetailPage },
        { path: 'checkout', component: CheckoutPage },
        { path: 'my-orders', component: MyOrdersPage }
      ]
    }
  ]
});

export default router;