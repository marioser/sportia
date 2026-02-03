<script setup lang="ts">
import type { CreateSetForm, Test, SwimStroke } from '~/types'

const props = defineProps<{
  modelValue: CreateSetForm
  tests: readonly Test[]
  swimStrokes: readonly SwimStroke[]
  poolLength?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CreateSetForm]
}>()

const form = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const updateField = <K extends keyof CreateSetForm>(key: K, value: CreateSetForm[K]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

// Auto-set pool length based on selected test
watch(
  () => form.value.testId,
  (testId) => {
    const test = props.tests.find((t) => t.id === testId)
    if (test) {
      const poolLength = test.pool_type === 'SCM' ? 25 : 50
      updateField('poolLengthM', poolLength)
    }
  }
)
</script>

<template>
  <div class="space-y-4">
    <TestSelector
      :model-value="form.testId"
      :tests="tests"
      :swim-strokes="swimStrokes"
      @update:model-value="updateField('testId', $event)"
    />

    <STimePicker
      :model-value="form.totalTimeMs"
      label="Tiempo total"
      required
      @update:model-value="updateField('totalTimeMs', $event)"
    />

    <div class="grid grid-cols-2 gap-4">
      <SNumberInput
        :model-value="form.poolLengthM"
        label="Largo de piscina"
        :min="25"
        :max="50"
        :step="25"
        unit="m"
        @update:model-value="updateField('poolLengthM', $event)"
      />

      <SNumberInput
        :model-value="form.attemptNo || 1"
        label="Intento #"
        :min="1"
        :max="99"
        @update:model-value="updateField('attemptNo', $event)"
      />
    </div>
  </div>
</template>
