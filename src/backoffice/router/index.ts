import { createRouter, createWebHistory } from 'vue-router'
import ProductPage from '@back/pages/ProductPage.vue'
import ResetPage   from '@back/pages/ResetPage.vue'
import LoginPage   from '@back/pages/LoginPage.vue'
import AdminLayout from '@back/layouts/AdminLayout.vue'

const router = createRouter({
    history: createWebHistory('/admin/'),
    routes: [
        { path: '/login', component: LoginPage },
        {
            path: '/',
            component: AdminLayout,
            meta: { requiresAuth: true },
            children: [
                { path: '',        component: ProductPage },
                { path: 'reset',   component: ResetPage },
            ],
        },
    ],
})

router.beforeEach((to) => {
    const isAuth = !!localStorage.getItem('admin_token')
    if (to.meta.requiresAuth && !isAuth) {
        return { path: '/login' }
    }
})

export default router