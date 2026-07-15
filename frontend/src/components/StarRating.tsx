interface Props {
  value: number
  max?: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }

export default function StarRating({ value, max = 5, onChange, size = 'md' }: Props) {
  return (
    <span className={`inline-flex gap-0.5 ${sizes[size]}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value)
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i + 1)}
            className={`${filled ? 'text-yellow-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:text-yellow-300' : 'cursor-default'}`}
            aria-label={`${i + 1} zvjezdica`}
          >
            ★
          </button>
        )
      })}
    </span>
  )
}
