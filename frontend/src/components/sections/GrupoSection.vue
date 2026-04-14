<script setup lang="ts">
import type { Lead, LeadState } from '../../types'

const props = defineProps<{
  lead: Lead
  state: Partial<LeadState>
}>()

const emit = defineEmits<{
  'update:state': [value: Partial<LeadState>]
}>()

function update(patch: Partial<LeadState>) {
  emit('update:state', { ...props.state, ...patch })
}

function openWhatsApp() {
  const phone = props.lead.info.telefonoNormalizado || props.lead.info.telefono
  window.open(`https://wa.me/${phone}`, '_blank')
}

function sendToCloser() {
  const closerPhone = '' // no tenemos teléfono del closer en el modelo actual
  if (closerPhone) {
    window.open(`https://wa.me/${closerPhone}`, '_blank')
  } else {
    alert('No hay teléfono del closer disponible.')
  }
}

function formatDate(val: string | null | undefined): string {
  if (!val) return '-'
  return new Date(val).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-5">
    <h3 class="font-semibold text-gray-700">Grupo de WhatsApp</h3>

    <!-- Fecha creación grupo -->
    <div class="grid grid-cols-2 gap-3 items-center">
      <span class="text-sm text-gray-600">Fecha creación del grupo:</span>
      <span class="text-sm font-medium">{{ formatDate(state.fechaCreacionGrupo) }}</span>
    </div>

    <!-- Descripción -->
    <div>
      <label class="text-sm text-gray-600 block mb-1">Descripción para el grupo</label>
      <textarea
        :value="state.descripcionGrupo"
        @input="update({ descripcionGrupo: ($event.target as HTMLTextAreaElement).value })"
        rows="4"
        class="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
        placeholder="Descripción del grupo…"
      />
    </div>

    <!-- Acciones de creación -->
    <div>
      <p class="text-sm font-medium text-gray-600 mb-2">Acciones de creación</p>
      <div class="space-y-2">
        <button
          @click="sendToCloser"
          class="flex items-center gap-2 border border-green-500 text-green-700 px-3 py-1.5 rounded text-sm hover:bg-green-50 transition"
        >
          Enviar WhatsApp a Closer
        </button>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            :checked="state.addFoto"
            @change="update({ addFoto: ($event.target as HTMLInputElement).checked })"
          />
          Agregar Foto
        </label>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            :checked="state.agregarDescripcion"
            @change="update({ agregarDescripcion: ($event.target as HTMLInputElement).checked })"
          />
          Agregar Descripción al Grupo
        </label>
      </div>
    </div>

    <!-- Link enviado -->
    <div class="grid grid-cols-2 gap-3 items-center">
      <span class="text-sm text-gray-600">
        Estado "Enviar Link de Grupo"
        <span v-if="state.fechaEnvioLink" class="block text-xs text-gray-400">(Enviado el: {{ formatDate(state.fechaEnvioLink) }})</span>
      </span>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          :checked="state.linkEnviado"
          @change="update({ linkEnviado: ($event.target as HTMLInputElement).checked })"
        />
        Link Enviado
      </label>
    </div>

    <!-- Cliente en grupo -->
    <div class="grid grid-cols-2 gap-3 items-center">
      <span class="text-sm text-gray-600">Seguimiento — Cliente en grupo</span>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          :checked="state.clienteEnGrupo"
          @change="update({ clienteEnGrupo: ($event.target as HTMLInputElement).checked })"
        />
        Cliente en grupo
      </label>
    </div>

    <!-- Primer mensaje -->
    <div class="grid grid-cols-2 gap-3 items-center">
      <span class="text-sm text-gray-600">Plantilla Mensaje</span>
      <input
        :value="state.primerMensajeTipo"
        @input="update({ primerMensajeTipo: ($event.target as HTMLInputElement).value })"
        class="border border-gray-300 rounded px-2 py-1 text-sm"
        placeholder="Tipo de mensaje…"
      />
    </div>

    <!-- Enviar primer mensaje en grupo -->
    <div class="grid grid-cols-2 gap-3 items-center">
      <span class="text-sm text-gray-600">Enviar Primer Mensaje</span>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          :checked="state.enviarPrimerMensaje"
          @change="update({ enviarPrimerMensaje: ($event.target as HTMLInputElement).checked })"
        />
        Mensaje Enviado en grupo
      </label>
    </div>

    <!-- Seguimiento -->
    <div class="grid grid-cols-2 gap-3 items-center">
      <span class="text-sm text-gray-600">
        Reintentos de seguimiento: <strong>{{ state.reintentosSeguimiento ?? 0 }}</strong>
      </span>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          :checked="state.seguimientoMarcado"
          @change="update({ seguimientoMarcado: ($event.target as HTMLInputElement).checked })"
        />
        Marcar Seguimiento
      </label>
    </div>

    <!-- Abrir WhatsApp -->
    <button
      @click="openWhatsApp"
      class="flex items-center gap-2 border border-green-500 text-green-700 px-3 py-1.5 rounded text-sm hover:bg-green-50 transition"
    >
      Abrir WhatsApp
    </button>
  </div>
</template>
