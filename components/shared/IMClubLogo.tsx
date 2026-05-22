"use client";

export function IMClubLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size, borderRadius: 8 }}
      className="bg-ink flex items-center justify-center flex-shrink-0"
    >
      <span
        style={{ fontSize: size * 0.4, letterSpacing: "0.05em" }}
        className="text-gold font-playfair font-bold leading-none"
      >
        IM
      </span>
    </div>
  );
}
