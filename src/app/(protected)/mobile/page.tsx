"use client";

import { PwaInstallQrCode } from "@/components/PwaInstallQrCode";
import { Separator } from "@/components/ui/separator";

export default function PwaInstallPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Instalação do Aplicativo PWA</h3>
        <p className="text-sm text-muted-foreground">
          Use o QR code abaixo para instalar o aplicativo em seu dispositivo móvel.
        </p>
      </div>
      <Separator />
      <PwaInstallQrCode />
    </div>
  );
}

