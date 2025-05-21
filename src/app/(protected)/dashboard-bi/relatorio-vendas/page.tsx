import { SalesReportClient } from "@/components/reports/SalesReportClient";

export default async function SalesReportPage() {
  return (
    <section className="bg-background text-foreground font-sans container mx-auto px-4 md:px-8 py-12 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          Relatório de Vendas
        </h1>
      </header>
      <SalesReportClient />
    </section>
  );
}
