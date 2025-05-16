// pages/api/visitas/index.ts
import { prisma } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { clienteId, dataHora, vendedorId } = req.body;

    const novaVisita = await prisma.visita.create({
      data: {
        clienteId,
        dataHora: new Date(dataHora),
        vendedorId,
        status: "AGENDADA",
      },
    });

    return res.status(201).json(novaVisita);
  }

  res.setHeader("Allow", ["POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
