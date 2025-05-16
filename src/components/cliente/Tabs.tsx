// Tabs.tsx :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
"use client";

import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ClienteVisitas } from "./Visitas";
import { ClienteOrcamentos } from "./Orcamentos";
import { ClientFollowUps } from "./FollowUps";
import { FollowUpsHistorico } from "./sections/FollowUpsHistorico";
import type { ClienteDTO, VisitaDTO, OrcamentoDTO, LeadDTO } from "@/lib/types";
import { EditableSection } from "@/components/shared/ClientEditableSection";
import { ClientPersonalInfo } from "./sections/InformacoesPessoais";
import { ClientAddress } from "./sections/Endereco";
import { ClientCrmInfo } from "./sections/CrmDados";

export interface Props {
  cliente: ClienteDTO;
  visitas?: VisitaDTO[];
  orcamentos?: OrcamentoDTO[];
  leads?: LeadDTO[];
  onSave: (updates: Partial<ClienteDTO>) => Promise<ClienteDTO>;
}

export function ClientTabs({
  cliente,
  visitas,
  orcamentos,
  leads,
  onSave,
}: Props) {
  const [clienteAtual, setClienteAtual] = useState<ClienteDTO>(cliente);
  // fallback para listas possivelmente indefinidas
  const safeVisitas    = visitas    ?? [];
  const safeOrcamentos = orcamentos ?? [];
  const safeLeads      = leads      ?? [];

  /** dispara o PATCH e sincroniza state */
  const handleSaveSection = async (
    original: Partial<ClienteDTO>,
    updated: Partial<ClienteDTO>
  ) => {
    try {
      const novo = await onSave(updated);
      setClienteAtual(novo);
    } catch {
      alert("Erro ao salvar seção");
    }
  };

  return (
    <Tabs defaultValue="visitas" className="w-full space-y-4">
      <TabsList>
        <TabsTrigger value="visitas">Visitas Técnicas</TabsTrigger>
        <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
        <TabsTrigger value="followups">Follow‑ups</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
        <TabsTrigger value="info">Informações</TabsTrigger>
      </TabsList>

      <TabsContent value="visitas">
        <ClienteVisitas visitas={safeVisitas} clienteId={cliente.id} />
      </TabsContent>

      <TabsContent value="orcamentos">
        <ClienteOrcamentos cliente={{ ...clienteAtual, orcamentos: safeOrcamentos }} />
      </TabsContent>

      <TabsContent value="followups">
        <ClientFollowUps cliente={clienteAtual} />
      </TabsContent>

      <TabsContent value="historico">
        <FollowUpsHistorico clienteId={cliente.id} />
      </TabsContent>

      <TabsContent value="info">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Seção Informações Pessoais */}
          <EditableSection<ClienteDTO>
            title="Informações Pessoais"
            entity={clienteAtual}
            fields={[
              { key: "nome", label: "Nome Completo", type: "text" },
              { key: "email", label: "Email", type: "text" },
              { key: "telefone", label: "Telefone", type: "text" },
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
              { key: "aniversario", label: "Data de Nascimento", type: "date" },
            ]}
            onSave={handleSaveSection}
          />

          {/* Seção Endereço */}
          <EditableSection<ClienteDTO>
            title="Endereço"
            entity={clienteAtual}
            fields={[
              { key: "cep", label: "CEP", type: "text" },
              { key: "estado", label: "Estado", type: "text" },
              { key: "cidade", label: "Cidade", type: "text" },
              { key: "bairro", label: "Bairro", type: "text" },
              { key: "rua", label: "Rua", type: "text" },
              { key: "numero", label: "Número", type: "text" },
              { key: "complemento", label: "Complemento", type: "text" },
            ]}
            onSave={handleSaveSection}
          />

          {/* Seção CRM & Dados */}
          <EditableSection<ClienteDTO>
            title="CRM & Dados"
            entity={clienteAtual}
            fields={[
              { key: "origemLead", label: "Origem do Lead", type: "text" },
              { key: "interesseEm", label: "Interesse em", type: "text" },
              { key: "observacoes", label: "Observações", type: "textarea" },
            ]}
            onSave={handleSaveSection}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
