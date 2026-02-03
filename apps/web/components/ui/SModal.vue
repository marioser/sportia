<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    closable?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    closable: true,
    size: 'md',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const close = () => {
  if (props.closable) {
    emit('update:modelValue', false)
  }
}

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }
  return sizes[props.size]
})

// Close on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue && props.closable) {
      close()
    }
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => document.removeEventListener('keydown', handleEscape))
})

// Prevent body scroll when modal is open
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="close"
        />

        <!-- Modal content -->
        <Transition
          enter-active-class="duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            class="relative w-full bg-white rounded-xl shadow-xl"
            :class="sizeClasses"
          >
            <!-- Header -->
            <div
              v-if="title || closable"
              class="flex items-center justify-between px-4 py-3 border-b border-gray-100"
            >
              <h2 v-if="title" class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h2>
              <button
                v-if="closable"
                type="button"
                class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                @click="close"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="p-4">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
