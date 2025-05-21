"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type Props<T> = {
  title: string;
  entity: T;
  fields: {
    key: keyof T;
    label: string;
    type?: "text" | "textarea" | "select" | "date";
    options?: { label: string; value: string }[]; // para select
  }[];
  onSave: (original: Partial<T>, updated: Partial<T>) => void;
};

export function EditableSection<T extends Record<string, any>>({
  title,
  entity,
  fields,
  onSave,
}: Props<T>) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<T>>(() =>
    Object.fromEntries(fields.map(({ key }) => [key, entity[key]])) as Partial<T>
  );

  const handleChange = (key: keyof T, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const original: Partial<T> = {};
    const updated: Partial<T> = {};

    fields.forEach(({ key }) => {
      if (form[key] !== entity[key]) {
        original[key] = entity[key];
        updated[key] = form[key];
      }
    });

    onSave(original, updated);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {!editing ? (
          <Button size="sm" onClick={() => setEditing(true)}>Editar</Button>
        ) : (
          <Button size="sm" onClick={handleSave}>Salvar</Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {fields.map(({ key, label, type = "text", options }) => (
          <div key={String(key)}>
            <Label htmlFor={String(key)}>{label}</Label>

            {type === "textarea" ? (
              <Textarea
                id={String(key)}
                value={form[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={!editing}
              />
            ) : type === "select" ? (
              <Select
                value={form[key] || ""}
                onValueChange={(val) => handleChange(key, val)}
                disabled={!editing}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={type}
                id={String(key)}
                value={form[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={!editing}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
