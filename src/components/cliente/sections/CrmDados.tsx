"use client";
import type { ClienteDTO } from "@/lib/types";
import { EditableSection } from "@/components/shared/ClientEditableSection";

export function ClientCrmInfo({
  cliente,
  setCliente,
}: {
  cliente: ClienteDTO | null;
  setCliente: (c: ClienteDTO) => void;
}) {
  if (!cliente) return null;

  return (
    <EditableSection
      title="CRM & Dados"
      entity={cliente}
      fields={[
        { key: "origemLead", label: "Origem do Lead" },
        { key: "interesseEm", label: "Interesse em" },
        { key: "observacoes", label: "Observações", type: "textarea" },
      ]}
      onSave={async (original, updated) => {
        const res = await fetch(`/api/clientes/${cliente.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });

        if (res.ok) {
          setCliente(await res.json());
        } else {
          alert("Erro ao atualizar informações.");
        }
      }}
    />
  );
}
