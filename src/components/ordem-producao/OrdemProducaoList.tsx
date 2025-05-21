// src/components/ordem-producao/OrdemProducaoList.tsx
"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit3, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { OrdemProducao, Orcamento, Cliente, User } from "@prisma/client"; // Assuming Prisma client types

interface OrdemProducaoComRelacoes extends OrdemProducao {
  orcamento: Orcamento & { cliente?: Cliente | null } | null;
  responsavel: User | null;
  // itens: any[]; // Add if you include items in the list view
}

export default function OrdemProducaoList() {
  const [ordens, setOrdens] = useState<OrdemProducaoComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrdens = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/ordem-producao");
        if (!response.ok) {
          throw new Error(`Failed to fetch ordens de produção: ${response.statusText}`);
        }
        const data = await response.json();
        setOrdens(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      }
      setLoading(false);
    };
    fetchOrdens();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ordem de produção?")) return;
    try {
      const response = await fetch(`/api/ordem-producao/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir ordem de produção");
      }
      setOrdens(ordens.filter((o) => o.id !== id));
      alert("Ordem de produção excluída com sucesso!");
    } catch (err: any) {
      alert(`Erro ao excluir ordem de produção: ${err.message}`);
      console.error(err);
    }
  };

  if (loading) return <p>Carregando ordens de produção...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar ordens: {error}</p>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {ordens.length === 0 ? (
        <p>Nenhuma ordem de produção encontrada.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Ordem</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Orçamento ID</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordens.map((ordem) => (
              <TableRow key={ordem.id}>
                <TableCell className="font-medium">{ordem.id.substring(0,8)}...</TableCell>
                <TableCell>{ordem.orcamento?.cliente?.nome || "N/A"}</TableCell>
                <TableCell>{ordem.orcamentoId.substring(0,8)}...</TableCell>
                <TableCell>{new Date(ordem.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge 
                    variant={ordem.status === "CONCLUIDA" ? "default" : (ordem.status === "CANCELADA" ? "destructive" : "secondary")}
                  >
                    {ordem.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/ordem-producao/${ordem.id}/pdf`} passHref target="_blank">
                    <Button variant="outline" size="icon" title="Ver PDF da Ordem">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/ordem-producao/${ordem.id}`} passHref>
                    <Button variant="outline" size="icon" title="Ver Detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/ordem-producao/editar/${ordem.id}`} passHref>
                    <Button variant="outline" size="icon" title="Editar Ordem">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  {/* Disable delete if status is not PENDENTE or CANCELADA */}
                  {(ordem.status === "PENDENTE" || ordem.status === "CANCELADA") && (
                    <Button variant="destructive" size="icon" title="Excluir Ordem" onClick={() => handleDelete(ordem.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

