import { createRouter, createWebHashHistory } from 'vue-router'
import LoginPage  from '@back/pages/LoginPage.vue'
import ImportPage from '@back/pages/ImportPage.vue'
import ResetPage  from '@back/pages/ResetPage.vue'
import OrdersPage from '@back/pages/OrdersPage.vue'
import DashboardPage from '@back/pages/DashboardPage.vue'
import StockPage from '@back/pages/StockPage.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/login', component: LoginPage },
        { path: '/dashboard', component: DashboardPage, meta: { requiresAuth: true } },
        { path: '/stock', component: StockPage, meta: { requiresAuth: true } },
        { path: '/import', component: ImportPage, meta: { requiresAuth: true } },
        { path: '/reset',  component: ResetPage,  meta: { requiresAuth: true } },
        { path: '/orders', component: OrdersPage, meta: { requiresAuth: true } },
        { path: '/',       redirect: '/dashboard' },
        { path: '/:pathMatch(.*)*', redirect: '/' } // Catch-all route to prevent warnings
    ],
})

router.beforeEach((to) => {
    const token = localStorage.getItem('admin_token')
    if (to.meta.requiresAuth && !token) return { path: '/login' }
})

export default router