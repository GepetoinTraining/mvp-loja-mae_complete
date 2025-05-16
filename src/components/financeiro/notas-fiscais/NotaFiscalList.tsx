"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Edit3, FileText } from 'lucide-react';
import { toast } from "sonner";

interface Cliente {
  id: string;
  nome: string;
}

interface Orcamento {
  id: string;
  cliente: Cliente;
}

interface NotaFiscal {
  id: string;
  orcamentoId: string;
  orcamento: Orcamento;
  tipo: string;
  status: string;
  numero: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  dataEmissao: string;
  dataAutorizacao: string | null;
  createdAt: string;
}

const getStatusNotaFiscalBadgeVariant = (status: string) => {
  switch (status) {
    case "PENDENTE_GERACAO": return "secondary";
    case "GERADA": return "info";
    case "ENVIADA_SEFAZ": return "default";
    case "AUTORIZADA": return "success";
    case "REJEITADA": return "warning";
    case "CANCELADA": return "destructive";
    case "ERRO": return "destructive";
    default: return "outline";
  }
};

export function NotaFiscalList() {
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotasFiscais() {
      try {
        setLoading(true);
        const response = await fetch("/api/notas-fiscais");
        if (!response.ok) {
          throw new Error(`Failed to fetch notas fiscais: ${response.statusText}`);
        }
        const data = await response.json();
        setNotasFiscais(data);
      } catch (err: any) {
        setError(err.message);
        toast.error("Erro ao carregar notas fiscais: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNotasFiscais();
  }, []);

  if (loading) return <p>Carregando notas fiscais...</p>;
  if (error && notasFiscais.length === 0) return <p className="text-red-500">Erro: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Lista de Notas Fiscais</h2>
        <Button asChild>
          <Link href="/financeiro/notas-fiscais/nova">
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Nota Fiscal
          </Link>
        </Button>
      </div>
      {notasFiscais.length === 0 && !loading && !error && <p>Nenhuma nota fiscal encontrada.</p>}
      {error && notasFiscais.length > 0 && <p className="text-red-500 mb-4">Erro ao carregar algumas notas: {error}. Exibindo dados em cache ou parciais.</p>}
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID NF</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notasFiscais.map((nf) => (
              <TableRow key={nf.id}>
                <TableCell className="font-medium">{nf.id.substring(0, 8)}</TableCell>
                <TableCell>
                  <Link href={`/orcamentos/editar/${nf.orcamentoId}`} className="text-blue-500 hover:underline">
                    {nf.orcamentoId.substring(0, 8)}
                  </Link>
                </TableCell>
                <TableCell>{nf.orcamento?.cliente?.nome || "N/A"}</TableCell>
                <TableCell>{nf.tipo}</TableCell>
                <TableCell>
                  <Badge variant={getStatusNotaFiscalBadgeVariant(nf.status) as any}>
                    {nf.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(nf.dataEmissao), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                <TableCell>{nf.numero || "-"}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm" className="mr-2">
                    <Link href={`/financeiro/notas-fiscais/editar/${nf.id}" title="Editar">
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>
                  {/* Placeholder for view/download PDF - to be implemented with SEFAZ integration */}
                  {(nf.status === "AUTORIZADA" || nf.status === "GERADA") && 
                    <Button variant="outline" size="sm" title="Ver/Baixar PDF" disabled>
                        <FileText className="h-4 w-4" />
                    </Button>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

