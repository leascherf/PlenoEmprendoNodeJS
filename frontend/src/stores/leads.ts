import { defineStore } from 'pinia'
import { ref } from 'vue'
import { leadsApi, type LeadsFilter } from '../api/leads'
import type { Lead } from '../types'

export const useLeadsStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([])
  const total = ref(0)
  const withDuplicates = ref(0)
  const withFollowUp = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const syncing = ref(false)

  async function fetchLeads(filter?: LeadsFilter) {
    loading.value = true
    error.value = null
    try {
      const res = await leadsApi.getAll(filter)
      leads.value = res.leads
      total.value = res.total
      withDuplicates.value = res.withDuplicates
      withFollowUp.value = res.withFollowUp
    } catch (e: any) {
      error.value = e?.response?.data?.error ?? 'Error al cargar leads'
    } finally {
      loading.value = false
    }
  }

  async function updateLead(contactId: string, changes: Partial<Lead['state']>) {
    const updated = await leadsApi.updateState(contactId, changes)
    const idx = leads.value.findIndex(l => l.info.contactId === contactId)
    if (idx !== -1) leads.value[idx] = updated
    return updated
  }

  async function sync() {
    syncing.value = true
    try {
      return await leadsApi.sync()
    } finally {
      syncing.value = false
    }
  }

  return { leads, total, withDuplicates, withFollowUp, loading, error, syncing, fetchLeads, updateLead, sync }
})
