// Base classes matching the React prototype's button base (rounded-md, no shadow by default)
export const BaseClasses = [
  'inline-flex',
  'items-center',
  'justify-center',
  'gap-2',
  'whitespace-nowrap',
  'rounded-md',
  'text-sm',
  'font-medium',
  'ring-offset-background',
  'transition-colors',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-ring',
  'focus-visible:ring-offset-2',
  'disabled:pointer-events-none',
  'disabled:opacity-50',
  '[&_svg]:pointer-events-none',
  '[&_svg]:shrink-0'
];

// Size classes — h-11 for md matches React Login page buttons
export const SizeClasses = {
  xs: ['h-7', 'px-2', 'text-xs'],
  sm: ['h-9', 'px-3'],
  md: ['h-11', 'px-4', 'py-2'],
  lg: ['h-11', 'px-8'],
  xl: ['h-12', 'px-10', 'text-base']
};

// Variant classes — matching React prototype's Shadcn/ui defaults
export const VariantClasses = {
  // Primary: solid blue matching React Login's Sign In button (bg-blue-600 hover:bg-blue-700)
  primary: [
    'bg-blue-600',
    'text-white',
    'hover:bg-blue-700',
    'disabled:bg-slate-400'
  ],
  // Default is same as primary
  default: [
    'bg-blue-600',
    'text-white',
    'hover:bg-blue-700',
    'disabled:bg-slate-400'
  ],
  secondary: [
    'bg-slate-100',
    'text-slate-900',
    'hover:bg-slate-200',
    'disabled:bg-slate-50',
    'disabled:text-slate-400'
  ],
  destructive: [
    'bg-red-500',
    'text-white',
    'hover:bg-red-600',
    'disabled:bg-slate-400'
  ],
  success: [
    'bg-emerald-600',
    'text-white',
    'hover:bg-emerald-700',
    'disabled:bg-slate-400'
  ],
  danger: [
    'bg-red-600',
    'text-white',
    'hover:bg-red-700',
    'disabled:bg-slate-400'
  ],
  warning: [
    'bg-amber-500',
    'text-white',
    'hover:bg-amber-600',
    'disabled:bg-slate-400'
  ],
  upgrade: [
    'border',
    'border-indigo-300/40',
    'bg-gradient-to-r',
    'from-indigo-500',
    'to-violet-500',
    'text-white',
    'font-semibold',
    'tracking-[0.01em]',
    'shadow-[0_6px_18px_rgba(99,102,241,0.25)]',
    'hover:-translate-y-px',
    'hover:from-indigo-400',
    'hover:to-violet-400',
    'hover:border-indigo-200/60',
    'hover:shadow-[0_10px_24px_rgba(99,102,241,0.35)]',
    'active:translate-y-0',
    'active:from-indigo-600',
    'active:to-violet-600',
    'active:shadow-[0_5px_14px_rgba(99,102,241,0.25)]',
    'disabled:from-slate-400',
    'disabled:to-slate-400',
    'disabled:border-slate-400'
  ],
  info: [
    'bg-blue-500',
    'text-white',
    'hover:bg-blue-600',
    'disabled:bg-slate-400'
  ],
  // Outline: border with transparent bg — matching React prototype
  outline: [
    'border',
    'border-slate-200',
    'bg-white',
    'hover:bg-slate-50',
    'hover:text-slate-900',
    'text-slate-700',
    'disabled:border-slate-200',
    'disabled:text-slate-400'
  ],
  ghost: [
    'bg-transparent',
    'hover:bg-slate-100',
    'text-slate-700',
    'hover:text-slate-900',
    'disabled:text-slate-400'
  ],
  link: [
    'text-blue-600',
    'underline-offset-4',
    'hover:underline',
    'bg-transparent',
    'shadow-none'
  ]
};
