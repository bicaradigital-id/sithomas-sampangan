import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(req: Request) {
  try {
    const token = req.headers.get('x-admin-token') || req.headers.get('authorization')?.replace(/^Bearer\s+/, '')
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'dev-secret'
    if (!token || token !== ADMIN_TOKEN) return new NextResponse('Unauthorized', { status: 401 })

    const url = new URL(req.url)
    const name = url.searchParams.get('name')
    if (!name) return new NextResponse('Missing name', { status: 400 })
    if (name.includes('..') || name.includes('/') || name.includes('\\')) return new NextResponse('Invalid name', { status: 400 })

    const filePath = path.join(process.cwd(), 'data', 'reports', name)
    try {
      await fs.stat(filePath)
    } catch {
      return new NextResponse('Not found', { status: 404 })
    }

    const data = await fs.readFile(filePath)
    const ext = path.extname(name).toLowerCase()
    const contentType = ext === '.json' ? 'application/json' : ext === '.csv' ? 'text/csv' : 'application/octet-stream'

    return new NextResponse(data, { status: 200, headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${name}"` } })
  } catch (err) {
    console.error('report download error', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
