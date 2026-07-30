import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { providersApi } from '../api/providers'
import { labelsApi } from '../api/labels'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import ImageGallery from '../components/ImageGallery'
import LabelSuggest from '../components/LabelSuggest'
import type { Label } from '../types'

type Tab = 'profil' | 'galerija' | 'portfolio' | 'usluge'

export default function Dashboard() {
  const { user, initialized } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('profil')
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const profileId = user?.profileId
  const isProvider = !!user && user.role === 'PROVIDER' && !!profileId

  const { data: profile, isLoading } = useQuery({
    queryKey: ['provider', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('Nedostaje profileId')
      const res = await providersApi.getById(profileId)
      return res.data
    },
    enabled: isProvider,
  })

  const { data: myLabels = [] } = useQuery({
    queryKey: ['provider-labels', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('Nedostaje profileId')
      const res = await providersApi.getLabels(profileId)
      return res.data
    },
    enabled: isProvider,
  })

  useEffect(() => {
    if (initialized && !isProvider) {
      navigate('/login')
    }
  }, [initialized, isProvider, navigate])

  if (!initialized) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-6" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </Layout>
    )
  }

  if (!user || user.role !== 'PROVIDER' || !profileId) {
    return null
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-6" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        {profile && (
          <p className="text-sm text-gray-500 mb-6">
            {profile.displayName} · {profile.city}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {(['profil', 'galerija', 'portfolio', 'usluge'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'profil' && profile && (
          <ProfileTab profileId={profileId} profile={profile} />
        )}
        {tab === 'galerija' && profile && (
          <GalleryTab
            profileId={profileId}
            images={profile.gallery}
            galleryInputRef={galleryInputRef}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['provider', profileId] })}
          />
        )}
        {tab === 'portfolio' && profile && (
          <PortfolioTab profileId={profileId} portfolio={profile.portfolio} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['provider', profileId] })} />
        )}
        {tab === 'usluge' && (
          <LabelsTab profileId={profileId} myLabels={myLabels} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['provider-labels', profileId] })} />
        )}
      </div>
    </Layout>
  )
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

