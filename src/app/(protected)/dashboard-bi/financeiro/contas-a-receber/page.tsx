import { AccountsReceivableReportClient } from "@/components/reports/AccountsReceivableReportClient";

export default async function AccountsReceivableReportPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Relatório de Contas a Receber (Aging)</h1>
      <AccountsReceivableReportClient />
    </div>
  );
}
