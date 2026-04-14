import api from './client'
import type { Lead, LeadState } from '../types'

export interface LeadsFilter {
  search?: string
  estadoLead?: string
  closer?: string
  soloConDuplicados?: boolean
  soloConSeguimiento?: boolean
  limit?: number
}

export interface LeadsResponse {
  leads: Lead[]
  total: number
  withDuplicates: number
  withFollowUp: number
}

export interface MetricsSummary {
  byEstado: { estadoLead: string; count: number }[]
}

export const leadsApi = {
  getAll(filter?: LeadsFilter): Promise<LeadsResponse> {
    return api.get('/leads', { params: filter }).then(r => r.data)
  },

  getById(contactId: string): Promise<Lead> {
    return api.get(`/leads/${contactId}`).then(r => r.data)
  },

  updateState(contactId: string, changes: Partial<LeadState>): Promise<Lead> {
    return api.put(`/leads/${contactId}`, changes).then(r => r.data)
  },

  sync(): Promise<{ success: boolean; added: number; updated: number }> {
    return api.post('/leads/sync').then(r => r.data)
  },

  getMetrics(desde?: string, hasta?: string): Promise<MetricsSummary> {
    return api.get('/leads/metrics/summary', { params: { desde, hasta } }).then(r => {
      const data = r.data
      // El backend devuelve leadsPorEstado como Record<string,number>; lo convertimos al formato esperado
      const byEstado = Object.entries(data.leadsPorEstado as Record<string, number>).map(
        ([estadoLead, count]) => ({ estadoLead, count })
      )
      return { byEstado }
    })
  },
}
