export const BaseClasses = [
  'inline-flex',
  'items-center',
  'justify-center',
  'gap-2',
  'whitespace-nowrap',
  'font-medium',
  'ring-offset-background',
  'transition-all',
  'duration-300',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-ring',
  'focus-visible:ring-offset-2',
  'disabled:pointer-events-none',
  'disabled:opacity-50',
  '[&_svg]:pointer-events-none',
  '[&_svg]:shrink-0',
  'rounded-xl',
  'shadow-lg',
  'hover:shadow-xl'
];

// Size classes
export const SizeClasses = {
  xs: ['text-xs', 'h-6', 'px-2', 'py-1'],
  sm: ['text-sm', 'h-8', 'px-3', 'py-1.5'],
  md: ['text-sm', 'h-10', 'px-4', 'py-2'],
  lg: ['text-base', 'h-12', 'px-6', 'py-3'],
  xl: ['text-lg', 'h-14', 'px-8', 'py-4']
};

// Variant classes
export const VariantClasses = {
  primary: [
    'bg-gradient-to-r',
    'from-purple-600',
    'to-indigo-600',
    'hover:from-purple-700',
    'hover:to-indigo-700',
    'text-white',
    'disabled:from-slate-400',
    'disabled:to-slate-500'
  ],
  secondary: [
    'bg-gradient-to-r',
    'from-slate-600',
    'to-slate-700',
    'hover:from-slate-700',
    'hover:to-slate-800',
    'text-white',
    'disabled:from-slate-400',
    'disabled:to-slate-500'
  ],
  success: [
    'bg-gradient-to-r',
    'from-emerald-600',
    'to-teal-600',
    'hover:from-emerald-700',
    'hover:to-teal-700',
    'text-white',
    'disabled:from-slate-400',
    'disabled:to-slate-500'
  ],
  danger: [
    'bg-gradient-to-r',
    'from-red-600',
    'to-rose-600',
    'hover:from-red-700',
    'hover:to-rose-700',
    'text-white',
    'disabled:from-slate-400',
    'disabled:to-slate-500'
  ],
  warning: [
    'bg-gradient-to-r',
    'from-yellow-500',
    'to-orange-500',
    'hover:from-yellow-600',
    'hover:to-orange-600',
    'text-white',
    'disabled:from-slate-400',
    'disabled:to-slate-500'
  ],
  info: [
    'bg-gradient-to-r',
    'from-blue-600',
    'to-cyan-600',
    'hover:from-blue-700',
    'hover:to-cyan-700',
    'text-white',
    'disabled:from-slate-400',
    'disabled:to-slate-500'
  ],
  outline: [
    'border-2',
    'border-slate-300',
    'bg-background',
    'hover:bg-slate-50',
    'hover:border-purple-300',
    'text-slate-700',
    'hover:text-slate-900',
    'disabled:border-slate-200',
    'disabled:text-slate-400'
  ],
  ghost: [
    'bg-transparent',
    'hover:bg-slate-100',
    'text-slate-700',
    'hover:text-slate-900',
    'shadow-none',
    'hover:shadow-none',
    'disabled:text-slate-400'
  ]
};
