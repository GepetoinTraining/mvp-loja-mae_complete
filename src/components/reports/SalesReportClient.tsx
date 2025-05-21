"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { saveAs } from "file-saver"; // For CSV export
import Papa from "papaparse"; // For CSV generation
import { useSession } from "next-auth/react"; // To get current user role and ID

interface OrcamentoItem {
  descricao: string;
  precoFinal: number | null;
  quantidade: number | null;
  tipoProduto: string;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Vendedor {
  id: string;
  name: string | null;
}

interface SaleData {
  id: string;
  updatedAt: string; // Date when it was considered a sale (e.g., Orcamento closed)
  valorTotal: number | null;
  cliente: Cliente;
  vendedor: Vendedor | null;
  itens: OrcamentoItem[];
  status: string;
}

interface SalesReportData {
  salesData: SaleData[];
  totalSalesAmount: number;
}

interface User {
    id: string;
    name: string;
    role: string; // Assuming role is part of user object
}

export function SalesReportClient() {
  const { data: session } = useSession();
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [vendedores, setVendedores] = useState<User[]>([]);
  const [selectedVendedorId, setSelectedVendedorId] = useState<string>("");

  const fetchVendedores = useCallback(async () => {
    // Only Admin and Financeiro can see the Vendedor filter
    if (session?.user?.role === "ADMIN" || session?.user?.role === "FINANCEIRO") {
        try {
            // This API endpoint needs to be created or use an existing one that lists users with VENDEDOR role
            const response = await fetch("/api/users?role=VENDEDOR"); 
            if (!response.ok) throw new Error("Falha ao buscar vendedores");
            const data = await response.json();
            setVendedores(data);
        } catch (err: any) {
            toast.error(err.message || "Erro ao buscar lista de vendedores.");
        }
    }
  }, [session?.user?.role]);

  useEffect(() => {
    fetchVendedores();
  }, [fetchVendedores]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedVendedorId && (session?.user?.role === "ADMIN" || session?.user?.role === "FINANCEIRO")) {
        params.append("vendedorId", selectedVendedorId);
      }
      // If user is VENDEDOR, their ID is automatically used by the backend, no need to send here

      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao carregar relatório de vendas");
      }
      const result = await response.json();
      setReportData(result);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Erro ao carregar relatório.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedVendedorId, session?.user?.role]);

  useEffect(() => {
    // Fetch initial data or data when filters change
    fetchReportData();
  }, [fetchReportData]);

  const handleExportCSV = () => {
    if (!reportData || reportData.salesData.length === 0) {
      toast.info("Nenhum dado para exportar.");
      return;
    }

    const csvData = reportData.salesData.map(sale => ({
      "ID Orçamento": sale.id,
      "Data Venda": format(parseISO(sale.updatedAt), "dd/MM/yyyy HH:mm"),
      "Cliente": sale.cliente.nome,
      "Vendedor": sale.vendedor?.name || "N/A",
      "Valor Total (R$)": sale.valorTotal?.toFixed(2) || "0.00",
      "Status Orçamento": sale.status,
      "Itens": sale.itens.map(item => `${item.descricao} (Qtd: ${item.quantidade || 0}, Vlr: ${item.precoFinal?.toFixed(2) || "0.00"})`).join("; ")
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `relatorio_vendas_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
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
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <Input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          {(session?.user?.role === "ADMIN" || session?.user?.role === "FINANCEIRO") && vendedores.length > 0 && (
            <div>
              <label htmlFor="vendedor" className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
              <Select onValueChange={setSelectedVendedorId} value={selectedVendedorId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos Vendedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos Vendedores</SelectItem>
                  {vendedores.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={fetchReportData} disabled={loading}>
            {loading ? "Carregando..." : "Aplicar Filtros"}
          </Button>
          <Button onClick={handleExportCSV} variant="outline" disabled={!reportData || reportData.salesData.length === 0}>
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-red-500">Erro: {error}</p>}

      {reportData && (
        <Card>
            <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Total de Vendas no Período: <span className="font-bold text-lg">R$ {reportData.totalSalesAmount.toFixed(2)}</span>
                </p>
            </CardHeader>
            <CardContent>
                {reportData.salesData.length === 0 ? (
                    <p>Nenhuma venda encontrada para os filtros aplicados.</p>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Data Venda</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Valor Total (R$)</TableHead>
                        <TableHead>Status</TableHead>
                        {/* <TableHead>ID Orçamento</TableHead> */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.salesData.map((sale) => (
                        <TableRow key={sale.id}>
                            <TableCell>{format(parseISO(sale.updatedAt), "dd/MM/yyyy HH:mm")}</TableCell>
                            <TableCell>{sale.cliente.nome}</TableCell>
                            <TableCell>{sale.vendedor?.name || "N/A"}</TableCell>
                            <TableCell>{sale.valorTotal?.toFixed(2)}</TableCell>
                            <TableCell><Badge variant="secondary">{sale.status}</Badge></TableCell>
                            {/* <TableCell className="font-mono text-xs">{sale.id}</TableCell> */}
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}

