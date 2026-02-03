<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    height?: 'auto' | 'half' | 'full'
  }>(),
  {
    height: 'auto',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const close = () => {
  emit('update:modelValue', false)
}

const heightClasses = computed(() => {
  const heights = {
    auto: 'max-h-[85vh]',
    half: 'h-1/2',
    full: 'h-[95vh]',
  }
  return heights[props.height]
})

// Prevent body scroll when open
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
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="close"
        />

        <!-- Sheet content -->
        <Transition
          enter-active-class="duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div
            v-if="modelValue"
            class="relative w-full bg-white rounded-t-2xl shadow-xl overflow-hidden"
            :class="heightClasses"
          >
            <!-- Handle -->
            <div class="flex justify-center pt-3 pb-2">
              <div class="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <!-- Header -->
            <div
              v-if="title"
              class="px-4 pb-3 border-b border-gray-100"
            >
              <h2 class="text-lg font-semibold text-gray-900 text-center">
                {{ title }}
              </h2>
            </div>

            <!-- Body -->
            <div class="overflow-y-auto p-4" :class="height === 'auto' ? '' : 'flex-1'">
              <slot />
            </div>

            <!-- Safe area padding for iOS -->
            <div class="pb-safe" />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
