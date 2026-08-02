import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requestsApi } from '../api/requests'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import RequestForm from '../components/RequestForm'
import { apiError } from '../lib/requestFormat'
import type { JobRequestInput } from '../types'

export default function RequestEdit() {
  const { id } = useParams<{ id: string }>()
  const requestId = Number(id)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => requestsApi.getById(requestId).then((r) => r.data),
    enabled: !isNaN(requestId),
  })

  const deleteImage = useMutation({
    mutationFn: (imageId: number) => requestsApi.deleteImage(requestId, imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['request', requestId] }),
    onError: (err) => setError(apiError(err, 'Greška pri brisanju slike')),
  })

  const save = useMutation({
    mutationFn: async ({ data, files }: { data: JobRequestInput; files: File[] }) => {
      await requestsApi.update(requestId, data)
      if (files.length > 0) {
        const formData = new FormData()
        files.forEach((f) => formData.append('images', f))
        await requestsApi.uploadImages(requestId, formData)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['request', requestId] })
      await queryClient.invalidateQueries({ queryKey: ['requests'] })
      navigate(`/requests/${requestId}`)
    },
    onError: (err) => setError(apiError(err, 'Greška pri čuvanju izmjena')),
  })

  if (!user) return <Navigate to="/login" replace />

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </Layout>
    )
  }

  if (!request) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
          Zahtjev nije pronađen.
        </div>
      </Layout>
    )
  }

  if (!request.isOwner) return <Navigate to={`/requests/${requestId}`} replace />

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={`/requests/${requestId}`} className="text-sm text-gray-500 hover:text-gray-800">
          ← Nazad na zahtjev
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-8">Izmjena zahtjeva</h1>

        <RequestForm
          initial={request}
          existingImages={request.images}
          onDeleteImage={(imageId) => deleteImage.mutate(imageId)}
          onSubmit={(data, files) => save.mutate({ data, files })}
          submitting={save.isPending}
          submitLabel="Sačuvaj izmjene"
          error={error}
        />
      </div>
    </Layout>
  )
}
