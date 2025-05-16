import { AccountsPayableReportClient } from "@/components/reports/AccountsPayableReportClient";

export default async function AccountsPayableReportPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Relatório de Contas a Pagar (Aging)</h1>
      <AccountsPayableReportClient />
    </div>
  );
}

