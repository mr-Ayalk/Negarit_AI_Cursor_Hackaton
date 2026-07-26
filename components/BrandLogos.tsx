"use client";

import Image from "next/image";

type Size = "sm" | "md" | "lg";

const ZEMEN = { sm: 96, md: 140, lg: 200 } as const;
const TELE = { sm: 72, md: 100, lg: 132 } as const;

export function ZemenLogo({
  size = "md",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const w = ZEMEN[size];
  return (
    <span className={`brand-logo brand-logo--zemen ${className}`}>
      <Image
        src="/zemen.png"
        alt="Zemen Gebeya"
        width={w}
        height={Math.round(w * 0.55)}
        style={{ width: w, height: "auto", objectFit: "contain" }}
        priority={size === "lg"}
      />
    </span>
  );
}

export function TelebirrLogo({
  size = "md",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const w = TELE[size];
  return (
    <span className={`brand-logo brand-logo--tele ${className}`}>
      <Image
        src="/tele.jpg"
        alt="telebirr"
        width={w}
        height={Math.round(w * 0.42)}
        style={{ width: w, height: "auto", objectFit: "contain" }}
      />
    </span>
  );
}

/** Paired Zemen + Telebirr marks for checkout headers */
export function ShopPayBrands({ size = "sm" }: { size?: Size }) {
  return (
    <div className="shop-pay-brands">
      <ZemenLogo size={size} />
      <span className="shop-pay-brands__sep" aria-hidden />
      <TelebirrLogo size={size} />
    </div>
  );
}
