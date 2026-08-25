'use client'

import { useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

type Family = {
  id: number
  kk: string
  kepala: string
  anggota: number
  alamat: string
  status: 'Aktif' | 'Perlu diperbarui'
  updated: string
}

const initialFamilies: Family[] = [
  { id: 1, kk: '3273012301010001', kepala: 'Budi Santoso', anggota: 4, alamat: 'Jl. Melati No. 12', status: 'Aktif', updated: '12 Jun 2024' },
  { id: 2, kk: '3273012301010002', kepala: 'Siti Aminah', anggota: 3, alamat: 'Jl. Mawar No. 8', status: 'Aktif', updated: '09 Jun 2024' },
  { id: 3, kk: '3273012301010003', kepala: 'Rudi Hartono', anggota: 5, alamat: 'Jl. Kenanga No. 21', status: 'Perlu diperbarui', updated: '02 Jun 2024' },
  { id: 4, kk: '3273012301010004', kepala: 'Maria Lestari', anggota: 2, alamat: 'Jl. Anggrek No. 4', status: 'Aktif', updated: '28 Mei 2024' },
  { id: 5, kk: '3273012301010005', kepala: 'Andi Wijaya', anggota: 6, alamat: 'Jl. Dahlia No. 17', status: 'Aktif', updated: '24 Mei 2024' },
  { id: 6, kk: '3273012301010006', kepala: 'Dewi Kartika', anggota: 3, alamat: 'Jl. Flamboyan No. 3', status: 'Aktif', updated: '20 Mei 2024' },
]

const navItems = [
  { label: 'Ringkasan', icon: Home },
  { label: 'Data Keluarga', icon: Users },
  { label: 'Data Anggota', icon: UserRound },
  { label: 'Laporan', icon: FileText },
]

export function SithomasDashboard() {
  const [families, setFamilies] = useState(initialFamilies)
  const [activeNav, setActiveNav] = useState('Ringkasan')
  const [query, setQuery] = useState('')
  const [kkFilter, setKkFilter] = useState('Semua KK')
  const [role, setRole] = useState<'admin' | 'umat'>('admin')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginMode, setLoginMode] = useState<'admin' | 'umat'>('admin')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Family | null>(null)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [form, setForm] = useState({ kepala: '', kk: '', anggota: '1', alamat: '' })

  const filtered = useMemo(() => families.filter((family) => {
    const matchesQuery = `${family.kepala} ${family.kk} ${family.alamat}`.toLowerCase().includes(query.toLowerCase())
    const matchesKk = kkFilter === 'Semua KK' || family.kk === kkFilter
    const matchesRole = role === 'admin' || family.id === 1
    return matchesQuery && matchesKk && matchesRole
  }), [families, query, kkFilter, role])

  function openForm(family?: Family) {
    setEditing(family ?? null)
    setForm(family ? { kepala: family.kepala, kk: family.kk, anggota: String(family.anggota), alamat: family.alamat } : { kepala: '', kk: '', anggota: '1', alamat: '' })
    setShowForm(true)
  }

  function saveFamily(event: React.FormEvent) {
    event.preventDefault()
    if (!form.kepala || !form.kk || !form.alamat) return
    if (editing) {
      setFamilies((current) => current.map((family) => family.id === editing.id ? { ...family, kepala: form.kepala, kk: form.kk, anggota: Number(form.anggota), alamat: form.alamat, updated: 'Hari ini' } : family))
    } else {
      setFamilies((current) => [{ id: Date.now(), kepala: form.kepala, kk: form.kk, anggota: Number(form.anggota), alamat: form.alamat, status: 'Aktif', updated: 'Hari ini' }, ...current])
    }
    setShowForm(false)
  }

  if (!loggedIn) {
    return <LoginScreen mode={loginMode} setMode={setLoginMode} onLogin={() => { setRole(loginMode); setLoggedIn(true) }} />
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${showMobileNav ? 'fixed inset-0 z-40 flex' : 'hidden'} w-72 shrink-0 flex-col border-r border-border bg-sidebar md:relative md:flex`}>
          <div className="flex items-center justify-between px-7 py-8">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div>
              <div><p className="font-serif text-xl font-bold tracking-tight">SITHOMAS</p><p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Sistem Pendataan Umat</p></div>
            </div>
            <button className="md:hidden" onClick={() => setShowMobileNav(false)} aria-label="Tutup navigasi"><X /></button>
          </div>
          <div className="px-4"><p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Menu utama</p><nav className="flex flex-col gap-1">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActiveNav(label); setShowMobileNav(false) }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${activeNav === label ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}><Icon className="size-4" />{label}</button>)}</nav></div>
          <div className="mt-8 px-4"><p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Pengaturan</p><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-accent"><Settings className="size-4" />Pengaturan sistem</button></div>
          <div className="mt-auto border-t border-border p-5"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-accent font-bold text-primary">AS</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Admin SITHOMAS</p><p className="text-xs text-muted-foreground">Administrator</p></div><button onClick={() => setLoggedIn(false)} aria-label="Keluar"><LogOut className="size-4 text-muted-foreground" /></button></div></div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-border bg-card px-5 py-4 md:px-10"><div className="flex items-center gap-3"><button className="md:hidden" onClick={() => setShowMobileNav(true)} aria-label="Buka navigasi"><Menu /></button><div><p className="text-xs font-semibold text-muted-foreground">Selasa, 25 Juni 2024</p><h1 className="font-serif text-2xl font-bold">{activeNav}</h1></div></div><div className="flex items-center gap-4"><button className="relative rounded-full p-2 text-muted-foreground hover:bg-accent" aria-label="Notifikasi"><Bell className="size-5" /><span className="absolute right-1 top-1 size-2 rounded-full bg-primary" /></button><div className="hidden h-7 w-px bg-border sm:block" /><div className="hidden items-center gap-2 sm:flex"><div className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-primary">AS</div><span className="text-sm font-semibold">Admin</span><ChevronDown className="size-4 text-muted-foreground" /></div></div></header>

          <div className="p-5 md:p-10">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold text-primary">Selamat datang kembali, Admin</p><h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Pusat data umat yang terpercaya.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Kelola dan pantau data keluarga umat dengan mudah, aman, dan terstruktur.</p></div><Button onClick={() => openForm()} className="w-fit gap-2 rounded-xl"><Plus data-icon="inline-start" />Tambah keluarga</Button></div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={Users} label="Total keluarga" value={String(families.length)} note="Terdata di wilayah ini" /><StatCard icon={UserRound} label="Total anggota" value={String(families.reduce((sum, family) => sum + family.anggota, 0))} note="Dari seluruh keluarga" /><StatCard icon={ClipboardList} label="Data diperbarui" value="94%" note="Dalam 30 hari terakhir" /><StatCard icon={BookOpen} label="Perlu perhatian" value={String(families.filter((family) => family.status !== 'Aktif').length)} note="Keluarga perlu diperbarui" tone="warning" /></div>

            <div className="mt-8 rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between"><div><h3 className="font-serif text-xl font-bold">Data keluarga</h3><p className="mt-1 text-sm text-muted-foreground">Daftar kepala keluarga yang terdaftar di SITHOMAS.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Cari data keluarga</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau nomor KK" className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none ring-primary focus:ring-2 sm:w-64" /></label><select value={kkFilter} onChange={(event) => setKkFilter(event.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-primary focus:ring-2"><option>Semua KK</option>{families.map((family) => <option key={family.kk}>{family.kk}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">Nomor KK</th><th className="px-5 py-3 font-semibold">Kepala keluarga</th><th className="px-5 py-3 font-semibold">Anggota</th><th className="px-5 py-3 font-semibold">Alamat</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Aksi</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((family) => <tr key={family.id} className="hover:bg-muted/30"><td className="px-5 py-4 font-mono text-xs font-semibold text-primary">{family.kk}</td><td className="px-5 py-4 font-semibold">{family.kepala}</td><td className="px-5 py-4">{family.anggota} orang</td><td className="px-5 py-4 text-muted-foreground">{family.alamat}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${family.status === 'Aktif' ? 'bg-accent text-primary' : 'bg-secondary text-secondary-foreground'}`}>{family.status}</span></td><td className="px-5 py-4"><div className="flex items-center gap-1"><button onClick={() => openForm(family)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-primary" aria-label={`Edit ${family.kepala}`}><Pencil className="size-4" /></button><button onClick={() => setFamilies((current) => current.filter((item) => item.id !== family.id))} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Hapus ${family.kepala}`}><Trash2 className="size-4" /></button><button className="rounded-lg p-2 text-muted-foreground hover:bg-accent" aria-label="Lihat opsi"><MoreHorizontal className="size-4" /></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Data keluarga tidak ditemukan.</div>}</div><div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Menampilkan {filtered.length} dari {families.length} keluarga</span><div className="flex items-center gap-2"><button className="rounded-lg border border-border p-2 hover:bg-accent" aria-label="Halaman sebelumnya"><ChevronLeft className="size-4" /></button><span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">1</span><button className="rounded-lg border border-border p-2 hover:bg-accent" aria-label="Halaman berikutnya"><ChevronRight className="size-4" /></button></div></div></div>
          </div>
        </section>
      </div>
      {showForm && <FamilyModal form={form} setForm={setForm} editing={editing} onClose={() => setShowForm(false)} onSave={saveFamily} />}
    </main>
  )
}

