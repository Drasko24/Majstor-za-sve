import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { requestsApi } from '../api/requests'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import RequestForm from '../components/RequestForm'
import { apiError } from '../lib/requestFormat'
import type { JobRequestInput } from '../types'

export default function RequestNew() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user) return <Navigate to="/login" replace />

  // Slike se šalju tek nakon kreiranja - upload endpoint traži ID zahtjeva.
  const handleSubmit = async (data: JobRequestInput, files: File[]) => {
    setSubmitting(true)
    setError('')
    try {
      const { data: created } = await requestsApi.create(data)

      if (files.length > 0) {
        const formData = new FormData()
        files.forEach((f) => formData.append('images', f))
        try {
          await requestsApi.uploadImages(created.id, formData)
        } catch {
          // Zahtjev je već sačuvan; slike se mogu dodati kroz izmjenu.
          alert('Zahtjev je objavljen, ali slike nisu poslane. Pokušajte ih dodati kroz izmjenu.')
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['requests'] })
      navigate(`/requests/${created.id}`)
    } catch (err) {
      setError(apiError(err, 'Greška pri objavljivanju zahtjeva'))
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/requests" className="text-sm text-gray-500 hover:text-gray-800">
          ← Nazad na zahtjeve
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">Objavite zahtjev</h1>
        <p className="text-sm text-gray-500 mb-8">
          Opišite šta vam treba, a majstori i prodavci će vam sami poslati ponude.
        </p>

        <RequestForm
          onSubmit={(data, files) => void handleSubmit(data, files)}
          submitting={submitting}
          submitLabel="Objavi zahtjev"
          error={error}
        />
      </div>
    </Layout>
  )
}
