import api from './client'

export const authApi = {
  async login(password: string): Promise<void> {
    await api.post('/auth/login', { password })
  },

  async me(): Promise<{ authenticated: boolean }> {
    return api.get('/auth/me').then(r => r.data)
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
