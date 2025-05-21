import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_SERVER_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_SERVER_USER || "",
      pass: process.env.EMAIL_SERVER_PASSWORD || "",
    },
  });

  const from = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "";

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
