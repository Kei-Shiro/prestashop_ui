import { createRouter, createWebHashHistory } from 'vue-router'
import LoginPage  from '@back/pages/LoginPage.vue'
import ImportPage from '@back/pages/ImportPage.vue'
import ResetPage  from '@back/pages/ResetPage.vue'
import OrdersPage from '@back/pages/OrdersPage.vue'
import CartsPage from '@back/pages/CartsPage.vue'
import DashboardPage from '@back/pages/DashboardPage.vue'
import StockPage from '@back/pages/StockPage.vue'
import StatsPage from '@back/pages/StatsPage.vue'
import { useAdminAuthStore } from '@shared/models/auth'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/login', component: LoginPage },
        { path: '/dashboard', component: DashboardPage, meta: { requiresAuth: true } },
        { path: '/stats', component: StatsPage, meta: { requiresAuth: true } },
        { path: '/stock', component: StockPage, meta: { requiresAuth: true } },
        { path: '/import', component: ImportPage, meta: { requiresAuth: true } },
        { path: '/reset',  component: ResetPage,  meta: { requiresAuth: true } },
        { path: '/orders', component: OrdersPage, meta: { requiresAuth: true } },
        { path: '/carts', component: CartsPage, meta: { requiresAuth: true } },
        { path: '/',       redirect: '/dashboard' },
        { path: '/:pathMatch(.*)*', redirect: '/' } // Catch-all route to prevent warnings
    ],
})

router.beforeEach((to) => {
    const adminAuthStore = useAdminAuthStore();
    if (to.meta.requiresAuth && !adminAuthStore.isAuthenticated) return { path: '/login' }
})

export default router