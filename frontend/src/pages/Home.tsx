import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '../api/categories'
import Layout from '../components/Layout'

export default function Home() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
    staleTime: Infinity,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  const categoryIcons: Record<string, string> = {
    vodoinstalacije: '🔧',
    'elektro-radovi': '⚡',
    gradjevina: '🏗️',
    'keramika-i-podovi': '🪟',
    'licilacki-radovi': '🎨',
    'stolarija-i-namjestaj': '🪵',
    'klimatizacija-i-ventilacija': '❄️',
    'selidbe-i-transport': '🚛',
    'ciscenje-i-odrzavanje': '🧹',
    'bastovanstvo-i-pejzaz': '🌿',
    'racunari-i-tehnika': '💻',
    'bravarski-radovi': '🔑',
    'auto-servisi': '🚗',
    'kuhinja-i-uredjaji': '🍳',
    ostalo: '🔨',
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Nađite majstora u Crnoj Gori
          </h1>
          <p className="text-blue-200 mb-8 text-lg">
            Vodoinstalateri, elektičari, stomatolozi... sve na jednom mjestu.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Šta vam treba? (npr. vodoinstalater)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 rounded-xl px-4 py-3 text-gray-900 text-base focus:outline-none shadow"
            />
            <button
              type="submit"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 shadow"
            >
              Traži
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Kategorije usluga</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/search?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`)}
              className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-blue-300 hover:shadow-sm transition-all text-center group"
            >
              <span className="text-3xl">{categoryIcons[cat.slug] ?? '🔨'}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-50 border-y border-blue-100 py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Vi ste majstor ili nudite svoje usluge?
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Kreirajte profil besplatno, postavite usluge koje nudite i pronađite klijente u vašem gradu — bez provizije.
          </p>
          <a
            href="/register?role=PROVIDER"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            Registrujte se kao majstor
          </a>
        </div>
      </section>
    </Layout>
  )
}
