"use client";

import { useEffect, useState } from "react";
import { NfeCompraImportada, Fornecedor } from "@prisma/client"; // Assuming types are available
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowPathIcon, EyeIcon } from "@heroicons/react/24/outline"; // Example icons

// Extend NfeCompraImportada to include the Fornecedor details from the API response
interface NfeCompraImportadaWithFornecedor extends NfeCompraImportada {
  fornecedor: {
    nome: string | null;
    cnpj: string | null;
  } | null;
}

export default function NfeCompraClientPage() {
  const [nfeCompras, setNfeCompras] = useState<NfeCompraImportadaWithFornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchNfeCompras() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/financeiro/notas-fiscais/nfe-compra");
      if (!response.ok) {
        throw new Error(`Failed to fetch NFes: ${response.statusText}`);
      }
      const data = await response.json();
      setNfeCompras(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching NFe Compras:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchNfeCompras();
  }, []);

  async function handleProcessNfe(id: string) {
    // Add a confirmation dialog here if needed
    try {
      const response = await fetch(`/api/financeiro/notas-fiscais/nfe-compra/${id}/processar`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process NFe ${id}`);
      }
      // Refresh the list after processing
      fetchNfeCompras();
      // Optionally show a success toast/message
      alert(`NFe ${id} processada/reprocessada com sucesso.`);
    } catch (err: any) {
      console.error(`Error processing NFe ${id}:`, err);
      alert(`Erro ao processar NFe ${id}: ${err.message}`);
    }
  }

  if (loading) {
    return <p>Carregando NFes importadas...</p>;
  }

  if (error) {
    return <p className="text-red-500">Erro ao carregar NFes: {error}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={fetchNfeCompras} variant="outline">
          <ArrowPathIcon className="h-5 w-5 mr-2" /> Atualizar Lista
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chave de Acesso</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Data Emissão</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Processamento</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nfeCompras.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">Nenhuma NFe de compra importada encontrada.</TableCell>
            </TableRow>
          ) : (
            nfeCompras.map((nfe) => (
              <TableRow key={nfe.id}>
                <TableCell className="font-medium truncate max-w-xs" title={nfe.chaveAcesso || "N/A"}>{nfe.chaveAcesso || "N/A"}</TableCell>
                <TableCell>{nfe.fornecedor?.nome || nfe.fornecedorNome || "N/A"} ({nfe.fornecedor?.cnpj || nfe.fornecedorCnpj || "N/A"})</TableCell>
                <TableCell>{nfe.dataEmissao ? new Date(nfe.dataEmissao).toLocaleDateString() : "N/A"}</TableCell>
                <TableCell>R$ {nfe.valorTotal.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      nfe.statusProcessamento === "PROCESSADA_COM_SUCESSO" ? "default" :
                      nfe.statusProcessamento === "ERRO_PROCESSAMENTO" ? "destructive" :
                      nfe.statusProcessamento === "PROCESSANDO" ? "outline" :
                      "secondary"
                    }
                  >
                    {nfe.statusProcessamento || "PENDENTE"}
                  </Badge>
                </TableCell>
                <TableCell>{nfe.dataProcessamento ? new Date(nfe.dataProcessamento).toLocaleString() : "N/A"}</TableCell>
                <TableCell className="truncate max-w-xs" title={nfe.observacoesErro || "-"}>{nfe.observacoesErro || "-"}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => alert(`Detalhes da NFe ${nfe.id} (XML):
${nfe.xmlContent?.substring(0,500) || "Sem conteúdo XML"}`)}>
                    <EyeIcon className="h-4 w-4 mr-1" /> Ver XML
                  </Button>
                  {nfe.statusProcessamento !== "PROCESSANDO" && (
                    <Button size="sm" onClick={() => handleProcessNfe(nfe.id)} disabled={nfe.statusProcessamento === "PROCESSADA_COM_SUCESSO"}>
                      {nfe.statusProcessamento === "ERRO_PROCESSAMENTO" || nfe.statusProcessamento === "IMPORTADA_AGUARDANDO_PROCESSAMENTO" ? "Processar" : "Re-processar"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

