'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export default function ImportExcel({ onImport }: { onImport?: (rows: any[]) => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [normalized, setNormalized] = useState<any[] | null>(null)
  const [errors, setErrors] = useState<Record<number, string> | null>(null)

  function openFilePicker() {
    fileRef.current?.click()
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target?.result
      try {
        ;(async () => {
          try {
            const XLSX = await import('xlsx')
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
            const rows = json as any[]
            setPreview(rows)
            // normalize and validate
            const { norm, errs } = normalizeAndValidate(rows)
            setNormalized(norm)
            setErrors(errs)
          } catch (err) {
            console.error('Failed to parse excel (dynamic import)', err)
            setPreview(null)
          }
        })()
      } catch (err) {
        console.error('Failed to parse excel', err)
        setPreview(null)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  function confirmImport() {
    if (!preview || !normalized) return
    // send only valid rows
    const validRows = normalized.filter((r) => r.__valid)
    if (validRows.length === 0) {
      alert('Tidak ada baris valid untuk diimpor. Periksa kolom yang wajib.')
      return
    }
    const payload = validRows.map((r) => {
      const copy = { ...r }
      delete copy.__valid
      return copy
    })
    if (onImport) {
      onImport(payload)
    } else {
      try {
        window.dispatchEvent(new CustomEvent('sithomas:import', { detail: { rows: payload } }))
      } catch (err) {
        console.error('dispatch import event', err)
      }
    }
    setPreview(null)
    setNormalized(null)
    setErrors(null)
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function normalizeAndValidate(rows: any[]) {
    const aliases: Record<string, string[]> = {
      No_KK: ['No_KK', 'No KK', 'no_kk', 'nokkk', 'no_kk'],
      Nama_Lengkap: ['Nama_Lengkap', 'Nama Lengkap', 'name', 'Nama', 'NamaLengkap'],
      Nama_Baptis: ['Nama_Baptis', 'Nama Baptis', 'NamaBaptis'],
      Hubungan_Keluarga: ['Hubungan_Keluarga', 'Hubungan Keluarga', 'Hubungan'],
      Agama: ['Agama'],
      Status_Perkawinan: ['Status_Perkawinan', 'Status Perkawinan'],
      Pendidikan_Terakhir: ['Pendidikan_Terakhir', 'Pendidikan Terakhir'],
      Pekerjaan: ['Pekerjaan'],
      Profesi: ['Profesi'],
    }
    const headerKeys = rows.length ? Object.keys(rows[0]) : []
    // build map from found header to canonical
    const map: Record<string, string> = {}
    for (const h of headerKeys) {
      const cleaned = h.toString().trim()
      let found = false
      for (const [canon, al] of Object.entries(aliases)) {
        if (al.map((x) => x.toLowerCase()).includes(cleaned.toLowerCase())) { map[cleaned] = canon; found = true; break }
      }
      if (!found) map[cleaned] = cleaned
    }
    const norm: any[] = []
    const errs: Record<number, string> = {}
    rows.forEach((r, i) => {
      const out: any = {}
      for (const [k, v] of Object.entries(r)) {
        const key = (k || '').toString().trim()
        const canon = map[key] || key
        out[canon] = v
      }
      // validate required fields
      const valid = out.No_KK && String(out.No_KK).toString().trim() !== '' && out.Nama_Lengkap && String(out.Nama_Lengkap).toString().trim() !== ''
      if (!valid) errs[i] = 'Missing required fields: No_KK or Nama_Lengkap'
      out.__valid = !!valid
      norm.push(out)
    })
    return { norm, errs }
  }

  return (
    <div className="inline-block">
      <input ref={fileRef} onChange={onFile} type="file" accept=".xlsx,.xls,.csv" className="hidden" />
      <Button variant="outline" onClick={openFilePicker} className="rounded-xl">Import Excel</Button>
      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4">
          <div className="max-w-2xl w-full overflow-auto rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold">Pratinjau data — {fileName}</h3>
                <p className="text-sm text-muted-foreground">Menampilkan 5 baris pertama. Pastikan kolom sesuai.</p>
              </div>
              <button onClick={() => setPreview(null)} aria-label="Tutup"><X className="text-muted-foreground" /></button>
            </div>
            <div className="mt-4 overflow-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr>
                    {Object.keys(preview[0] || {}).slice(0, 12).map((k) => <th key={k} className="text-left pr-4">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="align-top">
                      {Object.keys(preview[0] || {}).slice(0, 12).map((k) => <td key={k} className="pr-4">{String((row as any)[k])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }} className="rounded-xl">Batal</Button>
              <Button onClick={confirmImport} className="rounded-xl">Konfirmasi import</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
