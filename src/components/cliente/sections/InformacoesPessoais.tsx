"use client";
import type { ClienteDTO } from "@/lib/types";
import { EditableSection } from "@/components/shared/ClientEditableSection";

export function ClientPersonalInfo({
  cliente,
  setCliente,
}: {
  cliente: ClienteDTO | null;
  setCliente: (c: ClienteDTO) => void;
}) {
  if (!cliente) return null;

  return (
    <EditableSection
      title="Informações Pessoais"
      entity={cliente}
      fields={[
        { key: "telefone", label: "Telefone" },
        { key: "cpf", label: "CPF" },
        { key: "aniversario", label: "Aniversário", type: "date" },
        {
          key: "sexo",
          label: "Sexo",
          type: "select",
          options: [
            { label: "Masculino", value: "MASCULINO" },
            { label: "Feminino", value: "FEMININO" },
            { label: "Outro", value: "OUTRO" },
            { label: "Não Informar", value: "NAO_INFORMAR" },
          ],
        },
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
          alert("Erro ao atualizar cliente.");
        }
      }}
    />
  );
}
