// src/components/estoque/EstoqueList.tsx
"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, PlusCircle, MinusCircle } from "lucide-react";
import Link from "next/link";
import { Estoque } from "@prisma/client"; // Assuming Prisma client type

export default function EstoqueList() {
  const [estoqueItems, setEstoqueItems] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstoqueItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/estoque");
      if (!response.ok) {
        throw new Error(`Failed to fetch estoque items: ${response.statusText}`);
      }
      const data = await response.json();
      setEstoqueItems(data);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEstoqueItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item do estoque?")) return;
    try {
      const response = await fetch(`/api/estoque/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir item do estoque");
      }
      setEstoqueItems(estoqueItems.filter((item) => item.id !== id));
      alert("Item do estoque excluído com sucesso!");
    } catch (err: any) {
      alert(`Erro ao excluir item do estoque: ${err.message}`);
      console.error(err);
    }
  };
  
  const handleAdjustStock = async (id: string, adjustment: number) => {
    const currentItem = estoqueItems.find(item => item.id === id);
    if (!currentItem) return;

    const newQuantity = currentItem.quantidade + adjustment;
    if (newQuantity < 0) {
        alert("A quantidade em estoque não pode ser negativa.");
        return;
    }

    try {
        const response = await fetch(`/api/estoque/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantidade: newQuantity }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Falha ao ajustar estoque");
        }
        // Re-fetch or update local state
        fetchEstoqueItems(); 
        alert("Estoque ajustado com sucesso!");
    } catch (err: any) {
        alert(`Erro ao ajustar estoque: ${err.message}`);
        console.error(err);
    }
  };


  if (loading) return <p>Carregando itens do estoque...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar estoque: {error}</p>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {estoqueItems.length === 0 ? (
        <p>Nenhum item encontrado no estoque.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Produto</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center">Quantidade</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estoqueItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nomeProduto}</TableCell>
                <TableCell>{item.descricao || "-"}</TableCell>
                <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleAdjustStock(item.id, -1)} title="Diminuir Estoque">
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span>{item.quantidade}</span>
                        <Button variant="outline" size="icon" onClick={() => handleAdjustStock(item.id, 1)} title="Aumentar Estoque">
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
                <TableCell>{item.unidade}</TableCell>
                <TableCell>{item.localizacao || "-"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/estoque/editar/${item.id}`} passHref>
                    <Button variant="outline" size="icon" title="Editar Item">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="destructive" size="icon" title="Excluir Item" onClick={() => handleDelete(item.id)}>
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

