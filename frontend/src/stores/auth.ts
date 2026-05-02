import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const loading = ref(false)

  async function fetchMe() {
    loading.value = true
    try {
      const res = await authApi.me()
      isAuthenticated.value = res.authenticated === true
    } catch {
      isAuthenticated.value = false
    } finally {
      loading.value = false
    }
  }

  async function login(password: string) {
    await authApi.login(password)
    isAuthenticated.value = true
  }

  async function logout() {
    await authApi.logout()
    isAuthenticated.value = false
  }

  return { isAuthenticated, loading, fetchMe, login, logout }
})
