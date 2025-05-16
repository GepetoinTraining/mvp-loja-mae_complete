// src/components/ordem-producao/OrdemProducaoForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Trash2, PlusCircle } from "lucide-react";
import { Orcamento, OrdemProducao, ItemOrdemProducao, Cliente } from "@prisma/client"; // Assuming Prisma client types

const itemOrdemProducaoFormSchema = z.object({
  // produtoId: z.string().optional(), // If linking to a generic product catalog
  descricao: z.string().min(1, "Descrição do item é obrigatória"),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade é obrigatória (ex: m, m², un)"),
  observacoes: z.string().optional(),
});

const ordemProducaoFormSchema = z.object({
  orcamentoId: z.string().cuid("ID de orçamento inválido"),
  dataPrevistaEntrega: z.string().optional().nullable(), // Will be converted to Date before sending
  observacoesGerais: z.string().optional(),
  status: z.enum(["PENDENTE", "EM_PRODUCAO", "CONCLUIDA", "CANCELADA"]).default("PENDENTE"),
  itens: z.array(itemOrdemProducaoFormSchema).min(1, "Adicione pelo menos um item à ordem"),
});

type OrdemProducaoFormData = z.infer<typeof ordemProducaoFormSchema>;

interface OrdemProducaoFormProps {
  ordem?: OrdemProducao & { itens: ItemOrdemProducao[], orcamento?: Orcamento & { cliente?: Cliente | null } | null } | null; // For edit mode
}

interface OrcamentoComCliente extends Orcamento {
    cliente?: Cliente | null;
}

export default function OrdemProducaoForm({ ordem: initialOrdem }: OrdemProducaoFormProps) {
  const router = useRouter();
  const params = useParams();
  const ordemId = params?.id as string | undefined; // For edit mode

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orcamentos, setOrcamentos] = useState<OrcamentoComCliente[]>([]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrdemProducaoFormData>({
    resolver: zodResolver(ordemProducaoFormSchema),
    defaultValues: initialOrdem
      ? {
          ...initialOrdem,
          dataPrevistaEntrega: initialOrdem.dataPrevistaEntrega ? new Date(initialOrdem.dataPrevistaEntrega).toISOString().split("T")[0] : "",
        }
      : {
          orcamentoId: "",
          dataPrevistaEntrega: "",
          observacoesGerais: "",
          status: "PENDENTE",
          itens: [{ descricao: "", quantidade: 1, unidade: "un", observacoes: "" }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  useEffect(() => {
    const fetchOrcamentos = async () => {
      try {
        const response = await fetch("/api/orcamentos?includeCliente=true"); // Assuming API supports this query
        if (!response.ok) throw new Error("Failed to fetch orçamentos");
        const data = await response.json();
        setOrcamentos(data);
      } catch (err) {
        console.error("Error fetching orçamentos:", err);
        setError("Falha ao carregar orçamentos.");
      }
    };
    fetchOrcamentos();
  }, []);

  useEffect(() => {
    if (ordemId && !initialOrdem) {
      const fetchOrdem = async () => {
        try {
          const response = await fetch(`/api/ordem-producao/${ordemId}`);
          if (!response.ok) throw new Error("Ordem de produção não encontrada");
          const data = await response.json();
          reset({
            ...data,
            dataPrevistaEntrega: data.dataPrevistaEntrega ? new Date(data.dataPrevistaEntrega).toISOString().split("T")[0] : "",
          });
        } catch (err) {
          console.error("Error fetching ordem de produção:", err);
          setError("Falha ao carregar dados da ordem.");
        }
      };
      fetchOrdem();
    }
  }, [ordemId, reset, initialOrdem]);

  const onSubmit = async (data: OrdemProducaoFormData) => {
    setIsSubmitting(true);
    setError(null);
    const method = ordemId ? "PUT" : "POST";
    const url = ordemId ? `/api/ordem-producao/${ordemId}` : "/api/ordem-producao";

    const payload = {
        ...data,
        dataPrevistaEntrega: data.dataPrevistaEntrega ? new Date(data.dataPrevistaEntrega).toISOString() : null,
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${ordemId ? "atualizar" : "criar"} ordem`);
      }

      alert(`Ordem de produção ${ordemId ? "atualizada" : "criada"} com sucesso!`);
      router.push("/ordem-producao");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      console.error(`Error ${ordemId ? "updating" : "creating"} ordem:`, err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{ordemId ? "Editar" : "Nova"} Ordem de Produção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="orcamentoId" className="block text-sm font-medium text-gray-700 mb-1">Orçamento Vinculado</label>
            <Controller
              name="orcamentoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um orçamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {orcamentos.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        ID: {o.id.substring(0,8)}... (Cliente: {o.cliente?.nome || "N/A"} - {new Date(o.createdAt).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.orcamentoId && <p className="text-sm text-red-600 mt-1">{errors.orcamentoId.message}</p>}
          </div>

          <div>
            <label htmlFor="dataPrevistaEntrega" className="block text-sm font-medium text-gray-700 mb-1">Data Prevista de Entrega</label>
            <Input id="dataPrevistaEntrega" type="date" {...register("dataPrevistaEntrega")} />
            {errors.dataPrevistaEntrega && <p className="text-sm text-red-600 mt-1">{errors.dataPrevistaEntrega.message}</p>}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDENTE">Pendente</SelectItem>
                            <SelectItem value="EM_PRODUCAO">Em Produção</SelectItem>
                            <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                            <SelectItem value="CANCELADA">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>}
          </div>

          <div>
            <label htmlFor="observacoesGerais" className="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
            <Textarea id="observacoesGerais" {...register("observacoesGerais")} placeholder="Detalhes adicionais da ordem de produção" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itens da Ordem de Produção</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ descricao: "", quantidade: 1, unidade: "un", observacoes: "" })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
              <h3 className="text-lg font-semibold">Item {index + 1}</h3>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div>
                <label htmlFor={`itens.${index}.descricao`} className="block text-sm font-medium text-gray-700 mb-1">Descrição do Item</label>
                <Textarea id={`itens.${index}.descricao`} {...register(`itens.${index}.descricao`)} placeholder="Ex: Cortina Voil com forro blackout, 3.00m x 2.50m" />
                {errors.itens?.[index]?.descricao && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.descricao?.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={`itens.${index}.quantidade`} className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <Input id={`itens.${index}.quantidade`} type="number" step="0.01" {...register(`itens.${index}.quantidade`)} placeholder="0.00" />
                  {errors.itens?.[index]?.quantidade && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.quantidade?.message}</p>}
                </div>
                <div>
                  <label htmlFor={`itens.${index}.unidade`} className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <Input id={`itens.${index}.unidade`} {...register(`itens.${index}.unidade`)} placeholder="un, pç, m, m²" />
                  {errors.itens?.[index]?.unidade && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.unidade?.message}</p>}
                </div>
                 <div>
                    <label htmlFor={`itens.${index}.observacoes`} className="block text-sm font-medium text-gray-700 mb-1">Observações do Item</label>
                    <Textarea id={`itens.${index}.observacoes`} {...register(`itens.${index}.observacoes`)} placeholder="Cor, tecido, medidas específicas" />
                </div>
              </div>
            </div>
          ))}
          {errors.itens && typeof errors.itens === "object" && "message" in errors.itens && (
             <p className="text-sm text-red-600 mt-1">{errors.itens.message}</p>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-red-500 text-sm">Erro: {error}</p>}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.push("/ordem-producao")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : (ordemId ? "Salvar Alterações" : "Criar Ordem")}
        </Button>
      </div>
    </form>
  );
}

