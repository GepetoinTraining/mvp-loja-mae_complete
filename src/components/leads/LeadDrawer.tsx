"use client";

import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { LeadDTO } from "@/lib/types";
import { useLeadsStore } from "@/store/useLeadsStore";

export interface LeadDrawerProps {
  open: boolean;
  onClose: () => void;
  onConvert: (leadId: string) => Promise<void>;
}

export function LeadDrawer({ open, onClose }: LeadDrawerProps) {
  const [formData, setFormData] = useState<Partial<LeadDTO>>({ nome: "", telefone: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchLeadsByStatus = useLeadsStore((s) => s.fetchLeadsByStatus);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nome || !formData.telefone) {
      alert("Nome e telefone são obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Falha ao criar lead");
      await fetchLeadsByStatus();
      onClose();
      setFormData({ nome: "", telefone: "", email: "" });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar lead");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Adicionar Novo Lead</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando…" : "Criar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
