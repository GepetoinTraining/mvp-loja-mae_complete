"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: string;
  cliente: { id: string; nome: string } | null;
  orcamento: { id: string; observacoes: string | null } | null;
  diasAtraso: number;
  agingBucket: string;
}

const AGING_BUCKETS_ORDER = ["Current", "1-30 Days", "31-60 Days", "61-90 Days", "> 90 Days"];

export function AccountsReceivableReportClient() {
  const [reportData, setReportData] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState<Record<string, { count: number; total: number }>>({});

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (asOfDate) params.append("asOfDate", asOfDate);

      const response = await fetch(`/api/reports/accounts-receivable?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao carregar relatório de Contas a Receber");
      }
      const result = await response.json();
      setReportData(result);
      calculateSummary(result);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Erro ao carregar relatório.");
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const calculateSummary = (data: ContaReceber[]) => {
    const newSummary: Record<string, { count: number; total: number }> = {};
    AGING_BUCKETS_ORDER.forEach(bucket => {
        newSummary[bucket] = { count: 0, total: 0 };
    });
    let grandTotal = 0;

    data.forEach(conta => {
      const bucket = conta.agingBucket;
      if (!newSummary[bucket]) {
        newSummary[bucket] = { count: 0, total: 0 };
      }
      newSummary[bucket].count++;
      newSummary[bucket].total += conta.valor;
      grandTotal += conta.valor;
    });
    newSummary["Total Geral"] = { count: data.length, total: grandTotal };
    setSummary(newSummary);
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.info("Nenhum dado para exportar.");
      return;
    }

    const csvData = reportData.map(conta => ({
      "ID Conta": conta.id,
      "Descrição": conta.descricao,
      "Cliente": conta.cliente?.nome || "N/A",
      "Orçamento ID": conta.orcamento?.id || "N/A",
      "Valor (R$)": conta.valor.toFixed(2),
      "Data Vencimento": format(parseISO(conta.dataVencimento), "dd/MM/yyyy"),
      "Status": conta.status,
      "Dias Atraso": conta.diasAtraso,
      "Faixa de Atraso": conta.agingBucket,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `relatorio_contas_receber_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
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
            <label htmlFor="asOfDate" className="block text-sm font-medium text-gray-700 mb-1">Data Base</label>
            <Input type="date" id="asOfDate" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          </div>
          <Button onClick={fetchReportData} disabled={loading}>
            {loading ? "Carregando..." : "Aplicar Filtros"}
          </Button>
          <Button onClick={handleExportCSV} variant="outline" disabled={reportData.length === 0}>
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-red-500">Erro: {error}</p>}
      
      {Object.keys(summary).length > 0 && (
        <Card>
            <CardHeader><CardTitle>Resumo do Contas a Receber por Faixa</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Faixa de Atraso</TableHead>
                            <TableHead className="text-right">Qtd. Contas</TableHead>
                            <TableHead className="text-right">Valor Total (R$)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {AGING_BUCKETS_ORDER.map(bucket => summary[bucket] && (
                            <TableRow key={bucket}>
                                <TableCell>{bucket}</TableCell>
                                <TableCell className="text-right">{summary[bucket].count}</TableCell>
                                <TableCell className="text-right">{summary[bucket].total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                         <TableRow className="font-bold bg-gray-50">
                            <TableCell>Total Geral</TableCell>
                            <TableCell className="text-right">{summary["Total Geral"]?.count || 0}</TableCell>
                            <TableCell className="text-right">{summary["Total Geral"]?.total.toFixed(2) || "0.00"}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

      {reportData.length > 0 && (
        <Card>
            <CardHeader><CardTitle>Detalhes das Contas a Receber</CardTitle></CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead>Data Venc.</TableHead>
                    <TableHead>Dias Atraso</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.map((conta) => (
                    <TableRow key={conta.id}>
                        <TableCell>{conta.cliente?.nome || "N/A"}</TableCell>
                        <TableCell>{conta.descricao}</TableCell>
                        <TableCell className="text-right">{conta.valor.toFixed(2)}</TableCell>
                        <TableCell>{format(parseISO(conta.dataVencimento), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-center">{conta.diasAtraso}</TableCell>
                        <TableCell>{conta.agingBucket}</TableCell>
                        <TableCell><Badge variant={conta.status === "VENCIDO" ? "destructive" : "secondary"}>{conta.status}</Badge></TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
      {loading && <p>Carregando dados...</p>}
      {!loading && reportData.length === 0 && !error && <p>Nenhuma conta a receber encontrada para os filtros aplicados.</p>}
    </div>
  );
}

