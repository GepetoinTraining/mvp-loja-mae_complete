import NfeCompraClientPage from "@/components/admin/NfeCompraClientPage";

export default async function NfeComprasImportadasPage() {
  // Data fetching could also happen here if we want to pass initial data to the client component
  // For simplicity, the client component will fetch its own data for now.

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Notas Fiscais de Compra Importadas</h1>
      <NfeCompraClientPage />
    </div>
  );
}

