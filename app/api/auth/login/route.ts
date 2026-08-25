import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body || {}
    if (username === 'admin' && password === 'admin123') {
      const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-secret'
      const res = NextResponse.json({ ok: true })
      // set HttpOnly cookie with server token
      res.headers.set('Set-Cookie', `sithomas_admin=${ADMIN_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24}`)
      return res
    }
    return new NextResponse('Unauthorized', { status: 401 })
  } catch (err) {
    console.error('login error', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
