import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonStyles = cva(
  'thought-focus inline-flex items-center justify-center gap-2 whitespace-nowrap text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'border border-[#78716c] bg-[#78716c] text-[#fafaf9] hover:bg-[#57534e]',
        secondary: 'border border-[#d6d3d1] bg-transparent text-[#78716c] hover:bg-[#f5f5f4]',
        ghost: 'text-[#78716c] hover:bg-[#f5f5f4]',
        danger: 'border border-[#dc2626] bg-[#dc2626] text-[#fafaf9] hover:bg-[#b91c1c]',
      },
      size: {
        default: 'min-h-12 px-6 py-3',
        sm: 'min-h-9 px-4 py-2 text-[13px]',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export function Button({ className, variant, size, type = 'button', ...props }) {
  return <button className={cn(buttonStyles({ variant, size, className }))} type={type} {...props} />
}
