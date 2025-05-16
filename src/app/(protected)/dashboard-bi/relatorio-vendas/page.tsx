import { SalesReportClient } from "@/components/reports/SalesReportClient";

export default async function SalesReportPage() {
  // This page will host the client component that fetches and displays the sales report.
  // It can also include server-side elements if needed for initial data or configuration.
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Relatório de Vendas</h1>
      <SalesReportClient />
    </div>
  );
}

