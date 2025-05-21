"use client";

import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Changed to named import QRCodeCanvas
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PwaInstallQrCode() {
  const [appUrl, setAppUrl] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client side
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instalar Aplicativo (PWA)</CardTitle>
        <CardDescription>
          Escaneie o QR code abaixo com seu dispositivo móvel para instalar o aplicativo.
          Aponte a câmera do seu celular para o código. Você será direcionado para abrir o link no navegador,
          onde deverá aparecer a opção &quot;Adicionar à tela inicial&quot; ou &quot;Instalar aplicativo&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        {appUrl ? (
          <QRCodeCanvas // Changed to QRCodeCanvas
            value={appUrl}
            size={256} // Adjust size as needed
            level={"H"} // Error correction level
            includeMargin={true}
          />
        ) : (
          <p>Gerando QR code...</p>
        )}
        {appUrl && <p className="text-sm text-muted-foreground">URL: {appUrl}</p>}
        <p className="text-sm text-center mt-4">
          <strong>iOS (Safari):</strong> Toque no ícone de Compartilhar e selecione &quot;Adicionar à Tela de Início&quot;.<br />
          <strong>Android (Chrome):</strong> Toque no menu (três pontos) e selecione &quot;Instalar aplicativo&quot; ou &quot;Adicionar à tela inicial&quot;.
        </p>
      </CardContent>
    </Card>
  );
}

