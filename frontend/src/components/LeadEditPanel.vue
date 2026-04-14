<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { Lead, LeadState } from '../types'
import WhatsappSection from './sections/WhatsappSection.vue'
import GrupoSection from './sections/GrupoSection.vue'
import CloserSection from './sections/CloserSection.vue'

const props = defineProps<{ lead: Lead }>()
const emit = defineEmits<{
  close: []
  save: [contactId: string, changes: Partial<LeadState>]
}>()

type Tab = 'whatsapp' | 'grupo' | 'closer'
const activeTab = ref<Tab>('whatsapp')

// Copia local del estado para editar sin mutar el store
const localState = reactive<Partial<LeadState>>({ ...props.lead.state })

watch(() => props.lead, (lead) => {
  Object.assign(localState, lead.state)
}, { immediate: true })

function save() {
  emit('save', props.lead.info.contactId, { ...localState })
}

function formatDate(val: string | null): string {
  if (!val) return '-'
  return new Date(val).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center" @click.self="emit('close')">
    <div class="bg-white w-full sm:w-[860px] max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col z-50">

      <!-- Header del panel -->
      <div class="px-6 pt-5 pb-3 border-b border-gray-200">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h2 class="font-bold text-lg text-gray-800">
              {{ lead.info.nombre }} — {{ lead.info.closer }}
            </h2>
            <p class="text-sm text-gray-500">
              Reunión: {{ formatDate(lead.info.fechaReunion) }} · Tel: {{ lead.info.telefono }}
            </p>
          </div>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <!-- Flags de control -->
        <div class="flex gap-4 mt-3">
          <label class="flex items-center gap-1.5 text-sm cursor-pointer select-none" :class="{ 'opacity-40 cursor-not-allowed': !localState.posibleDuplicado }">
            <input
              type="checkbox"
              v-model="localState.duplicadoChequeado"
              :disabled="!localState.posibleDuplicado"
            />
            Duplicado Chequeado
          </label>
          <label class="flex items-center gap-1.5 text-sm cursor-pointer select-none">
            <input type="checkbox" v-model="localState.cerradoManual" />
            Cerrado Manual
          </label>
        </div>
      </div>

      <!-- Nav lateral + contenido -->
      <div class="flex flex-1 overflow-hidden">

        <!-- Sidebar nav -->
        <nav class="w-44 border-r border-gray-200 pt-4 flex flex-col gap-1 px-3 shrink-0">
          <button
            :class="['nav-btn', activeTab === 'whatsapp' && 'nav-btn-active']"
            @click="activeTab = 'whatsapp'"
          >Whatsapp</button>
          <button
            :class="['nav-btn', activeTab === 'grupo' && 'nav-btn-active']"
            @click="activeTab = 'grupo'"
          >Grupo</button>
          <button
            :class="['nav-btn', activeTab === 'closer' && 'nav-btn-active']"
            @click="activeTab = 'closer'"
          >Pasaje a Closer</button>
        </nav>

        <!-- Sección activa -->
        <div class="flex-1 overflow-y-auto p-5">
          <WhatsappSection v-if="activeTab === 'whatsapp'" v-model:state="localState" :lead="lead" />
          <GrupoSection v-else-if="activeTab === 'grupo'" v-model:state="localState" :lead="lead" />
          <CloserSection v-else v-model:state="localState" />
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
        <button @click="emit('close')" class="btn-secondary">Cerrar</button>
        <button @click="save" class="btn-primary">Guardar</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.nav-btn {
  @apply w-full text-left px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-100 transition;
}
.nav-btn-active {
  @apply bg-blue-50 text-blue-700 font-semibold;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition text-sm;
}
.btn-secondary {
  @apply border border-gray-300 bg-white text-gray-700 px-4 py-1.5 rounded hover:bg-gray-50 transition text-sm;
}
</style>
