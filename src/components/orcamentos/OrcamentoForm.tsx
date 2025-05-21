// components/orcamentos/OrcamentoForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle } from "lucide-react";
import { Cliente } from "@prisma/client"; // Assuming Prisma client types
import { ProductDescriptionGenerator } from "@/components/ai/ProductDescriptionGenerator";

const orcamentoItemSchema = z.object({
  tipoProduto: z.string().min(1, "Tipo de produto é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  largura: z.coerce.number().optional(),
  altura: z.coerce.number().optional(),
  metragem: z.coerce.number().optional(),
  precoUnitario: z.coerce.number().optional(),
  // precoFinal will be calculated by business logic or AI
});

const orcamentoFormSchema = z.object({
  clienteId: z.string().min(1, "Cliente é obrigatório"),
  visitaId: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(orcamentoItemSchema).min(1, "Adicione pelo menos um item ao orçamento"),
});

type OrcamentoFormData = z.infer<typeof orcamentoFormSchema>;

export default function OrcamentoForm() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoFormSchema),
    defaultValues: {
      clienteId: "",
      itens: [{ tipoProduto: "", descricao: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("/api/clientes");
        if (!response.ok) throw new Error("Failed to fetch clientes");
        const data = await response.json();
        setClientes(data);
      } catch (err) {
        console.error("Error fetching clientes:", err);
      }
    };
    fetchClientes();
  }, []);

  const onSubmit = async (data: OrcamentoFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar orçamento");
      }

      const newOrcamento = await response.json();
      alert("Orçamento criado com sucesso!");
      router.push(`/orcamentos`); // Redirect to the list or to the new orcamento detail page
    } catch (err: any) {
      setError(err.message);
      console.error("Error creating orcamento:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente e Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <Controller
              name="clienteId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.clienteId && <p className="text-sm text-red-600 mt-1">{errors.clienteId.message}</p>}
          </div>
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <Textarea id="observacoes" {...register("observacoes")} placeholder="Observações gerais sobre o orçamento" />
            {errors.observacoes && <p className="text-sm text-red-600 mt-1">{errors.observacoes.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itens do Orçamento</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ tipoProduto: "", descricao: "" })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
              <h3 className="text-lg font-semibold">Item {index + 1}</h3>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div>
                <label htmlFor={`itens.${index}.tipoProduto`} className="block text-sm font-medium text-gray-700 mb-1">Tipo de Produto</label>
                <Input id={`itens.${index}.tipoProduto`} {...register(`itens.${index}.tipoProduto`)} placeholder="Ex: Cortina Rolô" />
                {errors.itens?.[index]?.tipoProduto && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.tipoProduto?.message}</p>}
              </div>
              <div>
                <label htmlFor={`itens.${index}.descricao`} className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
                <Textarea id={`itens.${index}.descricao`} {...register(`itens.${index}.descricao`)} placeholder="Tecido, cor, modelo, etc."/>
                {errors.itens?.[index]?.descricao && <p className="text-sm text-red-600 mt-1">{errors.itens[index]?.descricao?.message}</p>}
                <ProductDescriptionGenerator 
                  productType={watch(`itens.${index}.tipoProduto`)}
                  currentDescription={watch(`itens.${index}.descricao`)}
                  onDescriptionGenerated={(desc) => setValue(`itens.${index}.descricao`, desc)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`itens.${index}.largura`} className="block text-sm font-medium text-gray-700 mb-1">Largura (m)</label>
                  <Input id={`itens.${index}.largura`} type="number" step="0.01" {...register(`itens.${index}.largura`)} placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor={`itens.${index}.altura`} className="block text-sm font-medium text-gray-700 mb-1">Altura (m)</label>
                  <Input id={`itens.${index}.altura`} type="number" step="0.01" {...register(`itens.${index}.altura`)} placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor={`itens.${index}.metragem`} className="block text-sm font-medium text-gray-700 mb-1">Metragem (m² ou linear)</label>
                  <Input id={`itens.${index}.metragem`} type="number" step="0.01" {...register(`itens.${index}.metragem`)} placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor={`itens.${index}.precoUnitario`} className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário (R$)</label>
                  <Input id={`itens.${index}.precoUnitario`} type="number" step="0.01" {...register(`itens.${index}.precoUnitario`)} placeholder="0.00" />
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

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Orçamento"}
        </Button>
      </div>
    </form>
  );
}

