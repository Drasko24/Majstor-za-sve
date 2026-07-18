import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import Layout from '../components/Layout'

interface Stats {
  providers: number
  reviews: number
  cities: number
}

function Counter({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-3">
      <span className="text-5xl">{icon}</span>
      <span className="text-5xl font-bold text-blue-700 tabular-nums">
        {value.toLocaleString('sr-Latn')}
      </span>
      <span className="text-gray-500 text-sm font-medium text-center">{label}</span>
    </div>
  )
}

export default function Info() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<Stats>('/stats').then((r) => r.data),
    staleTime: 60_000,
  })

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">O platformi</h1>
          <p className="text-gray-500 text-lg">
            Majstor za Sve — tržište usluga za Crnu Goru i region.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            <Counter value={stats.providers} label="Registrovanih majstora i pružalaca usluga" icon="🔨" />
            <Counter value={stats.reviews} label="Recenzija ostavljenih od klijenata" icon="⭐" />
            <Counter value={stats.cities} label="Gradova pokrivenosti u regionu" icon="📍" />
          </div>
        ) : null}

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
          <p className="text-gray-700 text-base leading-relaxed max-w-2xl mx-auto">
            Platforma je pokrenuta s ciljem da poveže majstore i klijente bez posrednika i provizija.
            Registracija je besplatna, profil vidljiv svima, a kontakt direktan.
          </p>
          <p className="mt-6 text-2xl font-bold text-red-600">Partizan Šampion - Vučiću pederu!</p>
        </div>
      </div>
    </Layout>
  )
}
