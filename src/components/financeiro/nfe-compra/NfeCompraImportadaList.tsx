"use client";

import { useEffect, useState } from "react";
import { NfeCompraImportada, ItemNfeCompraImportada, Fornecedor, ProdutoEstoque } from "@prisma/client";
import { Button } from "@/src/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

interface NfeCompraImportadaComItensEFornecedor extends NfeCompraImportada {
  fornecedor: Fornecedor | null;
  itens: ItemNfeCompraImportadaComProduto[];
}

interface ItemNfeCompraImportadaComProduto extends ItemNfeCompraImportada {
  produtoEstoque: ProdutoEstoque | null;
}

export function NfeCompraImportadaList() {
  const [nfeCompras, setNfeCompras] = useState<NfeCompraImportadaComItensEFornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNfeCompras = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/nfe-compra"); // This API route needs to be created
      if (!response.ok) {
        throw new Error("Falha ao buscar NFes de Compra importadas");
      }
      const data = await response.json();
      setNfeCompras(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar NFes de Compra.");
      console.error("Erro ao buscar NFes de Compra:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNfeCompras();
  }, []);

  const handleManualImport = async () => {
    toast.info("Iniciando importação manual de NFes de Compra...");
    try {
      const response = await fetch("/api/nfe-compra/importar", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || "Falha ao importar NFes.");
      }
      toast.success(`Importação concluída! ${result.novasNfesImportadas || 0} novas NFes importadas.`);
      if (result.erros && result.erros.length > 0) {
        result.erros.forEach((err: any) => toast.warning(`Erro no NSU ${err.nsu}: ${err.error}`))
      }
      fetchNfeCompras(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Erro ao acionar importação manual.");
    }
  };

  if (loading) {
    return <p>Carregando NFes de Compra...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
          <Button onClick={handleManualImport}>Verificar Novas NFes de Compra</Button>
      </div>
      {nfeCompras.length === 0 ? (
        <p>Nenhuma NFe de Compra importada encontrada.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chave de Acesso</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data Emissão</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nfeCompras.map((nfe) => (
              <TableRow key={nfe.id}>
                <TableCell className="font-mono text-xs">{nfe.chaveAcesso.substring(0,22)}...</TableCell>
                <TableCell>{nfe.fornecedorNome} ({nfe.fornecedorCnpj})</TableCell>
                <TableCell>{format(new Date(nfe.dataEmissao), "dd/MM/yyyy")}</TableCell>
                <TableCell>R$ {nfe.valorTotal.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={nfe.statusProcessamento === "PROCESSADA_COM_SUCESSO" ? "default" : (nfe.statusProcessamento === "ERRO_PROCESSAMENTO" ? "destructive" : "secondary")}>
                    {nfe.statusProcessamento.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/financeiro/nfe-compra/${nfe.id}`)} // This route needs to be created
                  >
                    Detalhes / Processar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

