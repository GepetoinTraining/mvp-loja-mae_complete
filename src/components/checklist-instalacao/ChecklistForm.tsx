// src/components/checklist-instalacao/ChecklistForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button"; // Corrected path
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Corrected path
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
dayjs.locale("pt-br");

// Define a type for Orcamento (Budget) - simplified for selection
interface OrcamentoSelecao {
  id: string;
  cliente: {
    nome: string;
  };
  // Add other fields if needed for display in select
}

// Define a type for User (Instalador) - simplified for selection
interface InstaladorSelecao {
  id: string;
  name: string;
}

const checklistItemSchema = z.object({
  item: z.string().min(1, "Descrição do item é obrigatória"),
  checked: z.boolean().default(false),
  obs: z.string().optional(),
});

const checklistFormSchema = z.object({
  orcamentoId: z.string().min(1, "Orçamento é obrigatório"),
  dataPrevista: z.date().nullable().optional(),
  instaladorId: z.string().nullable().optional(),
  observacoes: z.string().optional(),
  itensConferidos: z.array(checklistItemSchema).optional().default([]),
  // status will be handled by backend or a separate update mechanism
});

type ChecklistFormValues = z.infer<typeof checklistFormSchema>;

interface ChecklistFormProps {
  initialData?: ChecklistFormValues & { id?: string }; // For editing
}

const ChecklistForm: React.FC<ChecklistFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orcamentos, setOrcamentos] = useState<OrcamentoSelecao[]>([]);
  const [instaladores, setInstaladores] = useState<InstaladorSelecao[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: initialData || {
      orcamentoId: "",
      dataPrevista: null,
      instaladorId: null,
      observacoes: "",
      itensConferidos: [{ item: "", checked: false, obs: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itensConferidos",
  });

  useEffect(() => {
    // Fetch orcamentos (budgets) that don_t have a checklist yet
    const fetchOrcamentos = async () => {
      try {
        // This API endpoint needs to be created or adjusted to filter orcamentos
        const response = await fetch("/api/orcamentos?status=FECHADO&semChecklist=true"); 
        if (!response.ok) throw new Error("Failed to fetch orcamentos");
        const data = await response.json();
        setOrcamentos(data);
      } catch (error) {
        console.error("Error fetching orcamentos:", error);
        toast({ title: "Erro ao buscar orçamentos", variant: "destructive" });
      }
    };

    // Fetch users with INSTALADOR role
    const fetchInstaladores = async () => {
      try {
        // This API endpoint needs to be created or adjusted to filter users by role
        const response = await fetch("/api/users?role=INSTALADOR"); 
        if (!response.ok) throw new Error("Failed to fetch instaladores");
        const data = await response.json();
        setInstaladores(data);
      } catch (error) {
        console.error("Error fetching instaladores:", error);
        toast({ title: "Erro ao buscar instaladores", variant: "destructive" });
      }
    };

    fetchOrcamentos();
    fetchInstaladores();

    if (initialData) {
      reset({
        ...initialData,
        dataPrevista: initialData.dataPrevista ? dayjs(initialData.dataPrevista).toDate() : null, // Use dayjs
        itensConferidos: initialData.itensConferidos?.length > 0 ? initialData.itensConferidos : [{ item: "", checked: false, obs: "" }]
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: ChecklistFormValues) => {
    try {
      setLoading(true);
      const method = initialData?.id ? "PUT" : "POST";
      const url = initialData?.id
        ? `/api/checklist-instalacao/${initialData.id}`
        : "/api/checklist-instalacao";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save checklist");
      }

      toast({
        title: `Checklist ${initialData?.id ? "atualizado" : "criado"} com sucesso!`,
      });
      router.push("/checklist-instalacao");
      router.refresh(); // To update the list page
    } catch (error: any) {
      console.error("Error saving checklist:", error);
      toast({
        title: "Erro ao salvar checklist",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="orcamentoId">Orçamento (Cliente)</Label>
        <Controller
          name="orcamentoId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData?.id}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um orçamento" />
              </SelectTrigger>
              <SelectContent>
                {orcamentos.map((orc) => (
                  <SelectItem key={orc.id} value={orc.id}>
                    {`ID: ${orc.id.substring(0,6)}... - Cliente: ${orc.cliente?.nome || "N/A"}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.orcamentoId && <p className="text-red-500 text-sm mt-1">{errors.orcamentoId.message}</p>}
      </div>

      <div>
        <Label htmlFor="dataPrevista">Data Prevista da Instalação</Label>
        <Controller
          name="dataPrevista"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? dayjs(field.value).format("PPP") : <span>Escolha uma data</span>} {/* Use dayjs */}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value || undefined}
                  onSelect={field.onChange}
                  initialFocus
                  // locale={ptBR} // dayjs handles locale globally
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.dataPrevista && <p className="text-red-500 text-sm mt-1">{errors.dataPrevista.message}</p>}
      </div>

      <div>
        <Label htmlFor="instaladorId">Instalador Responsável</Label>
        <Controller
          name="instaladorId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um instalador (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem> {/* Allow unselecting */}
                {instaladores.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.instaladorId && <p className="text-red-500 text-sm mt-1">{errors.instaladorId.message}</p>}
      </div>

      <div>
        <Label htmlFor="observacoes">Observações Gerais</Label>
        <Controller
          name="observacoes"
          control={control}
          render={({ field }) => <Textarea {...field} placeholder="Observações sobre a instalação..." />}
        />
        {errors.observacoes && <p className="text-red-500 text-sm mt-1">{errors.observacoes.message}</p>}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Itens a Conferir</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start space-x-2 mb-3 p-3 border rounded-md">
            <div className="flex-grow space-y-2">
                <Controller
                    name={`itensConferidos.${index}.item`}
                    control={control}
                    render={({ field: itemField }) => (
                        <Input {...itemField} placeholder={`Descrição do item ${index + 1}`} />
                    )}
                />
                {errors.itensConferidos?.[index]?.item && <p className="text-red-500 text-sm">{errors.itensConferidos[index]?.item?.message}</p>}
                
                <Controller
                    name={`itensConferidos.${index}.obs`}
                    control={control}
                    render={({ field: obsField }) => (
                        <Input {...obsField} placeholder="Observação do item (opcional)" />
                    )}
                />
            </div>
            <div className="flex flex-col items-center space-y-1 pt-1">
                 <Controller
                    name={`itensConferidos.${index}.checked`}
                    control={control}
                    render={({ field: checkedField }) => (
                        <Checkbox
                            checked={checkedField.value}
                            onCheckedChange={checkedField.onChange}
                            id={`item-checked-${index}`}
                        />
                    )}
                />
                <Label htmlFor={`item-checked-${index}`} className="text-xs">Conferido</Label>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-1">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ item: "", checked: false, obs: "" })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
        </Button>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} className="mr-2" disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : (initialData?.id ? "Salvar Alterações" : "Criar Checklist")}
        </Button>
      </div>
    </form>
  );
};

export default ChecklistForm;

