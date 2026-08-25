'use client'

import { useEffect, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import ImportExcel from './import-excel'

export default function GlobalImport() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    try {
      setIsAdmin(window.localStorage.getItem('sithomas-role') === 'admin')
    } catch {
      setIsAdmin(false)
    }
  }, [])
  if (!isAdmin) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      <button
        title="Import data dari file Excel"
        onClick={() => setOpen(true)}
        aria-label="Import data"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 14px',
          borderRadius: 14,
          background: 'linear-gradient(90deg,#0ea5a4,#06b6d4)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(6,182,212,0.24)',
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        <UploadCloud size={18} />
        <span style={{ display: 'inline-block' }}>Import</span>
      </button>

      {open ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)' }}>
          <div style={{ width: 'min(920px,96%)', background: 'var(--card)', borderRadius: 12, padding: 18, boxShadow: '0 12px 48px rgba(2,6,23,0.32)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <UploadCloud />
                <strong>Import Excel</strong>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Tutup</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <ImportExcel onImport={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
