import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '../api/categories'
import { labelsApi } from '../api/labels'
import type { GalleryImage, JobRequestDetail, JobRequestInput, RequestType } from '../types'
import { typeMeta } from '../lib/requestFormat'

const MAX_IMAGES = 10
const MAX_FILE_MB = 10

interface Props {
  initial?: JobRequestDetail
  /** Postojeće slike (režim izmjene); brisanje ide preko onDeleteImage. */
  existingImages?: GalleryImage[]
  onDeleteImage?: (imageId: number) => void
  onSubmit: (data: JobRequestInput, files: File[]) => void
  submitting: boolean
  submitLabel: string
  error?: string
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function RequestForm({
  initial,
  existingImages = [],
  onDeleteImage,
  onSubmit,
  submitting,
  submitLabel,
  error,
}: Props) {
  const [type, setType] = useState<RequestType>(initial?.type ?? 'SERVICE')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState<number | ''>(initial?.category?.id ?? '')
  const [labelIds, setLabelIds] = useState<number[]>(initial?.labels.map((l) => l.id) ?? [])
  const [city, setCity] = useState(initial?.city ?? '')
  const [municipality, setMunicipality] = useState(initial?.municipality ?? '')
  const [budgetMin, setBudgetMin] = useState(initial?.budgetMin != null ? String(Number(initial.budgetMin)) : '')
  const [budgetMax, setBudgetMax] = useState(initial?.budgetMax != null ? String(Number(initial.budgetMax)) : '')
  const [deadline, setDeadline] = useState(initial?.deadline ? initial.deadline.slice(0, 10) : '')
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? '')
  const [contactVisible, setContactVisible] = useState(initial?.contactVisible ?? true)
  const [files, setFiles] = useState<File[]>([])
  const [localError, setLocalError] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
    staleTime: Infinity,
  })

  // Labele se biraju tek kad je poznata podkategorija - inače je lista prevelika.
  const { data: labels = [] } = useQuery({
    queryKey: ['labels', categoryId],
    queryFn: () => labelsApi.list({ categoryId: categoryId as number }).then((r) => r.data),
    enabled: type === 'SERVICE' && categoryId !== '',
    staleTime: 60_000,
  })

  const subcategories = useMemo(
    () =>
      categories.flatMap((c) => (c.children ?? []).map((s) => ({ ...s, parentName: c.name }))),
    [categories]
  )

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  const slotsLeft = MAX_IMAGES - existingImages.length - files.length

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const picked = Array.from(list)
    const tooBig = picked.find((f) => f.size > MAX_FILE_MB * 1024 * 1024)
    if (tooBig) {
      setLocalError(`Slika "${tooBig.name}" je veća od ${MAX_FILE_MB} MB.`)
      return
    }
    setLocalError('')
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_IMAGES - existingImages.length))
  }

  const toggleLabel = (id: number) =>
    setLabelIds((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const min = budgetMin ? Number(budgetMin) : null
    const max = budgetMax ? Number(budgetMax) : null
    if (min !== null && max !== null && min > max) {
      setLocalError('Minimalni budžet ne može biti veći od maksimalnog.')
      return
    }
    setLocalError('')

    onSubmit(
      {
        type,
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId === '' ? null : categoryId,
        labelIds: type === 'SERVICE' ? labelIds : [],
        city: city.trim(),
        municipality: municipality.trim() || undefined,
        budgetMin: min,
        budgetMax: max,
        deadline: deadline || null,
        contactPhone: contactPhone.trim() || undefined,
        contactVisible,
      },
      files
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {(error || localError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {localError || error}
        </div>
      )}

      {/* Tip zahtjeva */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Šta vam treba?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['SERVICE', 'PURCHASE'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                type === t
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{typeMeta[t].icon}</span>
              <span>
                <span className="block text-sm font-semibold text-gray-900">
                  {typeMeta[t].label}
                </span>
                <span className="block text-xs text-gray-500">
                  {t === 'SERVICE'
                    ? 'Kuhinja, sto, krečenje, popravka...'
                    : 'MacBook, kolica, crijep, alat...'}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Naslov *</label>
        <input
          type="text"
          required
          minLength={5}
          maxLength={150}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === 'SERVICE'
              ? 'npr. Izrada kuhinje po mjeri, 3.2m'
              : 'npr. Kupujem polovni MacBook Air M1'
          }
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Detaljan opis *{' '}
          <span className="text-gray-400 font-normal">(min 20 znakova)</span>
        </label>
        <textarea
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            type === 'SERVICE'
              ? 'Opišite posao: dimenzije, materijal, stanje prostora, rok, da li imate mjere...'
              : 'Opišite artikal: model, godina, stanje, količina, da li prihvatate polovno...'
          }
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1">{description.length} / 5000</p>
      </div>

      {/* Kategorija i labele */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategorija <span className="text-gray-400 font-normal">(opciono)</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value ? Number(e.target.value) : '')
              setLabelIds([])
            }}
            className={inputClass}
          >
            <option value="">Bez kategorije</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.parentName} → {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rok <span className="text-gray-400 font-normal">(opciono)</span>
          </label>
          <input
            type="date"
            value={deadline}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {type === 'SERVICE' && labels.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vrsta usluge <span className="text-gray-400 font-normal">(do 5)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => toggleLabel(l.id)}
                disabled={!labelIds.includes(l.id) && labelIds.length >= 5}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${
                  labelIds.includes(l.id)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lokacija */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grad *</label>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="npr. Podgorica"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Naselje / opština <span className="text-gray-400 font-normal">(opciono)</span>
          </label>
          <input
            type="text"
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            placeholder="npr. Zabjelo"
            className={inputClass}
          />
        </div>
      </div>

      {/* Budžet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Budžet u eurima <span className="text-gray-400 font-normal">(opciono)</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            step={10}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="od"
            className={inputClass}
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min={0}
            step={10}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="do"
            className={inputClass}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Ostavite prazno ako želite da vam majstori sami predlože cijenu.
        </p>
      </div>

      {/* Slike */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fotografije <span className="text-gray-400 font-normal">(do {MAX_IMAGES})</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {type === 'SERVICE'
            ? 'Slike prostora, skice ili primjer onoga što želite — najbrži način da dobijete tačnu ponudu.'
            : 'Slika modela ili primjer artikla koji tražite.'}
        </p>

        {(existingImages.length > 0 || files.length > 0) && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {onDeleteImage && (
                  <button
                    type="button"
                    onClick={() => onDeleteImage(img.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Obriši"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {previews.map((url, i) => (
              <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Ukloni"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {slotsLeft > 0 && (
          <label className="block border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <span className="block text-2xl mb-1">📷</span>
            <span className="block text-sm text-gray-600 font-medium">Dodaj fotografije</span>
            <span className="block text-xs text-gray-400 mt-0.5">
              Još {slotsLeft} · JPG/PNG do {MAX_FILE_MB} MB
            </span>
          </label>
        )}
      </div>

      {/* Kontakt */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon <span className="text-gray-400 font-normal">(opciono)</span>
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="069 123 456"
            className={inputClass}
          />
        </div>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={contactVisible}
            onChange={(e) => setContactVisible(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Prikaži moj kontakt na oglasu
            <span className="block text-xs text-gray-500">
              Ako isključite, majstori vas mogu kontaktirati isključivo kroz ponude.
            </span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Slanje...' : submitLabel}
      </button>
    </form>
  )
}
