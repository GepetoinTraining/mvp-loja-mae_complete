import { NfeCompraDetailView } from "@/components/financeiro/nfe-compra/NfeCompraDetailView";

interface NfeCompraDetailPageProps {
  params: {
    id: string;
  };
}

export default async function NfeCompraDetailPage({ params }: NfeCompraDetailPageProps) {
  const { id } = params;

  return (
    <div className="container mx-auto py-10">
      <NfeCompraDetailView nfeCompraId={id} />
    </div>
  );
}
