// src/components/ai/ProductDescriptionGenerator.tsx
"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ProductDescriptionGeneratorProps {
  productType: string;
  currentDescription?: string;
  onDescriptionGenerated: (description: string) => void;
}

export function ProductDescriptionGenerator({
  productType,
  currentDescription,
  onDescriptionGenerated,
}: ProductDescriptionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDescription = async () => {
    if (!productType) {
      setError("Por favor, informe o tipo de produto primeiro.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/generate-product-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType, currentDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao gerar descrição");
      }

      const data = await response.json();
      onDescriptionGenerated(data.description);
    } catch (err: any) {
      setError(err.message);
      console.error("Error generating description:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <Button 
        type="button" 
        onClick={handleGenerateDescription} 
        disabled={isLoading || !productType}
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
        ) : (
          "Gerar Descrição com IA"
        )}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