function StatCard({ icon: Icon, label, value, note, tone }: { icon: typeof Users; label: string; value: string; note: string; tone?: 'warning' }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><div className={`grid size-10 place-items-center rounded-xl ${tone === 'warning' ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-primary'}`}><Icon className="size-5" /></div><span className="text-xs font-bold text-primary">+8.2%</span></div><p className="mt-5 text-sm font-medium text-muted-foreground">{label}</p><p className="mt-1 font-serif text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div> }

function LoginScreen({ mode, setMode, onLogin }: { mode: 'admin' | 'umat'; setMode: (mode: 'admin' | 'umat') => void; onLogin: () => void }) { return <main className="grid min-h-screen place-items-center bg-background px-5 py-10"><div className="w-full max-w-md"><div className="mb-8 text-center"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg"><ShieldCheck className="size-7" /></div><p className="font-serif text-2xl font-bold">SITHOMAS</p><p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">Sistem Pendataan Umat</p></div><div className="rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8"><h1 className="font-serif text-2xl font-bold">Masuk ke akun Anda</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Kelola data umat secara aman dan terintegrasi.</p><div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1"><button onClick={() => setMode('admin')} className={`rounded-lg py-2 text-sm font-bold ${mode === 'admin' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>Administrator</button><button onClick={() => setMode('umat')} className={`rounded-lg py-2 text-sm font-bold ${mode === 'umat' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>Kepala Keluarga</button></div><form onSubmit={(event) => { event.preventDefault(); onLogin() }} className="mt-6 flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm font-semibold">{mode === 'admin' ? 'Alamat email' : 'Nomor KK'}<input required type={mode === 'admin' ? 'email' : 'text'} placeholder={mode === 'admin' ? 'admin@sithomas.id' : '3273012301010001'} className="h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none ring-primary focus:ring-2" /></label><label className="flex flex-col gap-2 text-sm font-semibold">Kata sandi<input required type="password" placeholder="Masukkan kata sandi" className="h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none ring-primary focus:ring-2" /></label><div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-primary" />Ingat saya</label><button type="button" className="font-bold text-primary">Lupa kata sandi?</button></div><Button type="submit" className="mt-2 h-11 rounded-xl">Masuk</Button></form></div><p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Data Anda terlindungi dengan standar keamanan terbaik.</p></div></main> }

function FamilyModal({ form, setForm, editing, onClose, onSave }: { form: { kepala: string; kk: string; anggota: string; alamat: string }; setForm: (form: { kepala: string; kk: string; anggota: string; alamat: string }) => void; editing: Family | null; onClose: () => void; onSave: (event: React.FormEvent) => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"><div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="font-serif text-2xl font-bold">{editing ? 'Edit data keluarga' : 'Tambah keluarga'}</h2><p className="mt-1 text-sm text-muted-foreground">Lengkapi informasi kepala keluarga.</p></div><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-accent" aria-label="Tutup dialog"><X className="size-5" /></button></div><form onSubmit={onSave} className="mt-6 flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm font-semibold">Nama kepala keluarga<input required value={form.kepala} onChange={(e) => setForm({ ...form, kepala: e.target.value })} className="h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none ring-primary focus:ring-2" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm font-semibold">Nomor KK<input required value={form.kk} onChange={(e) => setForm({ ...form, kk: e.target.value })} className="h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none ring-primary focus:ring-2" /></label><label className="flex flex-col gap-2 text-sm font-semibold">Jumlah anggota<input required min="1" type="number" value={form.anggota} onChange={(e) => setForm({ ...form, anggota: e.target.value })} className="h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none ring-primary focus:ring-2" /></label></div><label className="flex flex-col gap-2 text-sm font-semibold">Alamat lengkap<textarea required value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="min-h-24 rounded-xl border border-input bg-background px-3 py-2 font-normal outline-none ring-primary focus:ring-2" /></label><div className="mt-2 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Batal</Button><Button type="submit" className="rounded-xl">Simpan data</Button></div></form></div></div> }
