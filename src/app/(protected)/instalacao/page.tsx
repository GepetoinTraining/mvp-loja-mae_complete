import { ChecklistForm } from "@/components/checklist-instalacao/ChecklistForm";
import { Suspense } from "react";

export default function NovoChecklistPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Novo Checklist de Instalação</h1>
      <Suspense fallback={<div>Carregando formulário...</div>}>
        <ChecklistForm />
      </Suspense>
    </div>
  );
}

