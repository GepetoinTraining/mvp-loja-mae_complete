"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Edit3 } from 'lucide-react';
import { toast } from "sonner";

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface Conta {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: string;
  clienteId: string | null;
  cliente: Cliente | null;
  fornecedorId: string | null;
  fornecedor: Fornecedor | null;
  orcamentoId: string | null;
  pedidoCompraId: string | null;
  createdAt: string;
}

const getStatusContaBadgeVariant = (status: string) => {
  switch (status) {
    case "PENDENTE": return "secondary";
    case "PAGA_PARCIALMENTE": return "warning";
    case "PAGA_TOTALMENTE": return "success";
    case "VENCIDA": return "destructive";
    case "CANCELADA": return "outline";
    default: return "default";
  }
};

export function ContaList() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add filter states later if needed

  useEffect(() => {
    async function fetchContas() {
      try {
        setLoading(true);
        // Add filter query params later
        const response = await fetch("/api/contas");
        if (!response.ok) {
          throw new Error(`Failed to fetch contas: ${response.statusText}`);
        }
        const data = await response.json();
        setContas(data);
      } catch (err: any) {
        setError(err.message);
        toast.error("Erro ao carregar contas: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchContas();
  }, []);

  if (loading) return <p>Carregando contas...</p>;
  if (error && contas.length === 0) return <p className="text-red-500">Erro: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Lista de Contas</h2>
        <Button asChild>
          <Link href="/financeiro/contas/novo">
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Conta
          </Link>
        </Button>
      </div>
      {/* Add filter controls here later */}
      {contas.length === 0 && !loading && !error && <p>Nenhuma conta encontrada.</p>}
      {error && contas.length > 0 && <p className="text-red-500 mb-4">Erro ao carregar algumas contas: {error}. Exibindo dados em cache ou parciais.</p>}
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cliente/Fornecedor</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="font-medium">{conta.descricao}</TableCell>
                <TableCell>
                    <Badge variant={conta.tipo === "RECEBER" ? "info" : "warning" as any}>
                        {conta.tipo}
                    </Badge>
                </TableCell>
                <TableCell>R$ {conta.valor.toFixed(2)}</TableCell>
                <TableCell>{format(new Date(conta.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                <TableCell>
                  <Badge variant={getStatusContaBadgeVariant(conta.status) as any}>
                    {conta.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{conta.cliente?.nome || conta.fornecedor?.nome || "N/A"}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/financeiro/contas/editar/${conta.id}`}>
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

