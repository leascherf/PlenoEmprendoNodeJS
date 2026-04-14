<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { leadsApi } from '../api/leads'
import { ESTADO_COLORS, ESTADOS } from '../types'

const router = useRouter()

type Modo = 'porFecha' | 'estadoActual'
const modo = ref<Modo>('porFecha')

const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

const desde = ref(today)
const hasta = ref(tomorrow)

interface Row {
  estadoLead: string
  count: number
  porcentaje: string
}

const rows = ref<Row[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const titulo = ref('Métricas por Estado de Leads')

onMounted(() => loadMetrics())

async function loadMetrics() {
  loading.value = true
  error.value = null
  try {
    const params =
      modo.value === 'porFecha'
        ? { desde: desde.value, hasta: hasta.value }
        : {}
    const res = await leadsApi.getMetrics(
      modo.value === 'porFecha' ? desde.value : undefined,
      modo.value === 'porFecha' ? hasta.value : undefined
    )

    const total = res.byEstado.reduce((s, r) => s + r.count, 0)
    const sorted = [...res.byEstado].sort((a, b) => b.count - a.count)

    rows.value = sorted.map(r => ({
      estadoLead: r.estadoLead || 'Sin Estado',
      count: r.count,
      porcentaje: total > 0 ? ((r.count * 100) / total).toFixed(2) + '%' : '0%',
    }))

    if (modo.value === 'porFecha') {
      titulo.value = `Métricas por Estado de Leads (${desde.value} — ${hasta.value})`
    } else {
      titulo.value = 'Métricas por Estado de Leads (Estado Actual — Global)'
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Error al cargar métricas'
  } finally {
    loading.value = false
  }
}

const total = computed(() => rows.value.reduce((s, r) => s + r.count, 0))

function estadoBadge(estado: string): string {
  return ESTADO_COLORS[estado] ?? 'bg-gray-100 text-gray-600'
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">

    <!-- Header -->
    <header class="bg-white shadow-sm px-6 py-3 flex items-center gap-3">
      <button @click="router.push('/leads')" class="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1">
        ← Volver a Leads
      </button>
      <span class="text-gray-300">|</span>
      <h1 class="font-bold text-gray-800">Métricas</h1>
    </header>

    <div class="flex-1 p-6 max-w-3xl mx-auto w-full">

      <!-- Título dinámico -->
      <h2 class="text-xl font-bold text-gray-800 text-center mb-6">{{ titulo }}</h2>

      <!-- Controles -->
      <div class="bg-white rounded-xl shadow-sm p-5 mb-6 flex flex-wrap items-center gap-5">

        <!-- Modo -->
        <fieldset class="border border-gray-200 rounded-lg px-4 py-2">
          <legend class="text-xs font-semibold text-gray-500 px-1">Modo de Vista</legend>
          <div class="flex flex-col gap-1 mt-1">
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" v-model="modo" value="porFecha" @change="loadMetrics" />
              Ver por Fecha (iniciados en período)
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" v-model="modo" value="estadoActual" @change="loadMetrics" />
              Ver Estado Actual (todos los activos)
            </label>
          </div>
        </fieldset>

        <!-- Date pickers -->
        <div class="flex items-center gap-3" :class="{ 'opacity-40 pointer-events-none': modo === 'estadoActual' }">
          <div>
            <label class="text-xs text-gray-500 block mb-0.5">Fecha Inicio</label>
            <input type="date" v-model="desde" class="border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-0.5">Fecha Fin</label>
            <input type="date" v-model="hasta" class="border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
          <button
            @click="loadMetrics"
            class="mt-4 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition"
          >
            Filtrar
          </button>
        </div>
      </div>

      <!-- Tabla de métricas -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div v-if="loading" class="text-center py-12 text-gray-400">Cargando…</div>
        <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="px-5 py-3 text-left font-semibold text-gray-600 w-1/2">Estado</th>
              <th class="px-5 py-3 text-right font-semibold text-gray-600 w-1/4">Cantidad</th>
              <th class="px-5 py-3 text-right font-semibold text-gray-600 w-1/4">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.estadoLead"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="px-5 py-2.5">
                <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', estadoBadge(row.estadoLead)]">
                  {{ row.estadoLead }}
                </span>
              </td>
              <td class="px-5 py-2.5 text-right font-medium">{{ row.count }}</td>
              <td class="px-5 py-2.5 text-right text-gray-500">{{ row.porcentaje }}</td>
            </tr>

            <!-- Total -->
            <tr class="bg-gray-100 font-bold">
              <td class="px-5 py-2.5">TOTAL</td>
              <td class="px-5 py-2.5 text-right">{{ total }}</td>
              <td class="px-5 py-2.5 text-right">100%</td>
            </tr>

            <tr v-if="rows.length === 0">
              <td colspan="3" class="text-center py-10 text-gray-400">Sin datos para el período seleccionado.</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>
