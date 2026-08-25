import { SithomasDashboard } from '@/components/sithomas-dashboard'
import GlobalImport from '@/components/global-import'

export default function Page() {
  const logoUrl = process.env.LOGO_URL || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20sithomas-w3X34u0FmKp7Tfjz87kmqzXaJT728d.png'

  return (
    <>
      <SithomasDashboard logoUrl={logoUrl} />
      <GlobalImport />
    </>
  )
}
