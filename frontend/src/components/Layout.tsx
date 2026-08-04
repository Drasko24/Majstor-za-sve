import { ReactNode } from 'react'
import Navbar from './Navbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="container-page text-center text-sm text-slate-400">
          © 2026 Majstor za Sve · Crna Gora
        </div>
      </footer>
    </div>
  )
}
