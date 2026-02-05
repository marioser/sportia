<script setup lang="ts">
import type { UpdateAthleteForm, Sex } from '~/types'

definePageMeta({

})

const route = useRoute()
const router = useRouter()
const athleteId = computed(() => route.params.id as string)

const {
  currentAthlete,
  loading,
  fetchAthlete,
  updateAthlete,
  getAthleteUserAccount,
  createUserAccountForAthlete,
  updateUserEmail,
  updateUserPassword,
} = useAthletes()
const { isAdmin, isClubAdmin, profile } = useProfile()

// Permission check - only admins and club admins can edit
const canEdit = computed(() => isAdmin.value || isClubAdmin.value)

// Wait for profile to load before checking permissions
const profileLoaded = computed(() => profile.value !== null)

// Redirect if no permission (only after profile is loaded)
watch([canEdit, profileLoaded], ([hasPermission, loaded]) => {
  if (loaded && !hasPermission) {
    router.push(`/athletes/${athleteId.value}`)
  }
})

// Fetch athlete data
onMounted(() => {
  fetchAthlete(athleteId.value)
})

// Calculate max date (today) and default min date (120 years ago)
const today = new Date().toISOString().split('T')[0]
const minDate = new Date()
minDate.setFullYear(minDate.getFullYear() - 120)
const minDateStr = minDate.toISOString().split('T')[0]

const sexOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

const form = reactive<UpdateAthleteForm>({
  firstName: '',
  lastName: '',
  birthDate: '',
  sex: 'M',
  photoUrl: undefined,
  active: true,
  documentNumber: undefined,
})

// Initialize form when athlete loads
watch(
  () => currentAthlete.value,
  (athlete) => {
    if (athlete) {
      form.firstName = athlete.first_name || ''
      form.lastName = athlete.last_name || ''
      form.birthDate = athlete.birth_date || ''
      form.sex = (athlete.sex as Sex) || 'M'
      form.photoUrl = athlete.photo_url || undefined
      form.active = athlete.active !== false
      form.documentNumber = (athlete as any).document_number || undefined
    }
  },
  { immediate: true }
)

const saving = ref(false)

const handleSubmit = async () => {
  saving.value = true
  const updated = await updateAthlete(athleteId.value, form)
  saving.value = false
  if (updated) {
    router.push(`/athletes/${athleteId.value}`)
  }
}

// User account management
const userAccount = ref<{
  userId: string
  fullName: string
  email: string
  role: string
} | null>(null)

const loadingUserAccount = ref(false)
const showCreateAccountModal = ref(false)
const showEditEmailModal = ref(false)
const showEditPasswordModal = ref(false)

const newUserEmail = ref('')
const newUserPassword = ref('')
const newUserPasswordConfirm = ref('')
const accountFullName = ref('')

// Load user account info when athlete loads
watch(
  () => currentAthlete.value,
  async (athlete) => {
    if (athlete && isAdmin.value) {
      loadingUserAccount.value = true
      userAccount.value = await getAthleteUserAccount(athlete.id)
      loadingUserAccount.value = false
    }
  },
  { immediate: true }
)

const handleCreateAccount = async () => {
  if (!newUserEmail.value || !newUserPassword.value) {
    return
  }

  if (newUserPassword.value !== newUserPasswordConfirm.value) {
    useAppToast().error('Las contraseñas no coinciden')
    return
  }

  const fullName = accountFullName.value || `${form.firstName} ${form.lastName}`
  const created = await createUserAccountForAthlete(
    athleteId.value,
    newUserEmail.value,
    newUserPassword.value,
    fullName
  )

  if (created) {
    showCreateAccountModal.value = false
    newUserEmail.value = ''
    newUserPassword.value = ''
    newUserPasswordConfirm.value = ''
    accountFullName.value = ''
    // Reload user account info
    userAccount.value = await getAthleteUserAccount(athleteId.value)
  }
}

const handleUpdateEmail = async () => {
  if (!newUserEmail.value || !userAccount.value) {
    return
  }

  const updated = await updateUserEmail(userAccount.value.userId, newUserEmail.value)

  if (updated) {
    showEditEmailModal.value = false
    newUserEmail.value = ''
    // Reload user account info
    userAccount.value = await getAthleteUserAccount(athleteId.value)
  }
}

const handleUpdatePassword = async () => {
  if (!newUserPassword.value || !userAccount.value) {
    return
  }

  if (newUserPassword.value !== newUserPasswordConfirm.value) {
    useAppToast().error('Las contraseñas no coinciden')
    return
  }

  const updated = await updateUserPassword(userAccount.value.userId, newUserPassword.value)

  if (updated) {
    showEditPasswordModal.value = false
    newUserPassword.value = ''
    newUserPasswordConfirm.value = ''
  }
}

const openEditEmailModal = () => {
  if (userAccount.value) {
    newUserEmail.value = userAccount.value.email
    showEditEmailModal.value = true
  }
}

const openCreateAccountModal = () => {
  accountFullName.value = `${form.firstName} ${form.lastName}`
  showCreateAccountModal.value = true
}
</script>

