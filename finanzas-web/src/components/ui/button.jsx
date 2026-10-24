import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        primary: 'bg-[#123f35] text-white shadow-sm hover:bg-[#0d332b]',
        secondary: 'border border-[#dce5df] bg-white text-[#234b40] hover:bg-[#f1f6f2]',
        ghost: 'text-[#53665e] hover:bg-[#edf2ed] hover:text-[#173d33]',
        danger: 'bg-rose-600 text-white hover:bg-rose-700',
      },
      size: {
        default: 'min-h-11 px-4 py-2.5',
        sm: 'min-h-9 rounded-lg px-3 text-xs',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export function Button({ className, variant, size, type = 'button', ...props }) {
  return <button className={cn(buttonStyles({ variant, size, className }))} type={type} {...props} />
}
