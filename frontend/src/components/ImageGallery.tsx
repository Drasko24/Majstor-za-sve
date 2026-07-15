import { useState } from 'react'
import type { GalleryImage } from '../types'

interface Props {
  images: GalleryImage[]
  onDelete?: (id: number) => void
}

export default function ImageGallery({ images, onDelete }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-sm text-gray-400">Nema fotografija</p>
      </div>
    )
  }

  const current = lightbox !== null ? images.find((_, i) => i === lightbox) : null

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setLightbox(idx)}
            />
            {onDelete && (
              <button
                onClick={() => onDelete(img.id)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Obriši"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {lightbox !== null && current && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={current.url}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1) }}
            >
              ‹
            </button>
          )}
          {lightbox < images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1) }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  )
}
