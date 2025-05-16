// src/components/fornecedores/FornecedorList.tsx
"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Eye, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { Fornecedor } from "@prisma/client"; // Assuming Prisma client type

export default function FornecedorList() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFornecedores = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/fornecedores");
        if (!response.ok) {
          throw new Error(`Failed to fetch fornecedores: ${response.statusText}`);
        }
        const data = await response.json();
        setFornecedores(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      }
      setLoading(false);
    };
    fetchFornecedores();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    try {
      const response = await fetch(`/api/fornecedores/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir fornecedor");
      }
      setFornecedores(fornecedores.filter((f) => f.id !== id));
      alert("Fornecedor excluído com sucesso!");
    } catch (err: any) {
      alert(`Erro ao excluir fornecedor: ${err.message}`);
      console.error(err);
    }
  };

  if (loading) return <p>Carregando fornecedores...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar fornecedores: {error}</p>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {fornecedores.length === 0 ? (
        <p>Nenhum fornecedor encontrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fornecedores.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                <TableCell>{fornecedor.cnpj || "N/A"}</TableCell>
                <TableCell>{fornecedor.telefone || "N/A"}</TableCell>
                <TableCell>{fornecedor.email || "N/A"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/fornecedores/${fornecedor.id}`} passHref>
                    <Button variant="outline" size="icon" title="Ver Detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/fornecedores/editar/${fornecedor.id}`} passHref>
                    <Button variant="outline" size="icon" title="Editar">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="destructive" size="icon" title="Excluir" onClick={() => handleDelete(fornecedor.id)}>
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

