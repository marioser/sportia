<script setup lang="ts">
definePageMeta({})

const route = useRoute()
const router = useRouter()
const clubId = computed(() => route.params.id as string)

const supabase = useSupabaseClient()
const { currentClub, fetchClub } = useClubs()
const { createCoach, updateCoachRole, loading } = useCoaches()
const { success, error: showError } = useAppToast()

// Load club info
onMounted(async () => {
  await fetchClub(clubId.value)
  await loadClubMembers()
})

// Club members who are not coaches yet
const clubMembers = ref<any[]>([])
const loadingMembers = ref(false)

const loadClubMembers = async () => {
  loadingMembers.value = true
  try {
    // Get club members who are not already coaches
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        user_id,
        role_in_club,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('club_id', clubId.value)

    if (error) throw error

    // Filter out those who are already coaches
    const { data: existingCoaches } = await supabase
      .from('coaches')
      .select('user_id')

    const coachUserIds = new Set(existingCoaches?.map((c) => c.user_id) || [])
    const members = data || []
    clubMembers.value = members
      .filter((m: any) => !coachUserIds.has(m.user_id))
      .map((m: any) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name || 'Sin nombre',
        avatar_url: m.profiles?.avatar_url,
        role_in_club: m.role_in_club,
      }))
  } catch (e) {
    console.error('Error loading club members:', e)
  } finally {
    loadingMembers.value = false
  }
}

// Form state
const selectedUserId = ref<string>('')
const specialization = ref('')

// Member options for select
const memberOptions = computed(() =>
  clubMembers.value.map((m) => ({
    value: m.user_id,
    label: m.full_name,
  }))
)

// Validation
const isValid = computed(() => !!selectedUserId.value)

// Submit
const saving = ref(false)
const handleSubmit = async () => {
  if (!isValid.value) return

  saving.value = true

  // Create the coach entry
  const coach = await createCoach(
    selectedUserId.value,
    specialization.value || undefined,
    false
  )

  if (coach) {
    // Update club_members role to COACH
    await updateCoachRole(selectedUserId.value, clubId.value, 'COACH')
    router.push(`/clubs/${clubId.value}/coaches`)
  }

  saving.value = false
}
</script>

<template>
  <div>
    <SPageHeader
      title="Nuevo Entrenador"
      :back-to="`/clubs/${clubId}/coaches`"
    />

    <UCard>
      <div v-if="loadingMembers" class="text-center py-8">
        <SLoadingState text="Cargando miembros..." />
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Select member -->
        <UFormGroup label="Seleccionar miembro del club" required>
          <USelectMenu
            v-model="selectedUserId"
            :options="memberOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Selecciona un miembro"
            searchable
          />
          <p v-if="memberOptions.length === 0" class="text-sm text-amber-600 dark:text-amber-400 mt-1">
            No hay miembros disponibles. Primero agrega usuarios al club.
          </p>
        </UFormGroup>

        <!-- Specialization -->
        <UFormGroup label="Especialización (opcional)" hint="ej: Velocidad, Fondo, Técnica">
          <UInput
            v-model="specialization"
            placeholder="ej: Velocidad"
          />
        </UFormGroup>

        <!-- Selected member preview -->
        <div
          v-if="selectedUserId"
          class="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <SAvatar
              :src="clubMembers.find((m) => m.user_id === selectedUserId)?.avatar_url"
              :name="clubMembers.find((m) => m.user_id === selectedUserId)?.full_name"
              size="md"
            />
            <div>
              <div class="font-medium text-gray-900 dark:text-slate-50">
                {{ clubMembers.find((m) => m.user_id === selectedUserId)?.full_name }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                Se convertirá en entrenador del club
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <UButton
            variant="outline"
            :to="`/clubs/${clubId}/coaches`"
            class="flex-1"
            block
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="saving || loading"
            :disabled="!isValid"
            class="flex-1"
            block
          >
            Crear entrenador
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
