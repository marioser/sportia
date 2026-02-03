<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    size: 'md',
  }
)

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  }
  return sizes[props.size]
})

// Generate consistent background color from name
const bgColor = computed(() => {
  if (!props.name) return 'bg-gray-400'
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ]
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})
</script>

<template>
  <div
    class="relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
    :class="[sizeClasses, src ? '' : bgColor]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name || 'Avatar'"
      class="w-full h-full object-cover"
    />
    <span v-else class="font-medium text-white">{{ initials }}</span>
  </div>
</template>