function ProfileTab({ profileId, profile }: { profileId: string; profile: { displayName: string; bio?: string | null; yearsExperience?: number | null; city: string; municipality?: string | null; phone?: string | null; phoneVisible: boolean; emailVisible: boolean; isAvailable: boolean } }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    displayName: profile.displayName,
    bio: profile.bio ?? '',
    yearsExperience: profile.yearsExperience ?? '',
    city: profile.city,
    municipality: profile.municipality ?? '',
    phone: profile.phone ?? '',
    phoneVisible: profile.phoneVisible,
    emailVisible: profile.emailVisible,
    isAvailable: profile.isAvailable,
  })
  const [saved, setSaved] = useState(false)

  const update = useMutation({
    mutationFn: () => providersApi.update(profileId, { ...form, yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider', profileId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); update.mutate() }}
      className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
    >
      <Field label="Ime i prezime">
        <input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} required className={inputCls} />
      </Field>
      <Field label="Grad">
        <input value={form.city} onChange={(e) => set('city', e.target.value)} required className={inputCls} />
      </Field>
      <Field label="Opština">
        <input value={form.municipality} onChange={(e) => set('municipality', e.target.value)} className={inputCls} />
      </Field>
      <Field label="O sebi">
        <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={4} className={inputCls} />
      </Field>
      <Field label="Godine iskustva">
        <input type="number" min={0} max={60} value={form.yearsExperience} onChange={(e) => set('yearsExperience', e.target.value)} className={inputCls} />
      </Field>
      <Field label="Telefon">
        <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
      </Field>

      <div className="flex flex-col gap-2">
        {([['phoneVisible', 'Prikaži telefon na profilu'], ['emailVisible', 'Prikaži email na profilu'], ['isAvailable', 'Dostupan za angažmane']] as [string, string][]).map(([k, label]) => (
          <label key={k} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form[k as keyof typeof form] as boolean} onChange={(e) => set(k, e.target.checked)} className="w-4 h-4 accent-blue-600" />
            {label}
          </label>
        ))}
      </div>

      <button type="submit" disabled={update.isPending} className="bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
        {update.isPending ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj promjene'}
      </button>
    </form>
  )
}

function GalleryTab({ profileId, images, galleryInputRef, onRefresh }: { profileId: string; images: { id: number; url: string }[]; galleryInputRef: React.RefObject<HTMLInputElement | null>; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('files', f))
    try {
      await providersApi.uploadGallery(profileId, formData)
      onRefresh()
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (imageId: number) => {
    if (!confirm('Obrišite ovu sliku?')) return
    await providersApi.deleteGalleryImage(profileId, imageId)
    onRefresh()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Galerija radova</h2>
        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Upload...' : '+ Dodaj slike'}
        </button>
        <input ref={galleryInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
      </div>
      <ImageGallery images={images} onDelete={deleteImage} />
    </div>
  )
}

function PortfolioTab({ profileId, portfolio, onRefresh }: { profileId: string; portfolio: { id: number; title: string; description?: string; year?: number; images: { id: number; url: string }[] }[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState('')
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const addItem = useMutation({
    mutationFn: () =>
      providersApi.addPortfolioItem(profileId, { title, description: description || undefined, year: year ? Number(year) : undefined }),
    onSuccess: () => { onRefresh(); setTitle(''); setDescription(''); setYear(''); setAdding(false) },
  })

  const deleteItem = async (itemId: number) => {
    if (!confirm('Obrisati stavku?')) return
    await providersApi.deletePortfolioItem(profileId, itemId)
    onRefresh()
  }

  const uploadImages = async (itemId: number, files: FileList | null) => {
    if (!files || files.length === 0) return
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('files', f))
    await providersApi.uploadPortfolioImages(profileId, itemId, formData)
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {portfolio.map((item) => (
        <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              {item.year && <p className="text-xs text-gray-400">{item.year}.</p>}
              {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
            </div>
            <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 text-sm ml-2">Obriši</button>
          </div>
          <ImageGallery images={item.images} />
          <button
            onClick={() => fileInputRefs.current[item.id]?.click()}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            + Dodaj slike
          </button>
          <input
            type="file" accept="image/*" multiple hidden
            ref={(el) => { fileInputRefs.current[item.id] = el }}
            onChange={(e) => uploadImages(item.id, e.target.files)}
          />
        </div>
      ))}

      {adding ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Nova portfolio stavka</h3>
          <div className="flex flex-col gap-3">
            <input placeholder="Naziv *" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            <textarea placeholder="Opis (opcionalno)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
            <input type="number" placeholder="Godina" min={1990} max={2030} value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} />
            <div className="flex gap-2">
              <button onClick={() => addItem.mutate()} disabled={!title || addItem.isPending} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {addItem.isPending ? 'Čuvam...' : 'Dodaj'}
              </button>
              <button onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3">Otkaži</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-6 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
          + Dodaj portfolio stavku
        </button>
      )}
    </div>
  )
}

function LabelsTab({ profileId, myLabels, onRefresh }: { profileId: string; myLabels: Label[]; onRefresh: () => void }) {
  const addLabel = async (label: Label) => {
    try {
      await providersApi.addLabel(profileId, label.id)
      onRefresh()
    } catch {
      alert('Greška pri dodavanju usluge')
    }
  }

  const removeLabel = async (labelId: number) => {
    await providersApi.removeLabel(profileId, labelId)
    onRefresh()
  }

  const { data: allLabels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsApi.list().then((r) => r.data),
    staleTime: 60_000,
  })

  const [search, setSearch] = useState('')
  const available = allLabels.filter(
    (l) =>
      !myLabels.some((m) => m.id === l.id) &&
      l.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Current labels */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Vaše usluge</h2>
        {myLabels.length === 0 ? (
          <p className="text-sm text-gray-400">Nijedna usluga nije dodana.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myLabels.map((l) => (
              <span key={l.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                {l.name}
                <button onClick={() => removeLabel(l.id)} className="ml-1 text-blue-400 hover:text-blue-700 font-bold leading-none">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add from catalog */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Dodaj iz kataloga</h2>
        <input
          type="text"
          placeholder="Pretraži usluge..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} mb-3`}
        />
        {search.length >= 2 && (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {available.slice(0, 20).map((l) => (
              <button
                key={l.id}
                onClick={() => addLabel(l)}
                className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              >
                + {l.name}
              </button>
            ))}
            {available.length === 0 && <p className="text-sm text-gray-400">Nema rezultata.</p>}
          </div>
        )}
      </div>

      {/* Request new label */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">Predloži novu uslugu</h2>
        <p className="text-xs text-gray-400 mb-3">
          Ako vaša usluga nije u katalogu, predložite je — admin će je pregledati.
        </p>
        <LabelSuggest onSelect={addLabel} />
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
