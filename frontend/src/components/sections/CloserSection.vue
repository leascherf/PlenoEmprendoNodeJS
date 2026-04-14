<script setup lang="ts">
import type { LeadState } from '../../types'

const props = defineProps<{
  state: Partial<LeadState>
}>()

const emit = defineEmits<{
  'update:state': [value: Partial<LeadState>]
}>()

function update(patch: Partial<LeadState>) {
  emit('update:state', { ...props.state, ...patch })
}

function formatDate(val: string | null | undefined): string {
  if (!val) return '-'
  return new Date(val).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-5">
    <h3 class="font-semibold text-gray-700">Pasaje a Closer</h3>

    <div class="grid grid-cols-2 gap-3 items-center">
      <div>
        <p class="text-sm text-gray-600">Estado de Paso a Closer</p>
        <p class="text-sm text-gray-400 mt-0.5">
          Pasó el: {{ formatDate(state.fechaPasoACloser) }}
        </p>
      </div>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          :checked="state.pasoACloser"
          @change="update({ pasoACloser: ($event.target as HTMLInputElement).checked })"
        />
        Paso a Closer
      </label>
    </div>
  </div>
</template>
