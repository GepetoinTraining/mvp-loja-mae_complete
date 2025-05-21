"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function StepFoto({ onConfirm }: { onConfirm: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="foto">Tire uma foto ou escolha da galeria:</Label>
        <input
          id="foto"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:border file:border-muted file:rounded-md file:bg-background file:text-sm file:font-medium"
        />
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Pré-visualização"
          className="w-full max-w-xs rounded-lg border border-muted"
        />
      )}

      <Button
        type="button"
        onClick={() => file && onConfirm(file)}
        disabled={!file}
        className="w-full"
      >
        Enviar Foto
      </Button>
    </div>
  );
}
