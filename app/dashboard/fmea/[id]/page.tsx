import { ClientFMEADetail } from "@/components/client-fmea-detail"

export const dynamic = "force-dynamic"

export default function FMEADetailPage({ params }: { params: { id: string } }) {
  return <ClientFMEADetail fmeaId={params.id} />
}
