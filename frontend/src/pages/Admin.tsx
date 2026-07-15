import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type PendingLabel, type AdminProvider } from '../api/admin'
import { labelsApi } from '../api/labels'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import StarRating from '../components/StarRating'
import Pagination from '../components/Pagination'

type Tab = 'statistika' | 'labele' | 'majstori'

export default function Admin() {
  const { user, initialized } = useAuthStore()
  const [tab, setTab] = useState<Tab>('statistika')

  if (!initialized) return null
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">Moderacija i upravljanje platformom</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {(['statistika', 'labele', 'majstori'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'statistika' && <StatsTab />}
        {tab === 'labele' && <LabelsTab />}
        {tab === 'majstori' && <ProvidersTab />}
      </div>
    </Layout>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then((r) => r.data),
    refetchInterval: 30_000,
  })

  if (isLoading) return <LoadingGrid />

  const statCards = [
    { label: 'Ukupno korisnika', value: data?.totalUsers, icon: '👥', color: 'blue' },
    { label: 'Majstori', value: data?.totalProviders, icon: '👷', color: 'green' },
    { label: 'Recenzije', value: data?.totalReviews, icon: '⭐', color: 'yellow' },
    { label: 'Labele na čekanju', value: data?.labels?.PENDING ?? 0, icon: '⏳', color: 'orange' },
  ]

  const labelCards = [
    { label: 'Aktivne labele', value: data?.labels?.ACTIVE ?? 0, color: 'green' },
    { label: 'Na čekanju', value: data?.labels?.PENDING ?? 0, color: 'orange' },
    { label: 'Odbijene', value: data?.labels?.REJECTED ?? 0, color: 'red' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-3xl font-bold text-gray-900">{s.value ?? '—'}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Status labela</h2>
        <div className="grid grid-cols-3 gap-4">
          {labelCards.map((c) => (
            <div key={c.label} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className={`text-2xl font-bold ${c.color === 'green' ? 'text-green-600' : c.color === 'orange' ? 'text-orange-500' : 'text-red-500'}`}>
                {c.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pending Labels ──────────────────────────────────────────────��────────────

type Expansion = { labelId: number; action: 'reject' | 'merge' } | null

function LabelsTab() {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<Expansion>(null)
  const [note, setNote] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState<number | ''>('')
  const [mergeSearch, setMergeSearch] = useState('')

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['admin-pending-labels'],
    queryFn: () => adminApi.pendingLabels().then((r) => r.data),
  })

  const { data: activeLabels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsApi.list().then((r) => r.data),
    staleTime: 60_000,
  })

  const filteredActiveLabels = activeLabels.filter((l) =>
    mergeSearch.length < 2 || l.name.toLowerCase().includes(mergeSearch.toLowerCase())
  )

  const resetExpansion = () => {
    setExpanded(null)
    setNote('')
    setMergeTargetId('')
    setMergeSearch('')
  }

  const toggleExpand = (labelId: number, action: 'reject' | 'merge') => {
    if (expanded?.labelId === labelId && expanded.action === action) {
      resetExpansion()
    } else {
      resetExpansion()
      setExpanded({ labelId, action })
    }
  }

  const approve = useMutation({
    mutationFn: (id: number) => adminApi.approveLabel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pending-labels'] }),
  })

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => adminApi.rejectLabel(id, note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-labels'] })
      resetExpansion()
    },
  })

  const merge = useMutation({
    mutationFn: ({ id, targetId }: { id: number; targetId: number }) =>
      adminApi.mergeLabel(id, targetId, note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-labels'] })
      resetExpansion()
    },
  })

  if (isLoading) return <LoadingList />

  if (labels.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <p className="text-4xl mb-3">✅</p>
        <p className="text-gray-500">Nema labela na čekanju.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">{labels.length} labela čeka odobrenje</p>
      {labels.map((label) => (
        <LabelCard
          key={label.id}
          label={label}
          isExpanded={expanded?.labelId === label.id ? expanded.action : null}
          note={note}
          mergeSearch={mergeSearch}
          mergeTargetId={mergeTargetId}
          filteredActiveLabels={filteredActiveLabels}
          onApprove={() => approve.mutate(label.id)}
          onToggleReject={() => toggleExpand(label.id, 'reject')}
          onToggleMerge={() => toggleExpand(label.id, 'merge')}
          onNoteChange={setNote}
          onMergeSearchChange={setMergeSearch}
          onMergeTargetChange={(id) => setMergeTargetId(id)}
          onRejectConfirm={() => reject.mutate({ id: label.id, note })}
          onMergeConfirm={() => {
            if (!mergeTargetId) return alert('Odaberi ciljnu labelu')
            merge.mutate({ id: label.id, targetId: mergeTargetId as number })
          }}
          onCancel={resetExpansion}
          approving={approve.isPending}
          rejecting={reject.isPending}
          merging={merge.isPending}
        />
      ))}
    </div>
  )
}

interface LabelCardProps {
  label: PendingLabel
  isExpanded: 'reject' | 'merge' | null
  note: string
  mergeSearch: string
  mergeTargetId: number | ''
  filteredActiveLabels: { id: number; name: string; slug: string }[]
  onApprove: () => void
  onToggleReject: () => void
  onToggleMerge: () => void
  onNoteChange: (v: string) => void
  onMergeSearchChange: (v: string) => void
  onMergeTargetChange: (id: number) => void
  onRejectConfirm: () => void
  onMergeConfirm: () => void
  onCancel: () => void
  approving: boolean
  rejecting: boolean
  merging: boolean
}

function LabelCard({
  label, isExpanded, note, mergeSearch, mergeTargetId, filteredActiveLabels,
  onApprove, onToggleReject, onToggleMerge, onNoteChange, onMergeSearchChange,
  onMergeTargetChange, onRejectConfirm, onMergeConfirm, onCancel,
  approving, rejecting, merging,
}: LabelCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{label.name}</h3>
              <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
                PENDING
              </span>
            </div>
            {label.description && (
              <p className="text-sm text-gray-600 mt-1">{label.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
              <span>📁 {label.category.name}</span>
              {label.requester && <span>👤 {label.requester.email}</span>}
              <span>🕐 {new Date(label.createdAt).toLocaleDateString('sr-Latn')}</span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={onApprove}
              disabled={approving}
              className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              title="Odobri"
            >
              ✓ Odobri
            </button>
            <button
              onClick={onToggleMerge}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                isExpanded === 'merge'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
              title="Spoji sa postojećom"
            >
              ↔ Spoji
            </button>
            <button
              onClick={onToggleReject}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                isExpanded === 'reject'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'text-red-500 border-red-200 hover:bg-red-50'
              }`}
              title="Odbij"
            >
              ✕ Odbij
            </button>
          </div>
        </div>
      </div>

      {/* Reject expansion */}
      {isExpanded === 'reject' && (
        <div className="border-t border-red-100 bg-red-50 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-red-800">Odbijanje labele „{label.name}"</p>
          <textarea
            placeholder="Razlog odbijanja (opcionalno)"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
            className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={onRejectConfirm}
              disabled={rejecting}
              className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {rejecting ? 'Odbijam...' : 'Potvrdi odbijanje'}
            </button>
            <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 px-3">
              Otkaži
            </button>
          </div>
        </div>
      )}

      {/* Merge expansion */}
      {isExpanded === 'merge' && (
        <div className="border-t border-blue-100 bg-blue-50 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-blue-800">
            Spoji „{label.name}" sa postojećom labelom
          </p>
          <input
            type="text"
            placeholder="Pretraži aktivne labele..."
            value={mergeSearch}
            onChange={(e) => onMergeSearchChange(e.target.value)}
            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
          {mergeSearch.length >= 2 && (
            <div className="max-h-40 overflow-y-auto bg-white border border-blue-200 rounded-lg divide-y divide-gray-50">
              {filteredActiveLabels.slice(0, 10).map((l) => (
                <button
                  key={l.id}
                  onClick={() => onMergeTargetChange(l.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                    mergeTargetId === l.id ? 'bg-blue-100 font-medium text-blue-800' : 'text-gray-700'
                  }`}
                >
                  {l.name}
                  {mergeTargetId === l.id && ' ✓'}
                </button>
              ))}
              {filteredActiveLabels.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-400">Nema rezultata</p>
              )}
            </div>
          )}
          {mergeTargetId !== '' && (
            <p className="text-xs text-blue-700">
              Spajam sa: <strong>{filteredActiveLabels.find((l) => l.id === mergeTargetId)?.name}</strong>
              {' '}— svi majstori koji koriste „{label.name}" biće prebačeni na ciljnu labelu.
            </p>
          )}
          <textarea
            placeholder="Napomena (opcionalno)"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={onMergeConfirm}
              disabled={merging || mergeTargetId === ''}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {merging ? 'Spajam...' : 'Potvrdi spajanje'}
            </button>
            <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 px-3">
              Otkaži
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Providers ────────────────────────────────────────────────────────────────

