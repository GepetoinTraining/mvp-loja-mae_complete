// src/app/(protected)/checklist-instalacao/novo/page.tsx
"use client";

import React from "react";
import ChecklistForm from "@/components/checklist-instalacao/ChecklistForm";

const NewChecklistPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Novo Checklist de Instalação</h1>
      <ChecklistForm />
    </div>
  );
};

export default NewChecklistPage;

