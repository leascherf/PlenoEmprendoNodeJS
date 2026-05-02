import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory('/plenoEmprendo/'),
  routes: [
    {
      path: '/',
      redirect: '/leads',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/leads',
      name: 'leads',
      component: () => import('../views/LeadsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/metrics',
      name: 'metrics',
      component: () => import('../views/MetricsView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      await auth.fetchMe()
    }
    if (!auth.isAuthenticated) {
      return { name: 'login' }
    }
  }
})

export default router
