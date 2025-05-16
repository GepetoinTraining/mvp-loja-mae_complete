import { use } from "react";
import VisitaClientPage from "@/components/visita/VisitaClientPage";

export default function NovaVisitaPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params); // ✅ permitido aqui
  return <VisitaClientPage clienteId={clienteId} />;
}
