<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-800">PlenoEmprendo</h1>
        <p class="text-gray-500 text-sm mt-1">Ingresá tu contraseña para continuar.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition disabled:opacity-50"
        >
          {{ loading ? 'Ingresando…' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(password.value)
    router.push('/leads')
  } catch (err: any) {
    const msg = err?.response?.data?.error
    error.value = msg === 'Contraseña incorrecta' ? 'Contraseña incorrecta.' : 'Error al iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>
