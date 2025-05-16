// src/components/pedidos-compra/PedidoCompraList.tsx
"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Eye, Edit3, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { PedidoCompra, Fornecedor } from "@prisma/client"; // Assuming Prisma client types

interface PedidoCompraComRelacoes extends PedidoCompra {
  fornecedor: Fornecedor;
  // itens: any[]; // Add if you include items in the list view
}

export default function PedidoCompraList() {
  const [pedidos, setPedidos] = useState<PedidoCompraComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/pedidos-compra");
        if (!response.ok) {
          throw new Error(`Failed to fetch pedidos de compra: ${response.statusText}`);
        }
        const data = await response.json();
        setPedidos(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      }
      setLoading(false);
    };
    fetchPedidos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este pedido de compra?")) return;
    try {
      const response = await fetch(`/api/pedidos-compra/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir pedido de compra");
      }
      setPedidos(pedidos.filter((p) => p.id !== id));
      alert("Pedido de compra excluído com sucesso!");
    } catch (err: any) {
      alert(`Erro ao excluir pedido de compra: ${err.message}`);
      console.error(err);
    }
  };

  if (loading) return <p>Carregando pedidos de compra...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar pedidos: {error}</p>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {pedidos.length === 0 ? (
        <p>Nenhum pedido de compra encontrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell className="font-medium">{pedido.id.substring(0,8)}...</TableCell>
                <TableCell>{pedido.fornecedor?.nome || "N/A"}</TableCell>
                <TableCell>{new Date(pedido.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>R$ {pedido.valorTotal?.toFixed(2) || "0.00"}</TableCell>
                <TableCell>
                  <Badge variant={pedido.status === "CONCLUIDO" ? "default" : "secondary"}>
                    {pedido.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {/* Placeholder for PDF view if implemented */}
                  {/* <Link href={`/pedidos-compra/${pedido.id}/pdf`} passHref target="_blank">
                    <Button variant="outline" size="icon" title="Ver PDF Pedido">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Link> */}
                  <Link href={`/pedidos-compra/${pedido.id}`} passHref>
                    <Button variant="outline" size="icon" title="Ver Detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/pedidos-compra/editar/${pedido.id}`} passHref>
                    <Button variant="outline" size="icon" title="Editar Pedido">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="destructive" size="icon" title="Excluir Pedido" onClick={() => handleDelete(pedido.id)}>
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