<template>
  <div>
    <SPageHeader
      title="Editar Atleta"
      :back-to="`/athletes/${athleteId}`"
    />

    <!-- Loading profile -->
    <SLoadingState v-if="!profileLoaded" text="Verificando permisos..." />

    <!-- Permission check (only show after profile loaded) -->
    <SEmptyState
      v-else-if="!canEdit"
      icon="warning"
      title="Sin permisos"
      description="No tienes permisos para editar atletas."
      action-label="Volver"
      :action-to="`/athletes/${athleteId}`"
    />

    <UCard v-else>
      <div v-if="loading && !currentAthlete" class="text-center py-8">
        <p>Cargando...</p>
      </div>
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Nombre" required>
            <UInput
              v-model="form.firstName"
              placeholder="Juan"
              autocomplete="given-name"
              required
            />
          </UFormGroup>

          <UFormGroup label="Apellido" required>
            <UInput
              v-model="form.lastName"
              placeholder="Perez"
              autocomplete="family-name"
              required
            />
          </UFormGroup>
        </div>

        <UFormGroup label="Fecha de nacimiento" required>
          <UInput
            v-model="form.birthDate"
            type="date"
            :min="minDateStr"
            :max="today"
            required
          />
        </UFormGroup>

        <UFormGroup label="Sexo" required>
          <USelect
            v-model="form.sex"
            :options="sexOptions"
            option-attribute="label"
            value-attribute="value"
          />
        </UFormGroup>

        <UFormGroup label="Número de documento (ID nacional)" help="Usado para sincronizar resultados de competencias oficiales">
          <UInput
            v-model="form.documentNumber"
            placeholder="1234567890"
            type="text"
            maxlength="20"
          />
        </UFormGroup>

        <UFormGroup label="URL de foto (opcional)">
          <UInput
            v-model="form.photoUrl"
            type="url"
            placeholder="https://..."
          />
        </UFormGroup>

        <!-- User Account Management (Admin only) -->
        <div v-if="isAdmin" class="border-t pt-4 mt-6">
          <h3 class="text-lg font-semibold mb-4">Cuenta de Usuario</h3>

          <div v-if="loadingUserAccount" class="text-center py-4 text-gray-500">
            Cargando información de cuenta...
          </div>

          <div v-else-if="!userAccount" class="space-y-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Este atleta no tiene una cuenta de usuario vinculada.
            </p>
            <UButton
              variant="outline"
              icon="i-heroicons-user-plus"
              @click="openCreateAccountModal"
            >
              Crear Cuenta de Usuario
            </UButton>
          </div>

          <div v-else class="space-y-3">
            <div class="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Email:</span>
                <span class="text-sm">{{ userAccount.email }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Nombre:</span>
                <span class="text-sm">{{ userAccount.fullName }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Rol:</span>
                <span class="text-sm">{{ userAccount.role }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <UButton
                variant="outline"
                icon="i-heroicons-envelope"
                size="sm"
                @click="openEditEmailModal"
              >
                Cambiar Email
              </UButton>
              <UButton
                variant="outline"
                icon="i-heroicons-key"
                size="sm"
                @click="showEditPasswordModal = true"
              >
                Cambiar Contraseña
              </UButton>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <UCheckbox
            id="active"
            v-model="form.active"
            label="Atleta activo"
          />
        </div>

        <div class="flex gap-3 pt-4">
          <UButton
            variant="outline"
            :to="`/athletes/${athleteId}`"
            class="flex-1"
            block
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="saving"
            class="flex-1"
            block
          >
            Guardar
          </UButton>
        </div>
      </form>
    </UCard>

    <!-- Create Account Modal -->
    <UModal v-model="showCreateAccountModal" :ui="{ width: 'sm:max-w-md' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Crear Cuenta de Usuario</h3>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreateAccount">
          <UFormGroup label="Nombre completo" required>
            <UInput
              v-model="accountFullName"
              placeholder="Juan Pérez"
              required
            />
          </UFormGroup>

          <UFormGroup label="Email" required>
            <UInput
              v-model="newUserEmail"
              type="email"
              placeholder="juan.perez@example.com"
              required
            />
          </UFormGroup>

          <UFormGroup label="Contraseña" required help="Mínimo 6 caracteres">
            <UInput
              v-model="newUserPassword"
              type="password"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </UFormGroup>

          <UFormGroup label="Confirmar contraseña" required>
            <UInput
              v-model="newUserPasswordConfirm"
              type="password"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </UFormGroup>

          <div class="flex gap-3 pt-2">
            <UButton
              variant="outline"
              class="flex-1"
              @click="showCreateAccountModal = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              class="flex-1"
            >
              Crear Cuenta
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>

    <!-- Edit Email Modal -->
    <UModal v-model="showEditEmailModal" :ui="{ width: 'sm:max-w-md' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Cambiar Email</h3>
        </template>

        <form class="space-y-4" @submit.prevent="handleUpdateEmail">
          <UFormGroup label="Nuevo email" required>
            <UInput
              v-model="newUserEmail"
              type="email"
              placeholder="nuevo.email@example.com"
              required
            />
          </UFormGroup>

          <div class="flex gap-3 pt-2">
            <UButton
              variant="outline"
              class="flex-1"
              @click="showEditEmailModal = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              class="flex-1"
            >
              Actualizar Email
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>

    <!-- Edit Password Modal -->
    <UModal v-model="showEditPasswordModal" :ui="{ width: 'sm:max-w-md' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Cambiar Contraseña</h3>
        </template>

        <form class="space-y-4" @submit.prevent="handleUpdatePassword">
          <UFormGroup label="Nueva contraseña" required help="Mínimo 6 caracteres">
            <UInput
              v-model="newUserPassword"
              type="password"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </UFormGroup>

          <UFormGroup label="Confirmar contraseña" required>
            <UInput
              v-model="newUserPasswordConfirm"
              type="password"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </UFormGroup>

          <div class="flex gap-3 pt-2">
            <UButton
              variant="outline"
              class="flex-1"
              @click="showEditPasswordModal = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              class="flex-1"
            >
              Actualizar Contraseña
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>
