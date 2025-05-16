"use client";
import type { ClienteDTO } from "@/lib/types";
import { EditableSection } from "@/components/shared/ClientEditableSection";

export function ClientAddress({
  cliente,
  setCliente,
}: {
  cliente: ClienteDTO | null;
  setCliente: (c: ClienteDTO) => void;
}) {
  if (!cliente) return null;

  return (
    <EditableSection
      title="Endereço"
      entity={cliente}
      fields={[
        { key: "cep", label: "CEP" },
        { key: "estado", label: "Estado" },
        { key: "cidade", label: "Cidade" },
        { key: "bairro", label: "Bairro" },
        { key: "rua", label: "Rua" },
        { key: "numero", label: "Número" },
        { key: "complemento", label: "Complemento" },
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
          alert("Erro ao atualizar endereço.");
        }
      }}
    />
  );
}
