"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns"; // Not strictly needed for inventory, but good practice
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

interface ProdutoEstoque {
  id: string;
  nome: string;
  descricao: string | null;
  unidadeMedida: string;
  quantidade: number;
  precoCusto: number | null;
  precoVenda: number | null;
  fornecedor: { id: string; nome: string } | null;
  // categoria: string | null; // If category is added
  // Add other relevant fields from your ProdutoEstoque model
}

interface InventoryReport {
  inventoryData: ProdutoEstoque[];
  totalValue: number;
}

export function InventoryReportClient() {
  const [reportData, setReportData] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("");
  // const [category, setCategory] = useState<string>(""); // For category filter

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (lowStockThreshold) params.append("lowStockThreshold", lowStockThreshold);
      // if (category) params.append("category", category);

      const response = await fetch(`/api/reports/inventory?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao carregar relatório de estoque");
      }
      const result = await response.json();
      setReportData(result);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Erro ao carregar relatório.");
    } finally {
      setLoading(false);
    }
  }, [lowStockThreshold]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportCSV = () => {
    if (!reportData || reportData.inventoryData.length === 0) {
      toast.info("Nenhum dado para exportar.");
      return;
    }

    const csvData = reportData.inventoryData.map(item => ({
      "ID Produto": item.id,
      "Nome": item.nome,
      "Descrição": item.descricao || "",
      "Unidade": item.unidadeMedida,
      "Quantidade": item.quantidade,
      "Preço Custo (R$)": item.precoCusto?.toFixed(2) || "0.00",
      "Valor Total Custo (R$)": ((item.precoCusto || 0) * item.quantidade).toFixed(2),
      "Preço Venda (R$)": item.precoVenda?.toFixed(2) || "0.00",
      "Fornecedor Principal": item.fornecedor?.nome || "N/A",
      // "Categoria": item.categoria || "N/A",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `relatorio_estoque_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    toast.success("Relatório exportado para CSV!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
            <CardTitle>Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">Qtd. Mínima (Alerta)</label>
            <Input 
                type="number"
                id="lowStockThreshold"
                placeholder="Ex: 10"
                value={lowStockThreshold} 
                onChange={(e) => setLowStockThreshold(e.target.value)} 
            />
          </div>
          {/* Example for category filter - needs backend support and category data
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Tecidos" />
          </div>
          */}
          <Button onClick={fetchReportData} disabled={loading}>
            {loading ? "Carregando..." : "Aplicar Filtros"}
          </Button>
          <Button onClick={handleExportCSV} variant="outline" disabled={!reportData || reportData.inventoryData.length === 0}>
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-red-500">Erro: {error}</p>}

      {reportData && (
        <Card>
            <CardHeader>
                <CardTitle>Resultados do Estoque</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Valor Total do Estoque (Preço de Custo): <span className="font-bold text-lg">R$ {reportData.totalValue.toFixed(2)}</span>
                </p>
            </CardHeader>
            <CardContent>
                {reportData.inventoryData.length === 0 ? (
                    <p>Nenhum item de estoque encontrado para os filtros aplicados.</p>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Preço Custo (R$)</TableHead>
                        <TableHead className="text-right">Preço Venda (R$)</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.inventoryData.map((item) => (
                        <TableRow key={item.id} className={lowStockThreshold && item.quantidade <= parseInt(lowStockThreshold) ? "bg-yellow-100" : ""}>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell>{item.unidadeMedida}</TableCell>
                            <TableCell className="text-right">{item.quantidade}</TableCell>
                            <TableCell className="text-right">{item.precoCusto?.toFixed(2) || "-"}</TableCell>
                            <TableCell className="text-right">{item.precoVenda?.toFixed(2) || "-"}</TableCell>
                            <TableCell>{item.fornecedor?.nome || "N/A"}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
      )}
      {loading && <p>Carregando dados...</p>}
      {!loading && !reportData && !error && <p>Nenhum dado de estoque para exibir.</p>}
    </div>
  );
}

