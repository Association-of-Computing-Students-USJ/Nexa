type ImgSlotProps = {
  src?: string;
  alt?: string;
  label: string;
  className?: string;
  dark?: boolean;
};

/** Placeholder frame until a section image is provided. */
export default function ImgSlot({ src, alt, label, className = "", dark = false }: ImgSlotProps) {
  if (src) {
    return <img src={src} alt={alt ?? label} className={`w-full h-full object-cover ${className}`} loading="lazy" decoding="async" />;
  }

  return (
    <div
      className={`img-slot relative flex flex-col items-center justify-center gap-3 rounded-2xl overflow-hidden ${className} ${
        dark ? "bg-[#1a1a1a]" : "bg-gray-100"
      }`}
    >
      <div
        className={`absolute inset-3 rounded-xl border-2 border-dashed pointer-events-none ${
          dark ? "border-[#303030]" : "border-gray-300"
        }`}
      />
      <span className={`material-symbols-outlined text-5xl relative z-10 ${dark ? "text-[#3a3a3a]" : "text-gray-300"}`}>
        add_photo_alternate
      </span>
      <span
        className={`relative z-10 font-mono text-xs px-3 py-1.5 rounded-full tracking-wider ${
          dark ? "bg-[#252525] text-[#555]" : "bg-gray-200 text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
