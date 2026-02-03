export default defineAppConfig({
  ui: {
    // Primary color - Sky Blue (replaces default green)
    primary: 'sky',

    // Gray scale - Slate for dark mode consistency
    gray: 'slate',

    // Notification colors
    notifications: {
      position: 'top-0 bottom-auto',
    },

    // Component-specific overrides for better dark mode support
    card: {
      background: 'bg-white dark:bg-slate-800',
      ring: 'ring-1 ring-gray-200 dark:ring-slate-700',
    },

    input: {
      color: {
        white: {
          outline: 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-slate-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
        },
      },
    },

    select: {
      color: {
        white: {
          outline: 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-slate-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
        },
      },
    },

    selectMenu: {
      background: 'bg-white dark:bg-slate-800',
      ring: 'ring-1 ring-gray-200 dark:ring-slate-700',
      option: {
        color: 'text-gray-900 dark:text-white',
        active: 'bg-gray-100 dark:bg-slate-700',
        selected: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
      },
    },

    textarea: {
      color: {
        white: {
          outline: 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-slate-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
        },
      },
    },

    formGroup: {
      label: {
        base: 'block text-sm font-medium text-gray-700 dark:text-slate-200',
      },
      description: 'text-gray-500 dark:text-slate-400',
      hint: 'text-gray-500 dark:text-slate-400',
      help: 'text-gray-500 dark:text-slate-400',
    },

    button: {
      color: {
        primary: {
          solid: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm',
          soft: 'bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 dark:text-primary-400',
        },
        gray: {
          solid: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200',
          soft: 'bg-gray-50 hover:bg-gray-100 text-gray-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300',
          ghost: 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800',
        },
      },
    },

    badge: {
      color: {
        primary: {
          solid: 'bg-primary-500 text-white',
          soft: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
        },
        success: {
          solid: 'bg-emerald-500 text-white',
          soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        },
        warning: {
          solid: 'bg-amber-500 text-white',
          soft: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        },
        error: {
          solid: 'bg-rose-500 text-white',
          soft: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
        },
      },
    },

    modal: {
      background: 'bg-white dark:bg-slate-800',
      ring: 'ring-1 ring-gray-200 dark:ring-slate-700',
      overlay: {
        background: 'bg-gray-200/75 dark:bg-slate-900/75',
      },
    },

    slideover: {
      background: 'bg-white dark:bg-slate-800',
    },

    dropdown: {
      background: 'bg-white dark:bg-slate-800',
      ring: 'ring-1 ring-gray-200 dark:ring-slate-700',
      item: {
        active: 'bg-gray-100 dark:bg-slate-700',
      },
    },

    table: {
      th: {
        color: 'text-gray-900 dark:text-white',
        base: 'text-left text-sm font-semibold',
      },
      td: {
        color: 'text-gray-700 dark:text-slate-300',
      },
    },

    tabs: {
      list: {
        background: 'bg-gray-100 dark:bg-slate-800',
        marker: {
          background: 'bg-white dark:bg-slate-700',
        },
      },
    },

    toggle: {
      active: 'bg-primary-500 dark:bg-primary-400',
      inactive: 'bg-gray-200 dark:bg-slate-700',
    },

    checkbox: {
      background: 'bg-white dark:bg-slate-900',
      border: 'border border-gray-300 dark:border-slate-600',
    },

    radio: {
      background: 'bg-white dark:bg-slate-900',
      border: 'border border-gray-300 dark:border-slate-600',
    },
  },
})
