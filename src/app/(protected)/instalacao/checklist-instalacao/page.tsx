import { ChecklistList } from "@/components/checklist-instalacao/ChecklistList";
import { Suspense } from "react";

export default function ChecklistInstalacaoPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Checklists de Instalação</h1>
      <Suspense fallback={<div>Carregando checklists...</div>}>
        <ChecklistList />
      </Suspense>
    </div>
  );
}

