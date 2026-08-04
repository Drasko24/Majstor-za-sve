import { Star } from 'lucide-react'

interface Props {
  /** API salje Decimal kao string ("4.8"), pa primamo oba oblika. */
  value: number | string | null
  max?: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }

export default function StarRating({ value, max = 5, onChange, size = 'md' }: Props) {
  const rating = Number(value) || 0

  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(rating)
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i + 1)}
            className={`${onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'} ${
              filled ? 'text-amber-400' : 'text-slate-200'
            }`}
            aria-label={`${i + 1} zvjezdica`}
          >
            <Star className={`${sizes[size]} fill-current`} strokeWidth={0} />
          </button>
        )
      })}
    </span>
  )
}
