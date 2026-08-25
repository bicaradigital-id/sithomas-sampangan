import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  // clear cookie
  res.headers.set('Set-Cookie', `sithomas_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
  return res
}
