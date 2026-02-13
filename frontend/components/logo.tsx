import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function Logo({ size = "md", showText = true, href = "/" }: LogoProps) {
  const sizes = {
    sm: { bars: "h-5", text: "text-lg" },
    md: { bars: "h-6", text: "text-xl" },
    lg: { bars: "h-8", text: "text-2xl" }
  };

  const { bars, text } = sizes[size];

  const content = (
    <div className="flex items-center gap-0   cursor-pointer hover:opacity-80 transition-opacity">
      <Image
        src="/dark-logo1.png"
        alt="Metis Logo"
        width={26}
        height={29}
        className={bars}
      />
      {showText && (
        <span className={`font-bold ${text} text-foreground text-xl`}>
          etis
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
