"use client";

export function VendedorStats() {
  // Aqui pode vir de contexto, Zustand, fetch ou props
  const stats = {
    total: 38,
    emAndamento: 22,
    fechados: 9,
    conversao: "23.7%",
  };

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total de Leads" value={stats.total} />
      <StatCard label="Em Andamento" value={stats.emAndamento} />
      <StatCard label="Fechados" value={stats.fechados} />
      <StatCard label="Conversão" value={stats.conversao} />
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow text-center">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}
