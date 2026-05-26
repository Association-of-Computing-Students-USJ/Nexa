import { useEffect, useRef } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import QRCodeStyling from "qr-code-styling";
import nexaLogo from "../../assets/images/logo/NEXA Colour.png";
import { EVENT_DATE } from "../../data/eventInfo";

interface TicketData {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  university: string;
  year: string;
}

export default function TicketPage() {
  const { state } = useLocation() as { state: { ticket: TicketData } | null };
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);

  const ticket: TicketData | null = state?.ticket ?? null;

  useEffect(() => {
    if (!ticket || !qrContainerRef.current) return;
    const container = qrContainerRef.current;
    container.innerHTML = "";

    const qr = new QRCodeStyling({
      width: 200,
      height: 200,
      type: "canvas",
      data: `NEXA-2026-${ticket.id}`,
      dotsOptions: { color: "#19D1E6", type: "rounded" },
      backgroundOptions: { color: "#0e0e0e" },
      cornersSquareOptions: { type: "extra-rounded", color: "#19D1E6" },
      cornersDotOptions: { color: "#0ea5e9" },
      qrOptions: { errorCorrectionLevel: "M" },
    });

    qr.append(container);
    qrInstanceRef.current = qr;
  }, [ticket?.id]);

  if (!ticket) return <Navigate to="/register" replace />;

  const shortId = ticket.id.slice(0, 8).toUpperCase();

  const handleDownload = () => {
    qrInstanceRef.current?.download({
      name: `nexa-2026-ticket-${ticket.id.slice(0, 8)}`,
      extension: "png",
    });
  };

  return (
    <div className="min-h-dvh bg-[#0e0e0e] flex flex-col items-center justify-center px-4 py-12 sm:py-16">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#19D1E6]/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Confirmation badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#19D1E6]/10 border border-[#19D1E6]/25">
            <span className="material-symbols-outlined text-[#19D1E6] text-base">check_circle</span>
            <span className="text-[#19D1E6] text-xs font-semibold tracking-widest uppercase">
              Registration Confirmed
            </span>
          </div>
        </div>

        {/* Ticket card */}
        <div className="rounded-3xl overflow-hidden border border-[#2a2a2a] bg-[#161616] shadow-2xl">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#19D1E6] via-[#0ea5e9] to-[#19D1E6]" />

          {/* Header */}
          <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
            <img src={nexaLogo} alt="NEXA" className="h-10 mx-auto mb-4 object-contain" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 break-words">
              {ticket.name}
            </h1>
            <p className="text-[#888] text-sm">
              {ticket.university} &middot; {ticket.year}
            </p>
          </div>

          <div className="mx-6 sm:mx-8 border-t border-dashed border-[#2a2a2a]" />

          {/* QR code */}
          <div className="px-6 sm:px-8 py-7 flex flex-col items-center">
            <div className="p-4 bg-[#0e0e0e] rounded-2xl border border-[#2a2a2a]">
              <div ref={qrContainerRef} />
            </div>
            <p className="mt-3 text-[#555] text-xs font-mono tracking-widest">
              {shortId}···{ticket.id.slice(-4).toUpperCase()}
            </p>
          </div>

          <div className="mx-6 sm:mx-8 border-t border-dashed border-[#2a2a2a]" />

          {/* Event info grid */}
          <div className="px-6 sm:px-8 py-5 grid grid-cols-2 gap-y-4">
            {[
              { label: "Date",        value: EVENT_DATE },
              { label: "Venue",       value: "USJP, Sri Lanka" },
              { label: "Access",      value: "All-Access Pass" },
              { label: "Ticket ID",   value: shortId, accent: true },
              { label: "Email",       value: ticket.email, accent: true, full: true },
            ].map((item) => (
              <div key={item.label} className={item.full ? "col-span-2" : ""}>
                <p className="text-[#555] text-xs uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className={`text-sm font-medium break-all ${item.accent ? "text-[#19D1E6]" : "text-white"}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-6 sm:px-8 pb-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#19D1E6] text-[#0e0e0e] font-semibold rounded-xl hover:bg-[#19D1E6]/90 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Save QR Code
            </button>
            <Link
              to="/"
              className="flex-1 flex items-center justify-center py-4 border border-[#2a2a2a] text-[#888] font-medium rounded-xl hover:border-[#444] hover:text-white transition-colors text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#555] leading-relaxed">
          A copy of your ticket has been sent to{" "}
          <span className="text-[#19D1E6]">{ticket.email}</span>
        </p>
      </div>
    </div>
  );
}
