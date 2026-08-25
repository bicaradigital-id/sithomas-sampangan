import { SithomasDashboard } from '@/components/sithomas-dashboard'

export default function Page() {
  return <SithomasDashboard logoUrl={process.env.LOGO_URL} />
}
