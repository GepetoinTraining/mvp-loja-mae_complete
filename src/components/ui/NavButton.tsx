"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface NavButtonProps {
  href: string;
  label: string;
}

export function NavLink({ href, label }: NavButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} passHref>
      <Button
        variant={isActive ? "default" : "ghost"}
        className="rounded-md px-4 py-1 text-sm"
      >
        {label}
      </Button>
    </Link>
  );
}
