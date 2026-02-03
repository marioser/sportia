<script setup lang="ts">
import type { ObjectiveScope, CreateObjectiveForm } from '~/composables/useObjectives'

definePageMeta({})

const router = useRouter()
const { primaryClubId } = useProfile()
const { testOptions, fetchTests } = useCatalogs()
const { loading, createObjective } = useObjectives()

// Fetch tests on mount
onMounted(() => {
  fetchTests()
})

// Form state
const form = reactive<CreateObjectiveForm>({
  test_id: '',
  target_time_ms: 0,
  scope: 'CLUB',
  club_id: undefined,
})

// Time input in mm:ss.cc format
const timeInput = ref('')

// Parse time string to milliseconds
const parseTimeToMs = (time: string): number => {
  // Format: mm:ss.cc or ss.cc
  const parts = time.split(':')
  let minutes = 0
  let secondsAndCentis = ''

  if (parts.length === 2) {
    minutes = parseInt(parts[0]) || 0
    secondsAndCentis = parts[1]
  } else {
    secondsAndCentis = parts[0]
  }

  const [seconds, centis] = secondsAndCentis.split('.')
  const secs = parseInt(seconds) || 0
  const cs = parseInt((centis || '0').padEnd(2, '0').slice(0, 2)) || 0

  return (minutes * 60 + secs) * 1000 + cs * 10
}

// Watch time input and update form
watch(timeInput, (val) => {
  form.target_time_ms = parseTimeToMs(val)
})

// Scope options
const scopeOptions = [
  { value: 'CLUB', label: 'Solo mi club' },
  { value: 'GLOBAL', label: 'Global (todos los clubes)' },
]

// Validation
const isValid = computed(() => {
  return form.test_id && form.target_time_ms > 0
})

// Submit
const saving = ref(false)
const handleSubmit = async () => {
  if (!isValid.value) return

  saving.value = true

  // Set club_id based on scope
  if (form.scope === 'CLUB') {
    form.club_id = primaryClubId.value || undefined
  } else {
    form.club_id = undefined
  }

  const created = await createObjective(form)
  saving.value = false

  if (created) {
    router.push('/objectives')
  }
}
</script>

<template>
  <div>
    <SPageHeader
      title="Nuevo Objetivo"
      back-to="/objectives"
    />

    <UCard>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Test selection -->
        <UFormGroup label="Prueba" required>
          <USelectMenu
            v-model="form.test_id"
            :options="testOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Selecciona una prueba"
            searchable
          />
        </UFormGroup>

        <!-- Target time -->
        <UFormGroup label="Tiempo objetivo" required hint="Formato: mm:ss.cc (ej: 1:05.30)">
          <UInput
            v-model="timeInput"
            placeholder="1:05.30"
            size="lg"
            class="font-mono"
          />
          <p v-if="form.target_time_ms > 0" class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ form.target_time_ms }} ms
          </p>
        </UFormGroup>

        <!-- Scope -->
        <UFormGroup label="Alcance">
          <USelect
            v-model="form.scope"
            :options="scopeOptions"
            option-attribute="label"
            value-attribute="value"
          />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ form.scope === 'CLUB' ? 'Solo visible para atletas de tu club' : 'Visible para todos los clubes' }}
          </p>
        </UFormGroup>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <UButton
            variant="outline"
            to="/objectives"
            class="flex-1"
            block
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="saving"
            :disabled="!isValid"
            class="flex-1"
            block
          >
            Crear objetivo
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
