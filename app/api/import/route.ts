import { NextResponse } from 'next/server'
import fs from 'fs/promises'

export async function POST(req: Request) {
  try {
    // simple auth: check HttpOnly cookie `sithomas_admin` first, fallback to header
    const cookieHeader = req.headers.get('cookie') || ''
    const cookieMatch = cookieHeader.match(/(?:^|; )sithomas_admin=([^;]+)/)
    const cookieToken = cookieMatch ? cookieMatch[1] : null
    const headerToken = req.headers.get('x-admin-token') || req.headers.get('authorization')?.replace(/^Bearer\s+/, '')
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-secret'
    const token = cookieToken || headerToken
    if (!token || token !== ADMIN_TOKEN) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const rows = Array.isArray(body.rows) ? body.rows : []
    // validate server-side: require No_KK and Nama_Lengkap
    const valid: any[] = []
    const rejected: any[] = []
    for (const r of rows) {
      if (r.No_KK && String(r.No_KK).trim() !== '' && r.Nama_Lengkap && String(r.Nama_Lengkap).trim() !== '') valid.push(r)
      else rejected.push(r)
    }
    const dataDir = process.cwd() + '/data'
    const dataPath = dataDir + '/imports.json'
    await fs.mkdir(dataDir, { recursive: true })
    let existing: any[] = []
    try {
      const txt = await fs.readFile(dataPath, 'utf8')
      existing = JSON.parse(txt || '[]')
    } catch { existing = [] }
    const merged = [...valid, ...existing]
    await fs.writeFile(dataPath, JSON.stringify(merged, null, 2), 'utf8')

    const responseBody: any = { imported: valid.length, rejected: rejected.length, importedRows: valid, rejectedRows: rejected }

    // optional: save report files on server under data/reports when requested
    const saveReport = Boolean(body.saveReport)
    if (saveReport) {
      const reportsDir = dataDir + '/reports'
      await fs.mkdir(reportsDir, { recursive: true })
      const ts = Date.now()
      const jsonPath = `${reportsDir}/import-report-${ts}.json`
      const importedCsvPath = `${reportsDir}/imported-${ts}.csv`
      const rejectedCsvPath = `${reportsDir}/rejected-${ts}.csv`
      // write JSON summary
      await fs.writeFile(jsonPath, JSON.stringify(responseBody, null, 2), 'utf8')
      // helper to stringify CSV
      const toCsv = (arr: any[]) => {
        if (!arr || !arr.length) return ''
        const keys = Array.from(new Set(arr.flatMap((r) => Object.keys(r))))
        const header = keys.join(',')
        const rows = arr.map((r) => keys.map((k) => `"${String(r[k] ?? '').replaceAll('"', '""')}"`).join(','))
        return '\ufeff' + [header, ...rows].join('\n')
      }
      const importedCsv = toCsv(valid)
      if (importedCsv) await fs.writeFile(importedCsvPath, importedCsv, 'utf8')
      const rejectedCsv = toCsv(rejected)
      if (rejectedCsv) await fs.writeFile(rejectedCsvPath, rejectedCsv, 'utf8')
      responseBody.saved = { json: jsonPath.replace(process.cwd() + '/', ''), importedCsv: importedCsv ? importedCsvPath.replace(process.cwd() + '/', '') : null, rejectedCsv: rejectedCsv ? rejectedCsvPath.replace(process.cwd() + '/', '') : null }
    }

    return NextResponse.json(responseBody)
  } catch (err) {
    console.error('api/import error', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
