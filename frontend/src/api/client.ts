import axios from 'axios'

const api = axios.create({
  // En dev: '/api' (Vite proxea a localhost:3001)
  // En prod: '/plenoEmprendo/api' (Nginx stripea el prefijo)
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) ?? '/api',
  withCredentials: true,
})

export default api
