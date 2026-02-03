<script setup lang="ts">
const { isSimulating, simulationTarget, stopSimulation } = useSimulation()

const roleLabels = {
  athlete: 'Atleta',
  coach: 'Entrenador',
  club_admin: 'Admin de Club',
}

const roleColors = {
  athlete: 'bg-violet-500',
  coach: 'bg-teal-500',
  club_admin: 'bg-amber-500',
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-full"
  >
    <div
      v-if="isSimulating && simulationTarget"
      class="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-white text-sm flex items-center justify-between"
      :class="roleColors[simulationTarget.type || 'athlete']"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-eye" class="w-4 h-4" />
        <span>
          <strong>Modo Simulación:</strong>
          Viendo como {{ roleLabels[simulationTarget.type || 'athlete'] }} -
          <span class="font-medium">{{ simulationTarget.name }}</span>
        </span>
      </div>
      <button
        class="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-colors"
        @click="stopSimulation"
      >
        <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
        Salir
      </button>
    </div>
  </Transition>
</template>
