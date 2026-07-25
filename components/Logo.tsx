import Link from "next/link";
import Image from "next/image";

type Props = {
  size?: "sm" | "md" | "lg";
  href?: string | false;
  showWordmark?: boolean;
};

const sizes = { sm: 34, md: 40, lg: 64 };

export function Logo({ size = "md", href = "/", showWordmark = true }: Props) {
  const px = sizes[size];
  const content = (
    <span className="logo-mark">
      <Image
        src="/negarit-drum.png"
        alt="Negarit AI"
        width={px}
        height={px}
        priority
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
      {showWordmark && <span>Negarit AI</span>}
    </span>
  );

  if (href === false) return content;
  return <Link href={href || "/"}>{content}</Link>;
}
