// src/components/estoque/EstoqueForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Estoque } from "@prisma/client"; // Assuming Prisma client type

const estoqueFormSchema = z.object({
  produtoId: z.string().cuid("ID de produto inválido (CUID)").optional().nullable(),
  nomeProduto: z.string().min(1, "Nome do produto é obrigatório"),
  descricao: z.string().optional(),
  quantidade: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
  unidade: z.string().min(1, "Unidade é obrigatória (ex: m, m², un, pç)"),
  localizacao: z.string().optional(),
  pontoReposicao: z.coerce.number().min(0, "Ponto de reposição não pode ser negativo").optional().nullable(),
  observacoes: z.string().optional(),
});

type EstoqueFormData = z.infer<typeof estoqueFormSchema>;

interface EstoqueFormProps {
  item?: Estoque | null; // For edit mode
}

export default function EstoqueForm({ item: initialItem }: EstoqueFormProps) {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string | undefined; // For edit mode

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstoqueFormData>({
    resolver: zodResolver(estoqueFormSchema),
    defaultValues: initialItem
      ? {
          ...initialItem,
          produtoId: initialItem.produtoId || "",
          pontoReposicao: initialItem.pontoReposicao === null ? undefined : initialItem.pontoReposicao,
        }
      : {
          produtoId: "",
          nomeProduto: "",
          descricao: "",
          quantidade: 0,
          unidade: "un",
          localizacao: "",
          pontoReposicao: undefined,
          observacoes: "",
        },
  });

  useEffect(() => {
    if (itemId && !initialItem) {
      const fetchItem = async () => {
        try {
          const response = await fetch(`/api/estoque/${itemId}`);
          if (!response.ok) throw new Error("Item do estoque não encontrado");
          const data = await response.json();
          reset({
            ...data,
            produtoId: data.produtoId || "",
            pontoReposicao: data.pontoReposicao === null ? undefined : data.pontoReposicao,
          });
        } catch (err) {
          console.error("Error fetching estoque item:", err);
          setError("Falha ao carregar dados do item.");
        }
      };
      fetchItem();
    }
  }, [itemId, reset, initialItem]);

  const onSubmit = async (data: EstoqueFormData) => {
    setIsSubmitting(true);
    setError(null);
    const method = itemId ? "PUT" : "POST";
    const url = itemId ? `/api/estoque/${itemId}` : "/api/estoque";

    const payload = {
        ...data,
        produtoId: data.produtoId === "" ? null : data.produtoId,
        pontoReposicao: data.pontoReposicao === undefined ? null : data.pontoReposicao,
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${itemId ? "atualizar" : "criar"} item no estoque`);
      }

      alert(`Item do estoque ${itemId ? "atualizado" : "criado"} com sucesso!`);
      router.push("/estoque");
      router.refresh(); // To update the list on the previous page
    } catch (err: any) {
      setError(err.message);
      console.error(`Error ${itemId ? "updating" : "creating"} estoque item:`, err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{itemId ? "Editar" : "Adicionar Novo"} Item ao Estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="nomeProduto" className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto/Material</label>
            <Input id="nomeProduto" {...register("nomeProduto")} placeholder="Ex: Tecido Voil Branco, Parafuso 5mm" />
            {errors.nomeProduto && <p className="text-sm text-red-600 mt-1">{errors.nomeProduto.message}</p>}
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <Textarea id="descricao" {...register("descricao")} placeholder="Detalhes adicionais, marca, modelo, etc."/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mb-1">Quantidade Atual</label>
              <Input id="quantidade" type="number" step="0.01" {...register("quantidade")} placeholder="0.00"/>
              {errors.quantidade && <p className="text-sm text-red-600 mt-1">{errors.quantidade.message}</p>}
            </div>
            <div>
              <label htmlFor="unidade" className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <Input id="unidade" {...register("unidade")} placeholder="un, pç, m, m², kg"/>
              {errors.unidade && <p className="text-sm text-red-600 mt-1">{errors.unidade.message}</p>}
            </div>
            <div>
              <label htmlFor="pontoReposicao" className="block text-sm font-medium text-gray-700 mb-1">Ponto de Reposição (Opcional)</label>
              <Input id="pontoReposicao" type="number" step="1" {...register("pontoReposicao")} placeholder="Qtd. mínima"/>
            </div>
          </div>

          <div>
            <label htmlFor="localizacao" className="block text-sm font-medium text-gray-700 mb-1">Localização no Estoque (Opcional)</label>
            <Input id="localizacao" {...register("localizacao")} placeholder="Ex: Prateleira A-3, Corredor 2"/>
          </div>

          <div>
            <label htmlFor="produtoId" className="block text-sm font-medium text-gray-700 mb-1">ID do Produto (Sistema/Catálogo - Opcional)</label>
            <Input id="produtoId" {...register("produtoId")} placeholder="CUID do produto, se aplicável"/>
            {errors.produtoId && <p className="text-sm text-red-600 mt-1">{errors.produtoId.message}</p>}
          </div>

          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">Observações Adicionais</label>
            <Textarea id="observacoes" {...register("observacoes")} placeholder="Qualquer outra informação relevante"/>
          </div>

        </CardContent>
      </Card>

      {error && <p className="text-red-500 text-sm">Erro: {error}</p>}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.push("/estoque")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : (itemId ? "Salvar Alterações" : "Adicionar Item")}
        </Button>
      </div>
    </form>
  );
}

