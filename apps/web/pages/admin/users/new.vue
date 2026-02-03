<script setup lang="ts">
import type { UserRole } from '~/types'

definePageMeta({})

const router = useRouter()
const { isAdmin, profile } = useProfile()
const { clubs, fetchClubs } = useClubs()
const { loading, createUser, generatePassword, getUnlinkedAthletes } = useUserManagement()
const { success } = useAppToast()

// Redirect if not admin (wait for profile to load first)
watch([isAdmin, profile], ([admin, prof]) => {
  if (prof && !admin) {
    router.push('/')
  }
})

// Load clubs
onMounted(() => {
  fetchClubs()
})

// Form state
const form = reactive({
  email: '',
  password: '',
  fullName: '',
  role: 'ATHLETE' as UserRole,
  clubId: '',
  clubRole: 'ATHLETE' as 'ADMIN' | 'COACH' | 'ATHLETE',
  athleteId: '',
})

// Show generated password
const showPassword = ref(false)

// Generate password
const handleGeneratePassword = () => {
  form.password = generatePassword()
  showPassword.value = true
}

// Unlinked athletes (athletes without user accounts)
const unlinkedAthletes = ref<any[]>([])
const loadingAthletes = ref(false)

const loadUnlinkedAthletes = async (clubId: string) => {
  if (!clubId) {
    unlinkedAthletes.value = []
    return
  }
  loadingAthletes.value = true
  unlinkedAthletes.value = await getUnlinkedAthletes(clubId)
  loadingAthletes.value = false
}

// Watch club selection to load unlinked athletes
watch(() => form.clubId, (clubId) => {
  loadUnlinkedAthletes(clubId)
  form.athleteId = '' // Reset athlete selection
})

// Auto-fill name when selecting unlinked athlete
watch(() => form.athleteId, (athleteId) => {
  if (athleteId) {
    const athlete = unlinkedAthletes.value.find(a => a.id === athleteId)
    if (athlete && !form.fullName) {
      form.fullName = `${athlete.first_name} ${athlete.last_name}`
    }
  }
})

// Auto-set clubRole when role changes
watch(() => form.role, (role) => {
  if (role === 'ATHLETE') form.clubRole = 'ATHLETE'
  else if (role === 'COACH') form.clubRole = 'COACH'
  else if (role === 'CLUB_ADMIN') form.clubRole = 'ADMIN'
})

// Role options
const roleOptions = [
  { value: 'ATHLETE', label: 'Atleta' },
  { value: 'COACH', label: 'Entrenador' },
  { value: 'CLUB_ADMIN', label: 'Admin de Club' },
  { value: 'ADMIN', label: 'Administrador' },
]

// Club options
const clubOptions = computed(() =>
  clubs.value.map(c => ({ value: c.id, label: c.name }))
)

// Athlete options
const athleteOptions = computed(() =>
  unlinkedAthletes.value.map(a => ({
    value: a.id,
    label: `${a.first_name} ${a.last_name}`,
    subtitle: a.age_category,
  }))
)

// Validation
const isValid = computed(() => {
  return (
    form.email &&
    form.password &&
    form.fullName &&
    form.role &&
    (form.role === 'ADMIN' || form.clubId)
  )
})

// Submit
const createdUser = ref<{ id: string; email: string; password: string } | null>(null)

const handleSubmit = async () => {
  if (!isValid.value) return

  const result = await createUser({
    email: form.email,
    password: form.password,
    fullName: form.fullName,
    role: form.role,
    clubId: form.clubId || undefined,
    clubRole: form.clubRole,
    athleteId: form.athleteId || undefined,
  })

  if (result) {
    createdUser.value = {
      id: result.id,
      email: form.email,
      password: form.password,
    }
  }
}

// Copy credentials
const copyCredentials = () => {
  if (!createdUser.value) return
  const text = `Email: ${createdUser.value.email}\nContraseña: ${createdUser.value.password}`
  navigator.clipboard.writeText(text)
  success('Credenciales copiadas')
}

// Create another
const createAnother = () => {
  createdUser.value = null
  form.email = ''
  form.password = ''
  form.fullName = ''
  form.athleteId = ''
}
</script>

