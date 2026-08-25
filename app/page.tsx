import { SithomasDashboard } from '@/components/sithomas-dashboard'

export default function Page() {
  const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20sithomas-w3X34u0FmKp7Tfjz87kmqzXaJT728d.png' || process.env.LOGO_URL

  return <SithomasDashboard logoUrl={logoUrl} />
}
