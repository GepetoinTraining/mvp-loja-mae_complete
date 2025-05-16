// src/components/checklist-instalacao/ChecklistList.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Corrected path
import { Button } from "@/components/ui/button"; // Corrected path
import { Eye, Edit, Trash2 } from "lucide-react";
import { ChecklistInstalacaoData } from "@/app/(protected)/checklist-instalacao/page"; // Import the type
import { Badge } from "@/components/ui/badge";
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

interface ChecklistListProps {
  checklists: ChecklistInstalacaoData[];
}

const ChecklistList: React.FC<ChecklistListProps> = ({ checklists }) => {
  if (!checklists || checklists.length === 0) {
    return <p>Nenhum checklist de instalação encontrado.</p>;
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "secondary";
      case "EM_ANDAMENTO":
        return "default";
      case "CONCLUIDO":
        return "success"; // Assuming you have a success variant or will add one
      case "CONCLUIDO_COM_RESSALVAS":
        return "warning"; // Assuming you have a warning variant or will add one
      case "CANCELADO":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID Orçamento</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Data Prevista</TableHead>
          <TableHead>Instalador</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checklists.map((checklist) => (
          <TableRow key={checklist.id}>
            <TableCell>{checklist.orcamento?.id.substring(0, 8) || "N/A"}</TableCell>
            <TableCell>{checklist.orcamento?.cliente?.nome || "N/A"}</TableCell>
            <TableCell>
              {checklist.dataPrevista ? dayjs(checklist.dataPrevista).format("DD/MM/YYYY HH:mm") : "N/A"}
            </TableCell>
            <TableCell>{checklist.instalador?.name || "Não atribuído"}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(checklist.status) as any}>
                {checklist.status.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/checklist-instalacao/detalhes/${checklist.id}`} passHref>
                <Button variant="outline" size="icon" className="mr-2">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/checklist-instalacao/editar/${checklist.id}`} passHref>
                <Button variant="outline" size="icon" className="mr-2">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              {/* Add delete functionality later if needed */}
              {/* <Button variant="destructive" size="icon" onClick={() => handleDelete(checklist.id)}>
                <Trash2 className="h-4 w-4" />
              </Button> */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ChecklistList;

