"use client";

import { useEffect, useState, useCallback } from "react";
import { NfeCompraImportada, ItemNfeCompraImportada, Fornecedor, ProdutoEstoque, Conta, StatusNfeCompraImportada } from "@prisma/client";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface NfeCompraDetailViewProps {
  nfeCompraId: string;
}

interface NfeCompraImportadaFull extends NfeCompraImportada {
  fornecedor: Fornecedor | null;
  itens: ItemNfeCompraImportadaFull[];
  contaPagar: Conta | null;
}

interface ItemNfeCompraImportadaFull extends ItemNfeCompraImportada {
  produtoEstoque: ProdutoEstoque | null;
}

export function NfeCompraDetailView({ nfeCompraId }: NfeCompraDetailViewProps) {
  const [nfeCompra, setNfeCompra] = useState<NfeCompraImportadaFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [produtosEstoque, setProdutosEstoque] = useState<ProdutoEstoque[]>([]);
  const [itemMatches, setItemMatches] = useState<Record<string, string | undefined>>({}); // { [itemNfeId]: produtoEstoqueId }
  const [fornecedorId, setFornecedorId] = useState<string | undefined>(undefined);
  const [allFornecedores, setAllFornecedores] = useState<Fornecedor[]>([]);
  const [processing, setProcessing] = useState(false);

  const fetchNfeCompraDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/nfe-compra/${nfeCompraId}`);
      if (!response.ok) {
        throw new Error("Falha ao buscar detalhes da NFe de Compra");
      }
      const data: NfeCompraImportadaFull = await response.json();
      setNfeCompra(data);
      setFornecedorId(data.fornecedorId || undefined);
      const initialMatches: Record<string, string | undefined> = {};
      data.itens.forEach(item => {
        initialMatches[item.id] = item.produtoEstoqueId || undefined;
      });
      setItemMatches(initialMatches);
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar detalhes da NFe.");
    }
    setLoading(false);
  }, [nfeCompraId]);

  const fetchProdutosEstoque = useCallback(async () => {
    try {
      const response = await fetch("/api/estoque"); // Assuming this lists all stock products
      if (!response.ok) throw new Error("Falha ao buscar produtos em estoque");
      const data = await response.json();
      setProdutosEstoque(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar produtos em estoque.");
    }
  }, []);

  const fetchFornecedores = useCallback(async () => {
    try {
      const response = await fetch("/api/fornecedores");
      if (!response.ok) throw new Error("Falha ao buscar fornecedores");
      const data = await response.json();
      setAllFornecedores(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar fornecedores.");
    }
  }, []);

  useEffect(() => {
    fetchNfeCompraDetail();
    fetchProdutosEstoque();
    fetchFornecedores();
  }, [fetchNfeCompraDetail, fetchProdutosEstoque, fetchFornecedores]);

  const handleItemMatchChange = (itemNfeId: string, produtoEstoqueId: string | undefined) => {
    setItemMatches(prev => ({ ...prev, [itemNfeId]: produtoEstoqueId }));
  };

  const handleProcessNFe = async (finalStatus: StatusNfeCompraImportada) => {
    if (!nfeCompra) return;
    setProcessing(true);
    toast.info(`Processando NFe de Compra... Status: ${finalStatus}`);

    // Basic validation: if trying to mark as success, ensure all items are matched or handled
    if (finalStatus === "PROCESSADA_COM_SUCESSO") {
        const unhandledItems = nfeCompra.itens.filter(item => !itemMatches[item.id] && item.statusItem !== "IGNORAR_ITEM"); // Example of a status to ignore
        if (unhandledItems.length > 0) {
            toast.error("Não é possível marcar como processada com sucesso. Existem itens não associados.");
            setProcessing(false);
            return;
        }
        if (!fornecedorId && !nfeCompra.fornecedorId) {
            toast.error("Fornecedor não associado ou criado.");
            setProcessing(false);
            return;
        }
    }

    try {
      const payload = {
        statusProcessamento: finalStatus,
        fornecedorId: fornecedorId, // Send selected/confirmed fornecedorId
        itensProcessados: nfeCompra.itens.map(item => ({
          itemNfeCompraId: item.id,
          produtoEstoqueId: itemMatches[item.id] || null,
          // Potentially add new product/supplier creation flags here based on UI interaction
          // statusItem: itemMatches[item.id] ? "MATCH_CONFIRMADO" : "PENDENTE_MATCH"
        })),
        // Add flag to create ContaPagar if confirmed by user
        criarContaPagar: finalStatus === "PROCESSADA_COM_SUCESSO" && !nfeCompra.contaPagar, 
      };

      const response = await fetch(`/api/nfe-compra/${nfeCompraId}/processar`, { // New API endpoint for processing
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || "Falha ao processar NFe de Compra.");
      }
      toast.success("NFe de Compra processada com sucesso!");
      fetchNfeCompraDetail(); // Refresh details
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar NFe de Compra.");
    }
    setProcessing(false);
  };

  if (loading) return <p>Carregando detalhes da NFe de Compra...</p>;
  if (!nfeCompra) return <p>NFe de Compra não encontrada.</p>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Detalhes da NFe de Compra: {nfeCompra.chaveAcesso.substring(0,10)}...</CardTitle>
                <CardDescription>
                    Fornecedor: {nfeCompra.fornecedorNome} ({nfeCompra.fornecedorCnpj}) <br />
                    Data Emissão: {format(new Date(nfeCompra.dataEmissao), "dd/MM/yyyy")} | Valor Total: R$ {nfeCompra.valorTotal.toFixed(2)}
                </CardDescription>
            </div>
            <Badge variant={nfeCompra.statusProcessamento === "PROCESSADA_COM_SUCESSO" ? "default" : (nfeCompra.statusProcessamento === "ERRO_PROCESSAMENTO" ? "destructive" : "secondary")}>
                {nfeCompra.statusProcessamento.replace(/_/g, " ")}
            </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Fornecedor</h3>
        {nfeCompra.fornecedor ? (
          <p>Fornecedor vinculado: {nfeCompra.fornecedor.nome} (ID: {nfeCompra.fornecedor.id})</p>
        ) : (
          <div className="mb-4 p-4 border rounded-md">
            <p className="text-sm text-orange-600 mb-2">Este fornecedor ({nfeCompra.fornecedorNome} - CNPJ: {nfeCompra.fornecedorCnpj}) não está cadastrado ou vinculado.</p>
            <Select onValueChange={setFornecedorId} defaultValue={fornecedorId}>
              <SelectTrigger><SelectValue placeholder="Selecionar fornecedor existente ou criar novo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__CRIAR_NOVO__">-- Criar Novo Fornecedor (automático) --</SelectItem>
                {allFornecedores.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.nome} ({f.cnpj})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* TODO: Add fields to create new Fornecedor if __CRIAR_NOVO__ is selected, or handle this in the backend */} 
          </div>
        )}

        <h3 className="text-lg font-semibold mb-2 mt-4">Itens da NFe</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição (NFe)</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Vlr. Unit.</TableHead>
              <TableHead>Produto em Estoque (Associar)</TableHead>
              <TableHead>Status Item</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nfeCompra.itens.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.descricaoProduto} <br/><small className="text-gray-500">Cod. Forn: {item.codigoProdutoFornec || "N/A"}</small></TableCell>
                <TableCell>{item.quantidade} {item.unidade}</TableCell>
                <TableCell>R$ {item.valorUnitario.toFixed(2)}</TableCell>
                <TableCell>
                  <Select 
                    onValueChange={(value) => handleItemMatchChange(item.id, value === "__NENHUM__" ? undefined : value)} 
                    defaultValue={itemMatches[item.id] || "__NENHUM__"}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Associar a produto em estoque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NENHUM__">-- Não associar / Revisar --</SelectItem>
                      {/* TODO: Add option to create new stock item */} 
                      {produtosEstoque.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome} (ID: {p.id.substring(0,6)}...)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                    <Badge variant={item.produtoEstoqueId ? "default" : (itemMatches[item.id] ? "outline" : "secondary") }>
                        {item.produtoEstoqueId ? "Vinculado" : (itemMatches[item.id] ? "Pronto p/ Vincular" : (item.statusItem || "Pendente"))}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {nfeCompra.contaPagar && (
            <div className="mt-6 p-4 border rounded-md bg-green-50">
                <h3 className="text-lg font-semibold text-green-700">Conta a Pagar Gerada</h3>
                <p>ID da Conta: {nfeCompra.contaPagar.id}</p>
                <p>Descrição: {nfeCompra.contaPagar.descricao}</p>
                <p>Valor: R$ {nfeCompra.contaPagar.valor.toFixed(2)}</p>
                <p>Vencimento: {format(new Date(nfeCompra.contaPagar.dataVencimento), "dd/MM/yyyy")}</p>
                <p>Status: {nfeCompra.contaPagar.status}</p>
            </div>
        )}

      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {nfeCompra.statusProcessamento !== "PROCESSADA_COM_SUCESSO" && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={processing || nfeCompra.statusProcessamento === "IGNORADA" }>
                        Ignorar NFe
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Ignorar NFe?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta NFe não será processada e nenhuma atualização de estoque ou contas a pagar será feita.
                        Esta ação pode ser revertida manualmente se necessário.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleProcessNFe("IGNORADA")} disabled={processing}>
                        Confirmar Ignorar
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

        {nfeCompra.statusProcessamento !== "PROCESSADA_COM_SUCESSO" && nfeCompra.statusProcessamento !== "IGNORADA" && (
            <Button onClick={() => handleProcessNFe("AGUARDANDO_REVISAO_ADMIN")} disabled={processing} variant="outline">
                Salvar Progresso (Revisar Depois)
            </Button>
        )}
        
        {nfeCompra.statusProcessamento !== "PROCESSADA_COM_SUCESSO" && nfeCompra.statusProcessamento !== "IGNORADA" && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button disabled={processing}>Processar e Concluir</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Processamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ao confirmar, o sistema tentará vincular os produtos ao estoque, atualizar quantidades e custos,
                        associar/criar o fornecedor e gerar a conta a pagar correspondente (se ainda não existir).
                        Verifique todas as associações antes de prosseguir.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleProcessNFe("PROCESSADA_COM_SUCESSO")} disabled={processing}>
                        Confirmar e Concluir
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}

