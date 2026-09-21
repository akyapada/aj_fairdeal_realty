import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, MessageCircle, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "About Us",
  description: "Why Homy Realty exists, and how we're different from the big property portals.",
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Honest, not exhaustive",
    body: "We'd rather show you fewer properties we actually stand behind than pad a listings page to look bigger than we are. Every project on this site has real RERA details, real pricing, no invented urgency.",
  },
  {
    icon: MessageCircle,
    title: "You talk to us, not a call centre",
    body: "No lead gets sold to five different agents who all call you the same afternoon. When you reach out, you're talking directly to the people who actually run this site.",
  },
  {
    icon: Handshake,
    title: "We listen before we sell",
    body: "Tell us what you're actually looking for — budget, locality, commute, what matters to you — and we'll match you against it, instead of pushing whatever's paying us the most that month.",
  },
];

export default function AboutPage() {
  const whatsAppLink = buildWhatsAppLink("Hi, I'd like to know more about Homy Realty.");

  return (
    <div className="flex-1" style={{ background: "var(--paper)" }}>
      <SiteHeader backHref="/" backLabel="All properties" />

      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
          About Homy Realty
        </h1>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
          We&apos;re a small, Hyderabad-focused real estate consultancy. We&apos;re not trying to
          out-list 99acres or MagicBricks — we never will, and that&apos;s not the point. Instead,
          we focus on the handful of new-launch and resale apartments and villas we actually know
          well, and on understanding what a buyer needs well enough to point them at the right one
          the first time, not the fifth.
        </p>

        <div className="mt-8 flex flex-col gap-5">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-3 rounded-[var(--radius)] border p-4"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--accent-soft)" }}
              >
                <Icon size={18} color="var(--accent)" />
              </span>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
          If that sounds like the kind of place you&apos;d rather buy through, have a look at{" "}
          <Link href="/" className="underline" style={{ color: "var(--accent)" }}>
            what we currently have listed
          </Link>
          , or just say hello.
        </p>

        {whatsAppLink && (
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold text-white"
            style={{ background: "#128C7E" }}
          >
            <MessageCircle size={16} />
            Say hello on WhatsApp
          </a>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