function ProvidersTab() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-providers', page],
    queryFn: () => adminApi.providers(page).then((r) => r.data),
  })

  const suspend = useMutation({
    mutationFn: (id: string) => adminApi.suspendProvider(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-providers'] }),
  })

  if (isLoading) return <LoadingList />

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {data?.meta.total ?? 0} majstora ukupno
      </p>
      <div className="flex flex-col gap-3">
        {data?.data.map((p) => (
          <ProviderRow key={p.id} provider={p} onSuspend={() => suspend.mutate(p.id)} suspending={suspend.isPending} />
        ))}
      </div>
      {data && (
        <Pagination
          page={page}
          totalPages={data.meta.totalPages}
          onChange={(p) => { setPage(p); window.scrollTo(0, 0) }}
        />
      )}
    </div>
  )
}

function ProviderRow({ provider, onSuspend, suspending }: { provider: AdminProvider; onSuspend: () => void; suspending: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{provider.displayName}</span>
          {!provider.isAvailable && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
              Suspendovan
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
          <span>📍 {provider.city}</span>
          <span>✉ {provider.user.email}</span>
          {(provider.avgRating ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <StarRating value={provider.avgRating ?? 0} size="sm" />
              ({provider.reviewCount})
            </span>
          )}
          <span>Registrovan: {new Date(provider.createdAt).toLocaleDateString('sr-Latn')}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={`/providers/${provider.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
        >
          Profil ↗
        </a>
        {provider.isAvailable && (
          <button
            onClick={onSuspend}
            disabled={suspending}
            className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Suspenduj
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  )
}

function LoadingList() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  )
}
