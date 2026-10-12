"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  Copy,
  Download,
  Globe,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Share2,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { apiUrl, initials } from "@/lib/utils";
import { track } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PublicCardData = {
  company: any;
  employee: any;
  card: any;
  products: any[];
  gallery: any[];
  theme?: any;
};

function cleanPhone(value: string) {
  return (value ?? "").replace(/[^\d+]/g, "");
}

function websiteUrl(value: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "#";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function PublicCard({ data }: { data: PublicCardData }) {
  const { company, employee, card } = data;
  const [toast, setToast] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [leadSent, setLeadSent] = useState(false);

  const accent = company.primary_color ?? "#38bdf8";
  const name = employee.name ?? "Unnamed";
  const role = [employee.designation, employee.department].filter(Boolean).join(" • ") || "—";
  const bio = employee.bio ?? "";
  const monogram = initials(name);
  const profilePic: string | undefined = employee.profile_picture_url;
  const logoUrl: string | undefined = company.logo_url;
  const backdropUrl: string | undefined = company.cover_url ?? company.banner_url ?? profilePic;
  const publicUrl: string = card.public_url ?? (typeof window !== "undefined" ? window.location.href : "");
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}`;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function copyText(text: string, label = "Copied to clipboard") {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast("Copy failed");
    }
  }

  async function share() {
    await track(card.id, "share").catch(() => {});
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: `${name} | Executive vCard`, text: `${name} — ${role}`, url: publicUrl });
      } catch {
        /* dismissed */
      }
    } else {
      copyText(publicUrl, "Link copied");
    }
  }

  function saveContact() {
    track(card.id, "contact_save").catch(() => {});
    // Prefer backend VCF; fall back to client-generated vCard (same fields as reference UI).
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:4.0",
      `N:${name};;;;`,
      `FN:${name}`,
      `ORG:${company.name ?? ""};`,
      `TITLE:${role}`,
      employee.phone ? `TEL;TYPE=cell,voice;VALUE=uri:tel:${cleanPhone(employee.phone)}` : "",
      employee.email ? `EMAIL;TYPE=work:${employee.email}` : "",
      employee.address ? `ADR;TYPE=work:;;${String(employee.address).replace(/\n/g, "\\n")};;;;` : "",
      employee.website ? `URL;TYPE=work:${websiteUrl(employee.website)}` : "",
      bio ? `NOTE:${String(bio).slice(0, 200)}` : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");
    try {
      const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, "_")}_Executive.vcf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("vCard downloaded");
    } catch {
      // Last resort: backend endpoint
      window.location.href = apiUrl(`/api/cards/${card.id}/vcf`);
    }
  }

  async function submitLead(formData: FormData) {
    await fetch(apiUrl(`/api/public/cards/${card.id}/leads`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    }).catch(() => {});
    setLeadSent(true);
    showToast("Inquiry sent");
  }

  const actions = [
    {
      label: "Call",
      icon: <Phone size={22} />,
      href: employee.phone ? `tel:${cleanPhone(employee.phone)}` : undefined,
      event: "call" as const,
    },
    {
      label: "Email",
      icon: <Mail size={22} />,
      href: employee.email ? `mailto:${employee.email}` : undefined,
      event: "email" as const,
    },
    {
      label: "Global",
      icon: <Globe size={22} />,
      href: employee.website ? websiteUrl(employee.website) : undefined,
      event: "website" as const,
    },
    {
      label: "Network",
      icon: <Users size={22} />,
      href: employee.linkedin_url ?? employee.whatsapp ? `https://wa.me/${cleanPhone(employee.whatsapp ?? employee.phone)}` : undefined,
      event: "share" as const,
    },
  ];

  return (
    <div
      className="dark min-h-screen flex flex-col items-center relative overflow-x-hidden"
      style={{
        background: "#0d1322",
        color: "#dde2f8",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Fonts (reference UI uses Plus Jakarta Sans) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Ambient luxury gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[100px]" style={{ background: "rgba(142,213,255,0.10)" }} />
        <div className="absolute top-1/2 -right-36 w-96 h-96 rounded-full blur-[120px]" style={{ background: "rgba(233,195,73,0.05)" }} />
        <div className="absolute -bottom-24 left-10 w-72 h-72 rounded-full blur-[90px]" style={{ background: "rgba(56,189,248,0.10)" }} />
      </div>

      <div className="relative z-10 w-full max-w-[440px] mx-auto min-h-screen flex flex-col pb-28">
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b shadow-sm" style={{ background: "rgba(25,31,47,0.8)", borderColor: "rgba(62,72,79,0.3)" }}>
          <div className="flex justify-between items-center w-full px-5 max-w-[440px] mx-auto py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {logoUrl ? (
                <Image src={logoUrl} alt={company.name ?? "Company"} width={120} height={28} className="h-7 w-auto object-contain" />
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] truncate" style={{ color: "#8ed5ff" }}>
                  {company.name ?? "Executive vCard"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQrOpen(true)}
                aria-label="Show QR"
                className="w-9 h-9 rounded-full grid place-items-center border border-white/10 bg-white/5 hover:border-[#8ed5ff] transition-colors"
              >
                <QrCode size={18} />
              </button>
              <button
                onClick={share}
                aria-label="Share card"
                className="w-9 h-9 rounded-full grid place-items-center border border-white/10 bg-white/5 hover:border-[#8ed5ff] transition-colors"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="px-5 pt-4 flex flex-col gap-6">
          {/* Central Executive Card Motif */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ boxShadow: "0 20px 50px -10px rgba(0,0,0,0.7), 0 0 1px 1px rgba(255,255,255,0.08) inset" }}
          >
            {/* Backdrop + glass overlay */}
            <div className="absolute inset-0 z-0">
              {backdropUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={backdropUrl} alt="" className="w-full h-full object-cover object-center opacity-30 brightness-75 scale-105" />
              ) : (
                <div className="w-full h-full" style={{ background: `linear-gradient(140deg, ${accent}33, #0d1322 55%, #7a2f2133)` }} />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,14,29,0.8), rgba(21,27,43,0.95), #080e1d)" }} />
              <div className="absolute inset-0 backdrop-blur-md" />
            </div>

            <div className="relative z-10 p-6 flex flex-col items-center text-center">
              {/* Monogram */}
              <div className="relative mb-4">
                <div
                  className="w-[104px] h-[104px] rounded-full p-1"
                  style={{ background: `linear-gradient(to top right, ${accent}, #33394a, rgba(233,195,73,0.3))`, boxShadow: "0 0 32px rgba(56,189,248,0.22)" }}
                >
                  <div className="w-full h-full rounded-full flex items-center justify-center border border-white/10 shadow-inner overflow-hidden" style={{ background: "#080e1d" }}>
                    {profilePic ? (
                      <Image src={profilePic} alt={name} width={96} height={96} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[26px] font-bold tracking-wider" style={{ color: "#8ed5ff" }}>
                        {monogram}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="absolute bottom-0 right-0 rounded-full p-1 border-2 flex items-center justify-center shadow-md"
                  style={{ background: accent, color: "#00354a", borderColor: "#0d1322" }}
                >
                  <BadgeCheck size={16} />
                </div>
              </div>

              {/* Name & role */}
              <h1 className="text-[22px] leading-7 font-extrabold tracking-wider uppercase mb-1">{name}</h1>
              <p className="text-sm font-semibold tracking-wide mb-1" style={{ color: "#8ed5ff" }}>
                {role}
              </p>
              {bio ? <p className="text-[13px] leading-5 max-w-[320px] mb-2" style={{ color: "#bdc8d1" }}>{bio}</p> : null}

              {/* Company banner */}
              <div className="w-full border rounded-xl p-2.5 mb-4 backdrop-blur-md" style={{ background: "rgba(36,42,58,0.6)", borderColor: "rgba(62,72,79,0.3)" }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#8ed5ff" }}>
                  {company.name}
                </p>
                {(company.tagline || company.industry) && (
                  <p className="text-[11px] leading-snug mb-1.5" style={{ color: "#bdc8d1" }}>
                    {company.tagline ?? company.industry}
                  </p>
                )}
                {employee.address && (
                  <p className="text-[10px] font-medium tracking-wide" style={{ color: "#87929a" }}>
                    {employee.address}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="w-full flex items-center justify-center gap-2 mb-4 opacity-80">
                <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(62,72,79,0.6))" }} />
                <div className="w-2 h-2 rotate-45 border" style={{ borderColor: "rgba(233,195,73,0.8)", background: "rgba(233,195,73,0.2)" }} />
                <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(62,72,79,0.6))" }} />
              </div>

              {/* Circular actions */}
              <div className="grid grid-cols-4 gap-3 w-full max-w-[320px] mb-6">
                {actions.map((a) => (
                  <a
                    key={a.label}
                    aria-label={a.label}
                    href={a.href}
                    target={a.label === "Global" || a.label === "Network" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={() => track(card.id, a.event).catch(() => {})}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-[52px] h-[52px] rounded-full border border-white/10 flex items-center justify-center shadow-sm transition-all duration-200 active:scale-95 group-hover:border-[#8ed5ff]" style={{ background: "rgba(36,42,58,0.8)" }}>
                      {a.icon}
                    </div>
                    <span className="text-[10px] font-medium tracking-wide group-hover:text-[#8ed5ff]" style={{ color: "#bdc8d1" }}>
                      {a.label}
                    </span>
                  </a>
                ))}
              </div>

              <button
                onClick={saveContact}
                className="w-full py-3.5 px-6 rounded-full font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(to right, ${accent}, #7bd0ff)`,
                  color: "#00354a",
                  boxShadow: "0 4px 24px rgba(56,189,248,0.35)",
                  fontSize: "0.9375rem",
                }}
              >
                <Download size={22} />
                <span>Save Contact</span>
              </button>
            </div>
          </motion.section>

          {/* Contact details (tap-to-copy bento) */}
          <section className="grid gap-2">
            {[
              { label: "Phone", value: employee.phone, href: employee.phone ? `tel:${cleanPhone(employee.phone)}` : undefined },
              { label: "Email", value: employee.email, href: employee.email ? `mailto:${employee.email}` : undefined },
              { label: "Website", value: employee.website, href: employee.website ? websiteUrl(employee.website) : undefined },
              { label: "Address", value: employee.address, href: employee.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(employee.address)}` : undefined },
            ]
              .filter((r) => r.value)
              .map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ background: "#191f2f", borderColor: "rgba(62,72,79,0.4)" }}>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#87929a" }}>{row.label}</p>
                    <a href={row.href} target={row.label === "Website" || row.label === "Address" ? "_blank" : undefined} rel="noopener noreferrer" className="text-sm font-medium truncate block">
                      {row.value}
                    </a>
                  </div>
                  <button onClick={() => copyText(row.value)} aria-label={`Copy ${row.label}`} className="w-9 h-9 shrink-0 rounded-full grid place-items-center border border-white/10 bg-white/5 hover:border-[#8ed5ff]">
                    <Copy size={16} />
                  </button>
                </div>
              ))}
          </section>

          {/* QR module */}
          <section className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: "#151b2b", borderColor: "rgba(62,72,79,0.4)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="Card QR code" width={88} height={88} className="w-[88px] h-[88px] rounded-lg bg-white p-1" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">QR Ready</p>
              <p className="text-xs truncate mb-2" style={{ color: "#bdc8d1" }}>{publicUrl}</p>
              <div className="flex gap-2">
                <button onClick={() => setQrOpen(true)} className="text-xs font-bold px-3 py-2 rounded-full" style={{ background: "rgba(142,213,255,0.15)", color: "#8ed5ff" }}>
                  Expand QR
                </button>
                <button onClick={() => copyText(publicUrl, "Link copied")} className="text-xs font-bold px-3 py-2 rounded-full border border-white/10">
                  Copy link
                </button>
              </div>
            </div>
          </section>

          {data.products.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Products</h2>
              <div className="grid gap-3">
                {data.products.map((p: any) => (
                  <div key={p.id} className="rounded-xl border p-3" style={{ background: "#191f2f", borderColor: "rgba(62,72,79,0.4)" }}>
                    <div className="font-semibold">{p.name}</div>
                    {p.description && <p className="text-sm" style={{ color: "#bdc8d1" }}>{p.description}</p>}
                    {p.price != null && <p className="text-sm font-bold mt-1" style={{ color: "#e9c349" }}>{p.price}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.gallery.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Gallery</h2>
              <div className="grid grid-cols-2 gap-2">
                {data.gallery.map((g: any) => (
                  <Image key={g.id} src={g.asset_url} alt={g.title ?? "Gallery"} width={200} height={150} className="aspect-[4/3] rounded-xl object-cover border border-white/10" />
                ))}
              </div>
            </section>
          )}

          <form
            action={submitLead}
            className="grid gap-2 rounded-2xl p-3 border"
            style={{ background: "#151b2b", borderColor: "rgba(62,72,79,0.4)" }}
          >
            <p className="text-sm font-bold px-1">Send Inquiry</p>
            <Input name="visitor_name" placeholder="Name" required className="bg-white/5 border-white/10 text-white placeholder:text-slate-400" />
            <Input name="phone" placeholder="Phone" className="bg-white/5 border-white/10 text-white placeholder:text-slate-400" />
            <Input name="email" type="email" placeholder="Email" className="bg-white/5 border-white/10 text-white placeholder:text-slate-400" />
            <Input name="visitor_company" placeholder="Company" className="bg-white/5 border-white/10 text-white placeholder:text-slate-400" />
            <Input name="message" placeholder="Message" className="bg-white/5 border-white/10 text-white placeholder:text-slate-400" />
            <Button disabled={leadSent}>{leadSent ? "Sent ✓" : "Send Inquiry"}</Button>
          </form>

          <footer className="pb-4 text-center text-xs" style={{ color: "#87929a" }}>
            {employee.address ? <span className="inline-flex items-center gap-1 mb-1"><MapPin size={12} /> {employee.address}</span> : null}
            <p>Powered by CardFlow AI</p>
          </footer>
        </main>

        {/* Sticky bottom capsule */}
        <aside className="fixed bottom-3 inset-x-0 mx-auto w-[calc(100%-2.5rem)] max-w-[400px] z-50">
          <div className="flex items-center gap-2 rounded-full border border-white/10 p-2 shadow-2xl backdrop-blur-xl" style={{ background: "rgba(21,27,43,0.9)" }}>
            <button onClick={saveContact} className="flex-1 h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2" style={{ background: `linear-gradient(to right, ${accent}, #7bd0ff)`, color: "#00354a" }}>
              <Download size={18} /> Save
            </button>
            <button onClick={() => setQrOpen(true)} aria-label="QR" className="w-11 h-11 rounded-full grid place-items-center border border-white/10 bg-white/5">
              <QrCode size={20} />
            </button>
            <button onClick={share} aria-label="Share" className="w-11 h-11 rounded-full grid place-items-center border border-white/10 bg-white/5">
              <Share2 size={20} />
            </button>
          </div>
        </aside>
      </div>

      {/* QR modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-6" onClick={() => setQrOpen(false)}>
          <div className="rounded-2xl p-5 w-full max-w-[320px] text-center relative" style={{ background: "#191f2f" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQrOpen(false)} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full grid place-items-center bg-white/10">
              <X size={16} />
            </button>
            <p className="text-sm font-bold mb-1">{name}</p>
            <p className="text-xs mb-4" style={{ color: "#bdc8d1" }}>Scan to open card</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="QR code enlarged" className="w-[220px] h-[220px] mx-auto rounded-xl bg-white p-2" />
            <button onClick={share} className="mt-4 w-full h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2" style={{ background: `linear-gradient(to right, ${accent}, #7bd0ff)`, color: "#00354a" }}>
              <Share2 size={18} /> Share card
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-[70] border px-4 py-2 rounded-full text-xs font-semibold shadow-2xl transition-all duration-200 flex items-center gap-1.5 ${
          toast ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "#2f3445", borderColor: "rgba(142,213,255,0.4)" }}
      >
        <Check size={16} color="#8ed5ff" />
        <span>{toast ?? "Copied"}</span>
      </div>
    </div>
  );
}
