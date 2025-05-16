import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Basic email sending function (can be moved to a lib/email.ts later)
async function sendEmail(to: string, subject: string, html: string) {
  // TODO: Replace with actual email sending configuration from environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_SERVER_PORT) || 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_SERVER_USER || "your-email@gmail.com",
      pass: process.env.EMAIL_SERVER_PASSWORD || "your-password",
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || "your-email@gmail.com",
    to: to,
    subject: subject,
    html: html,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(req: NextRequest) {
  try {
    // This endpoint will trigger the processing of all reminder types

    // 1. Process Follow-up Reminders for Leads/Quotations
    const pendingQuotations = await prisma.orcamento.findMany({
      where: {
        OR: [
          { status: "EM_ANDAMENTO" },
          { status: "AGUARDANDO_APROVACAO" },
        ],
        // Add logic for time elapsed, e.g., updatedAt < X days ago
        // For now, let's assume we send a reminder if it's in this status
      },
      include: {
        cliente: true, // Need client email
        vendedor: true, // Need salesperson email/name
      },
    });

    for (const quotation of pendingQuotations) {
      if (quotation.cliente && quotation.cliente.email) {
        const subject = `Follow-up on your quotation: ${quotation.id}`;
        const body = `<p>Dear ${quotation.cliente.nome},</p>
                      <p>This is a friendly follow-up on your quotation (ID: ${quotation.id}).</p>
                      <p>Please let us know if you have any questions.</p>
                      <p>Regards,</p>
                      <p>${quotation.vendedor?.name || "Our Team"}</p>`;
        // await sendEmail(quotation.cliente.email, subject, body);
        // For now, we'll just log it
        console.log(`Reminder email (not actually sent) for quotation ${quotation.id} to ${quotation.cliente.email}`);
      }
    }

    // 2. Process Upcoming Visit Reminders
    const upcomingVisits = await prisma.visita.findMany({
        where: {
            dataHora: {
                gte: new Date(), // From now
                lte: new Date(new Date().setDate(new Date().getDate() + 3)) // Up to 3 days from now
            },
            // Potentially add a status to ensure we only remind for scheduled/confirmed visits
        },
        include: {
            cliente: true,
            vendedor: true,
        }
    });

    for (const visit of upcomingVisits) {
        if (visit.cliente && visit.cliente.email) {
            const subject = `Reminder: Upcoming Visit on ${visit.dataHora.toLocaleDateString()}`;
            const body = `<p>Dear ${visit.cliente.nome},</p>
                          <p>This is a reminder for your upcoming visit scheduled for ${visit.dataHora.toLocaleString()} with ${visit.vendedor?.name || "our representative"}.</p>
                          <p>We look forward to seeing you!</p>`;
            // await sendEmail(visit.cliente.email, subject, body);
            console.log(`Reminder email (not actually sent) for visit ${visit.id} to ${visit.cliente.email}`);
        }
    }
    
    // 3. Process Installation Reminders (Simplified for now)
    // This needs more complex logic based on Orcamento.etapaPosVenda and ProdutoEstoque.tempoEntregaDias
    // For now, let's assume a simple check if an order is in AGUARDANDO_INSTALACAO
    const awaitingInstallationOrders = await prisma.orcamento.findMany({
        where: {
            etapaPosVenda: "AGUARDANDO_INSTALACAO",
        },
        include: {
            cliente: true,
        }
    });

    for (const order of awaitingInstallationOrders) {
        if (order.cliente && order.cliente.email) {
            const subject = `Update on your order ${order.id}: Ready for Installation Scheduling`;
            const body = `<p>Dear ${order.cliente.nome},</p>
                          <p>Good news! Your order (ID: ${order.id}) is now ready, and we are awaiting scheduling for installation.</p>
                          <p>We will contact you soon to arrange a suitable date and time.</p>`;
            // await sendEmail(order.cliente.email, subject, body);
            console.log(`Reminder email (not actually sent) for order ${order.id} (awaiting installation) to ${order.cliente.email}`);
        }
    }


    return NextResponse.json({ message: "Reminder processing initiated. Check server logs for details." });
  } catch (error) {
    console.error("Error processing reminders:", error);
    return NextResponse.json({ error: "Error processing reminders" }, { status: 500 });
  }
}

