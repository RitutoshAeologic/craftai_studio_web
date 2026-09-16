import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

const sizes = {
  sm: { icon: "w-7 h-7 text-sm", text: "text-lg" },
  md: { icon: "w-9 h-9 text-base", text: "text-xl" },
  lg: { icon: "w-12 h-12 text-xl", text: "text-2xl" },
};

function LogoMark({ size = "md" }: { size?: LogoProps["size"] }) {
  const s = sizes[size ?? "md"];
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon */}
      <div
        className={`${s.icon} rounded-xl flex items-center justify-center font-black text-black flex-shrink-0`}
        style={{
          background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 60%, #6366f1 100%)",
          boxShadow: "0 0 16px rgba(0,242,254,0.35), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        ✦
      </div>
      {/* Wordmark */}
      <span className={`font-black tracking-tight text-white ${s.text}`}
        style={{ fontFamily: "var(--font-outfit, Outfit, sans-serif)" }}>
        Craft<span style={{ color: "#00f2fe" }}>AI</span>{" "}
        <span className="font-light text-[#94a3b8]">Studio</span>
      </span>
    </div>
  );
}

export default function Logo({ size = "md", href = "/" }: LogoProps) {
  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="CraftAI Studio Home">
        <LogoMark size={size} />
      </Link>
    );
  }
  return <LogoMark size={size} />;
}
