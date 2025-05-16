// components/shared/QrCodeDisplay.tsx
"use client";

import { QRCodeCanvas } from "qrcode.react";

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
}

export function QrCodeDisplay({
  value,
  size = 128,
  level = "M",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  includeMargin = false,
}: QrCodeDisplayProps) {
  if (!value) {
    return <p className="text-sm text-red-500">No value provided for QR code.</p>;
  }

  return (
    <div style={{ display: "inline-block", padding: includeMargin ? "16px" : "0" }}>
      <QRCodeCanvas
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level={level}
        includeMargin={includeMargin}
      />
    </div>
  );
}