<template>
  <div>
    <SPageHeader title="Crear Usuario" back-to="/admin/users" />

    <template v-if="isAdmin">
      <!-- Success state -->
      <UCard v-if="createdUser">
        <div class="text-center py-4">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-check" class="w-8 h-8 text-green-500" />
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-slate-50 mb-2">
            Usuario Creado
          </h2>
          <p class="text-gray-600 dark:text-slate-400 mb-4">
            El usuario ha sido creado exitosamente. Comparte las credenciales de acceso:
          </p>

          <div class="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 text-left mb-4">
            <div class="space-y-2">
              <div>
                <span class="text-sm text-gray-500 dark:text-slate-400">Email:</span>
                <p class="font-mono font-medium text-gray-900 dark:text-slate-50">{{ createdUser.email }}</p>
              </div>
              <div>
                <span class="text-sm text-gray-500 dark:text-slate-400">Contraseña:</span>
                <p class="font-mono font-medium text-gray-900 dark:text-slate-50">{{ createdUser.password }}</p>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <UButton
              color="primary"
              variant="soft"
              class="flex-1"
              @click="copyCredentials"
            >
              <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4 mr-2" />
              Copiar credenciales
            </UButton>
            <UButton
              color="gray"
              variant="soft"
              class="flex-1"
              @click="createAnother"
            >
              Crear otro
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Form -->
      <UCard v-else>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Role -->
          <UFormGroup label="Tipo de usuario" required>
            <USelectMenu
              v-model="form.role"
              :options="roleOptions"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormGroup>

          <!-- Club (required for non-ADMIN) -->
          <UFormGroup
            v-if="form.role !== 'ADMIN'"
            label="Club"
            required
          >
            <USelectMenu
              v-model="form.clubId"
              :options="clubOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecciona un club"
              searchable
            />
          </UFormGroup>

          <!-- Link to existing athlete (if ATHLETE role) -->
          <UFormGroup
            v-if="form.role === 'ATHLETE' && form.clubId"
            label="Vincular a atleta existente (opcional)"
          >
            <USelectMenu
              v-model="form.athleteId"
              :options="athleteOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecciona un atleta sin cuenta"
              :loading="loadingAthletes"
              searchable
              clearable
            >
              <template #option="{ option }">
                <span>{{ option.label }}</span>
                <span v-if="option.subtitle" class="text-gray-400 ml-2 text-xs">
                  {{ option.subtitle }}
                </span>
              </template>
            </USelectMenu>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Atletas sin cuenta de usuario en este club
            </p>
          </UFormGroup>

          <UDivider />

          <!-- Full name -->
          <UFormGroup label="Nombre completo" required>
            <UInput
              v-model="form.fullName"
              placeholder="Juan Pérez"
            />
          </UFormGroup>

          <!-- Email -->
          <UFormGroup label="Email" required>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="usuario@email.com"
            />
          </UFormGroup>

          <!-- Password -->
          <UFormGroup label="Contraseña" required>
            <div class="flex gap-2">
              <UInput
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 6 caracteres"
                class="flex-1"
              />
              <UButton
                type="button"
                color="gray"
                variant="soft"
                :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                @click="showPassword = !showPassword"
              />
              <UButton
                type="button"
                color="primary"
                variant="soft"
                @click="handleGeneratePassword"
              >
                Generar
              </UButton>
            </div>
          </UFormGroup>

          <!-- Info box -->
          <div class="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div class="flex gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-primary-800 dark:text-primary-200">
                <p class="font-medium">Importante:</p>
                <ul class="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>El email será confirmado automáticamente</li>
                  <li>El usuario podrá iniciar sesión inmediatamente</li>
                  <li>Guarda o comparte la contraseña con el usuario</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <UButton
              type="button"
              variant="outline"
              to="/admin/users"
              class="flex-1"
              block
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!isValid"
              class="flex-1"
              block
            >
              Crear usuario
            </UButton>
          </div>
        </form>
      </UCard>
    </template>

    <SEmptyState
      v-else
      icon="users"
      title="Acceso restringido"
      description="Solo los administradores pueden crear usuarios."
      action-label="Volver al inicio"
      action-to="/"
    />
  </div>
</template>
