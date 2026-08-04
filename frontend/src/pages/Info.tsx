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

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Tim iza platforme</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-4xl">
                👨‍💻
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Petar Drašković</h3>
                <p className="text-sm text-blue-600 font-medium mt-0.5">Co-founder &amp; DevOps / Infrastructure &amp; Developer</p>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Odgovoran za infrastrukturu, deployment i razvoj platforme.
                  Magistar informatike, Univerzitet Crne Gore.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                <a href="mailto:petar.draskovic@majstorzasve.me" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <span>✉️</span> petar.draskovic@majstorzasve.me
                </a>
                <a href="https://linkedin.com/in/petar-draskovic" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <span>🔗</span> linkedin.com/in/petar-draskovic
                </a>
                <a href="https://github.com/petar-draskovic" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <span>🐙</span> github.com/petar-draskovic
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">
                👨‍🔧
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Aco Drašković</h3>
                <p className="text-sm text-green-600 font-medium mt-0.5">Co-founder &amp; Full-stack Developer</p>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Odgovoran za razvoj cjelokupnog sistema — od baze podataka do korisničkog interfejsa.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                <a href="mailto:aco.draskovic@majstorzasve.me" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                  <span>✉️</span> aco.draskovic@majstorzasve.me
                </a>
                <a href="https://linkedin.com/in/aco-draskovic" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                  <span>🔗</span> linkedin.com/in/aco-draskovic
                </a>
                <a href="https://github.com/aco-draskovic" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                  <span>🐙</span> github.com/aco-draskovic
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center text-4xl">
                ⚖️
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Milena Mijušković</h3>
                <p className="text-sm text-pink-600 font-medium mt-0.5">Co-founder &amp; Pravni savjetnik</p>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Odgovorna za pravne aspekte poslovanja, uslove korišćenja i usklađenost platforme sa zakonima.
                  Diplomirani pravnik, Pravni fakultet Podgorica.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                <a href="mailto:milena.mijuskovic@majstorzasve.me" className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                  <span>✉️</span> milena.mijuskovic@majstorzasve.me
                </a>
                <a href="https://linkedin.com/in/milena-mijuskovic" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                  <span>🔗</span> linkedin.com/in/milena-mijuskovic
                </a>
                <a href="https://behance.net/milenamijuskovic" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                  <span>🎨</span> behance.net/milenamijuskovic
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Za poslovne upite:{' '}
            <a href="mailto:info@majstorzasve.me" className="text-blue-500 hover:underline">
              info@majstorzasve.me
            </a>
          </p>
        </div>
      </div>
    </Layout>
  )
}
