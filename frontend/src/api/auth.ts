import api from './client'

export interface AuthUser {
  id: string
  email: string
  name: string
  picture?: string
}

export const authApi = {
  me(): Promise<AuthUser> {
    return api.get('/auth/me').then(r => r.data)
  },

  logout(): Promise<void> {
    return api.post('/auth/logout').then(() => undefined)
  },
}
