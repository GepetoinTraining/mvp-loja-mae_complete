import { LeadsDashboard } from "@/components/leads/LeadsDashboard";

export default async function LeadsPage() {
    // aqui você já tem certeza que está logado,
    // porque app/(protected)/layout.tsx redireciona se não estiver.
    return <LeadsDashboard />;
  }