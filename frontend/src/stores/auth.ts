import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi, type AuthUser } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)

  async function fetchMe() {
    loading.value = true
    try {
      user.value = await authApi.me()
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await authApi.logout()
    user.value = null
  }

  return { user, loading, fetchMe, logout }
})
