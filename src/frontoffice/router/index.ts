import { createRouter, createWebHashHistory } from 'vue-router';
import ShopLayout from '../layouts/ShopLayout.vue';
import HomePage from '../pages/HomePage.vue';
import ProductDetailPage from '../pages/ProductDetailPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: ShopLayout,
      children: [
        { path: '', component: HomePage },
        { path: 'product/:id', component: ProductDetailPage }
      ]
    }
  ]
});

export default router;
