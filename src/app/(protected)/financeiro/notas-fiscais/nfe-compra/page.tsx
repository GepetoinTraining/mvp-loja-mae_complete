import { NfeCompraImportadaList } from "@/components/nfe-compra/NfeCompraImportadaList";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NfeCompraPage() {
  // TODO: Add a button or mechanism to trigger the import manually for admins/financeiro
  // For now, it's assumed to be an automated daily process, but manual trigger is good.

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notas Fiscais de Compra Importadas</h1>
        {/* <Button asChild>
          <Link href="/financeiro/nfe-compra/importar">Importar Novas NFes</Link> 
        </Button> */}
        {/* Manual import trigger button can be added later if needed, 
            for now focusing on displaying already imported ones. 
            The API route /api/nfe-compra/importar is for the backend process. 
        */}
      </div>
      <NfeCompraImportadaList />
    </div>
  );
}
