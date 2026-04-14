<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useLeadsStore } from '../stores/leads'
import { ESTADO_COLORS, ESTADO_ROW_COLORS, ESTADOS, type Lead } from '../types'
import LeadEditPanel from '../components/LeadEditPanel.vue'

const auth = useAuthStore()
const store = useLeadsStore()
const router = useRouter()

// ── Filtros ──────────────────────────────────────────────
const search = ref('')
const estadoFilter = ref('')
const soloConDuplicados = ref(false)
const soloConSeguimiento = ref(false)
const incluirFinalizados = ref(false)
const incluirCerradosManuales = ref(false)
const quickFilter = ref('Todos')

const QUICK_FILTERS = ['Todos', 'Leads de hoy', 'Leads de ayer', 'Esta semana', 'Este mes', 'Este año']

// ── Lead seleccionado para edición ──────────────────────
const selectedLead = ref<Lead | null>(null)

// ── Carga ────────────────────────────────────────────────
onMounted(() => loadLeads())

async function loadLeads() {
  await store.fetchLeads({
    search: search.value || undefined,
    estadoLead: estadoFilter.value || undefined,
    soloConDuplicados: soloConDuplicados.value || undefined,
    soloConSeguimiento: soloConSeguimiento.value || undefined,
  })
}

// ── Filtrado client-side para toggles rápidos ────────────
const filteredLeads = computed(() => {
  let list = store.leads

  if (!incluirFinalizados.value) {
    list = list.filter(l => l.state.estadoLead !== 'FINALIZADO')
  }
  if (!incluirCerradosManuales.value) {
    list = list.filter(l => !l.state.cerradoManual)
  }
  if (quickFilter.value !== 'Todos') {
    const now = new Date()
    list = list.filter(l => {
      const fecha = l.info.fechaAgendado ? new Date(l.info.fechaAgendado) : null
      if (!fecha) return false
      const d = fecha
      if (quickFilter.value === 'Leads de hoy') return isSameDay(d, now)
      if (quickFilter.value === 'Leads de ayer') return isSameDay(d, addDays(now, -1))
      if (quickFilter.value === 'Esta semana') return isSameWeek(d, now)
      if (quickFilter.value === 'Este mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (quickFilter.value === 'Este año') return d.getFullYear() === now.getFullYear()
      return true
    })
  }
  return list
})

function applySearch() {
  loadLeads()
}

function resetFilters() {
  search.value = ''
  estadoFilter.value = ''
  soloConDuplicados.value = false
  soloConSeguimiento.value = false
  incluirFinalizados.value = false
  incluirCerradosManuales.value = false
  quickFilter.value = 'Todos'
  loadLeads()
}

async function handleSync() {
  const res = await store.sync()
  alert(`Sincronización completada: ${res.added} agregados, ${res.updated} existentes`)
  await loadLeads()
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

function rowClass(lead: Lead): string {
  return ESTADO_ROW_COLORS[lead.state.estadoLead] ?? ''
}

function estadoBadge(estado: string): string {
  return ESTADO_COLORS[estado] ?? 'bg-gray-100 text-gray-600'
}

// ── helpers de fecha ─────────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function isSameWeek(d: Date, now: Date) {
  const startOfWeek = addDays(now, -now.getDay())
  const endOfWeek = addDays(startOfWeek, 6)
  return d >= startOfWeek && d <= endOfWeek
}

function formatDate(val: string | null): string {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function onLeadSaved(contactId: string, changes: Partial<Lead['state']>) {
  await store.updateLead(contactId, changes)
  selectedLead.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">

    <!-- Header -->
    <header class="bg-white shadow-sm px-4 py-2 flex items-center gap-2 flex-wrap">
      <span class="font-bold text-gray-800 mr-2 whitespace-nowrap">PlenoEmprendo</span>

      <!-- Búsqueda -->
      <input
        v-model="search"
        @keyup.enter="applySearch"
        placeholder="Buscar nombre, teléfono, email…"
        class="border border-gray-300 rounded px-2 py-1 text-sm w-48"
      />
      <button @click="applySearch" class="btn-secondary text-sm">Buscar</button>

      <!-- Filtro rápido por fecha -->
      <select v-model="quickFilter" class="border border-gray-300 rounded px-2 py-1 text-sm">
        <option v-for="q in QUICK_FILTERS" :key="q">{{ q }}</option>
      </select>

      <!-- Filtro por estado -->
      <select v-model="estadoFilter" @change="loadLeads" class="border border-gray-300 rounded px-2 py-1 text-sm">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
      </select>

      <!-- Toggles -->
      <button
        :class="['btn-toggle', soloConDuplicados && 'btn-toggle-active']"
        @click="soloConDuplicados = !soloConDuplicados; loadLeads()"
      >
        {{ soloConDuplicados ? 'Mostrar todos' : 'Mostrar Duplicados' }}
        <span v-if="store.withDuplicates" class="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{{ store.withDuplicates }}</span>
      </button>

      <button
        :class="['btn-toggle', soloConSeguimiento && 'btn-toggle-active']"
        @click="soloConSeguimiento = !soloConSeguimiento; loadLeads()"
      >
        {{ soloConSeguimiento ? 'Mostrar todos' : 'Leads en Seguimiento' }}
        <span v-if="store.withFollowUp" class="ml-1 bg-orange-500 text-white text-xs rounded-full px-1">{{ store.withFollowUp }}</span>
      </button>

      <button
        :class="['btn-toggle', incluirFinalizados && 'btn-toggle-active']"
        @click="incluirFinalizados = !incluirFinalizados"
      >
        {{ incluirFinalizados ? 'Excluir finalizados' : 'Incluir finalizados' }}
      </button>

      <button
        :class="['btn-toggle', incluirCerradosManuales && 'btn-toggle-active']"
        @click="incluirCerradosManuales = !incluirCerradosManuales"
      >
        {{ incluirCerradosManuales ? 'Excluir cerrados manual' : 'Incluir cerrados manual' }}
      </button>

      <button @click="resetFilters" class="btn-secondary text-sm">Resetear</button>

      <!-- Reload + Sync -->
      <button @click="loadLeads" :disabled="store.loading" class="btn-secondary text-sm" title="Recargar">
        <span :class="store.loading ? 'animate-spin' : ''">↻</span>
      </button>
      <button @click="handleSync" :disabled="store.syncing" class="btn-secondary text-sm">
        {{ store.syncing ? 'Sincronizando…' : 'Sincronizar' }}
      </button>

      <div class="flex-1" />

      <!-- Métricas + usuario -->
      <RouterLink to="/metrics" class="btn-primary text-sm">Métricas</RouterLink>

      <div class="flex items-center gap-2">
        <img v-if="auth.user?.picture" :src="auth.user.picture" class="w-7 h-7 rounded-full" />
        <span class="text-sm text-gray-700">{{ auth.user?.name }}</span>
        <button @click="logout" class="btn-secondary text-sm">Salir</button>
      </div>
    </header>

    <!-- Status bar -->
    <div class="bg-gray-200 px-4 py-1 text-xs text-gray-600 flex gap-4">
      <span>Total: <strong>{{ filteredLeads.length }}</strong></span>
      <span v-if="store.error" class="text-red-600">{{ store.error }}</span>
    </div>

    <!-- Tabla -->
    <div class="flex-1 overflow-auto">
      <div v-if="store.loading" class="flex items-center justify-center h-40 text-gray-500">Cargando…</div>
      <table v-else class="w-full text-sm border-collapse">
        <thead class="bg-white sticky top-0 shadow-sm">
          <tr>
            <th class="th">Nombre</th>
            <th class="th">Teléfono</th>
            <th class="th">Email</th>
            <th class="th">Closer</th>
            <th class="th">Estado Lead</th>
            <th class="th">Fecha Agendado</th>
            <th class="th">Flags</th>
            <th class="th w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="lead in filteredLeads"
            :key="lead.info.contactId"
            :class="['border-b border-gray-200 hover:brightness-95 cursor-pointer', rowClass(lead)]"
            @click="selectedLead = lead"
          >
            <td class="td font-medium">{{ lead.info.nombre }}</td>
            <td class="td">{{ lead.info.telefono }}</td>
            <td class="td">{{ lead.info.email }}</td>
            <td class="td">{{ lead.info.closer }}</td>
            <td class="td">
              <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', estadoBadge(lead.state.estadoLead)]">
                {{ lead.state.estadoLead || '—' }}
              </span>
            </td>
            <td class="td whitespace-nowrap">{{ formatDate(lead.info.fechaAgendado) }}</td>
            <td class="td">
              <span v-if="lead.state.posibleDuplicado && !lead.state.duplicadoChequeado" class="flag-badge bg-red-100 text-red-700">DUP</span>
              <span v-if="lead.state.cerradoManual" class="flag-badge bg-gray-200 text-gray-600">CERRADO</span>
              <span v-if="lead.state.seguimientoMarcado" class="flag-badge bg-orange-100 text-orange-700">SEGUIM.</span>
            </td>
            <td class="td text-center">
              <button
                class="text-gray-400 hover:text-blue-600 text-lg leading-none"
                @click.stop="selectedLead = lead"
                title="Editar"
              >⚙</button>
            </td>
          </tr>
          <tr v-if="filteredLeads.length === 0">
            <td colspan="8" class="text-center py-12 text-gray-400">No hay leads que coincidan con los filtros.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Panel de edición -->
    <LeadEditPanel
      v-if="selectedLead"
      :lead="selectedLead"
      @close="selectedLead = null"
      @save="onLeadSaved"
    />
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.th {
  @apply px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200;
}
.td {
  @apply px-3 py-2;
}
.btn-primary {
  @apply bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition;
}
.btn-secondary {
  @apply border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded hover:bg-gray-50 transition;
}
.btn-toggle {
  @apply border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50 transition flex items-center;
}
.btn-toggle-active {
  @apply bg-blue-50 border-blue-400 text-blue-700;
}
.flag-badge {
  @apply inline-block text-xs font-bold px-1.5 py-0.5 rounded mr-1;
}
</style>
