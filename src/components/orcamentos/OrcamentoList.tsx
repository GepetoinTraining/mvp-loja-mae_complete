// components/orcamentos/OrcamentoList.tsx
"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { Orcamento } from "@prisma/client"; // Assuming you have this type from Prisma

// Extend Orcamento with related models if they are included in the fetch
interface OrcamentoComRelacoes extends Orcamento {
  cliente: { nome: string };
  vendedor?: { name: string } | null;
  itens: any[]; // Replace any with your ItemOrcamento type
}

export default function OrcamentoList() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrcamentos = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/orcamentos");
        if (!response.ok) {
          throw new Error(`Failed to fetch orcamentos: ${response.statusText}`);
        }
        const data = await response.json();
        setOrcamentos(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      }
      setLoading(false);
    };
    fetchOrcamentos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este orçamento?")) return;
    try {
      const response = await fetch(`/api/orcamentos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir orçamento");
      }
      setOrcamentos(orcamentos.filter((o) => o.id !== id));
      alert("Orçamento excluído com sucesso!");
    } catch (err: any) {
      alert(`Erro ao excluir orçamento: ${err.message}`);
      console.error(err);
    }
  };

  if (loading) return <p>Carregando orçamentos...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar orçamentos: {error}</p>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {orcamentos.length === 0 ? (
        <p>Nenhum orçamento encontrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orcamentos.map((orcamento) => (
              <TableRow key={orcamento.id}>
                <TableCell className="font-medium">{orcamento.id.substring(0, 8)}...</TableCell>
                <TableCell>{orcamento.cliente?.nome || "N/A"}</TableCell>
                <TableCell>{orcamento.vendedor?.name || "N/A"}</TableCell>
                <TableCell>{new Date(orcamento.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>R$ {orcamento.valorTotal?.toFixed(2) || "0.00"}</TableCell>
                <TableCell>
                  <Badge variant={orcamento.status === "FECHADO" ? "default" : "secondary"}>
                    {orcamento.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/orcamentos/${orcamento.id}/pdf`} passHref target="_blank">
                    <Button variant="outline" size="icon" title="Ver PDF">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/orcamentos/${orcamento.id}`} passHref>
                    <Button variant="outline" size="icon" title="Ver Detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="destructive" size="icon" title="Excluir" onClick={() => handleDelete(orcamento.id)}>
                    <Trash2 className="h-4 w-4" />
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

