import { InventoryReportClient } from "@/components/reports/InventoryReportClient";

export default async function InventoryReportPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Relatório de Estoque</h1>
      <InventoryReportClient />
    </div>
  );
}

