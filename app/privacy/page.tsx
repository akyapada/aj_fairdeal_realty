import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What AJ FairDeal Realty collects, why, and how you can access, correct, or delete it.",
};

const LAST_UPDATED = "22 September 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  const whatsAppLink = buildWhatsAppLink(
    "Hi, I have a question about my data on AJ FairDeal Realty."
  );

  return (
    <div className="flex-1" style={{ background: "var(--paper)" }}>
      <SiteHeader backHref="/" backLabel="All properties" />

      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
          Privacy Policy
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-3)" }}>
          Last updated {LAST_UPDATED}
        </p>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
          AJ FairDeal Realty is a real estate consultancy based in Hyderabad. This page explains,
          in plain language, what information we collect through this website, why, and what
          rights you have over it under India&apos;s Digital Personal Data Protection Act, 2023.
        </p>

        <Section title="What we collect, and when">
          <p>
            <strong style={{ color: "var(--ink)" }}>Just browsing:</strong> when you look at
            listings or projects, we record an anonymous session — which pages you viewed and
            how long you spent — tied to a random ID stored in your browser, not to your name or
            phone number. We don&apos;t know who you are at this point.
          </p>
          <p>
            <strong style={{ color: "var(--ink)" }}>When you submit an enquiry:</strong> your
            name, phone number, and (if you give it) email, along with whatever you tell us about
            what you&apos;re looking for — budget, bedrooms, preferred localities, purpose
            (living in it vs. investment), where you work, and any notes. The moment you do this,
            we link it to your earlier anonymous browsing from the same device, so we can see
            your whole journey, not just this one form.
          </p>
          <p>
            <strong style={{ color: "var(--ink)" }}>Automatically, via analytics tools:</strong>{" "}
            we use PostHog, Microsoft Clarity, and Google Analytics to understand how people use
            this site — pages visited, general device/browser information, and (Clarity
            specifically) anonymized recordings of on-page interactions like scrolling and
            clicks, to help us fix confusing parts of the site. These tools set their own cookies
            and are governed by their own privacy policies.
          </p>
        </Section>

        <Section title="Why we collect it">
          <p>
            To respond to your enquiry, to match you with properties that actually fit what
            you&apos;ve told us you want, and to understand our visitors well enough to keep
            improving the site. That&apos;s the whole reason — we&apos;re a small, local
            business, not a data company.
          </p>
        </Section>

        <Section title="Who sees it">
          <p>
            Your enquiry details (name, phone, requirements) are seen only by our own staff —
            never sold, rented, or shared with other agents, brokers, or marketers. The only
            outside parties involved are the analytics tools named above, which receive anonymous
            usage data, and Supabase (our database provider) and Cloudflare (our hosting
            provider), which store the data on our behalf under their own security and privacy
            commitments.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under the DPDP Act, you can ask us to show you what we have on file, correct it if
            it&apos;s wrong, or delete it. You can also withdraw your consent to be contacted at
            any time — we&apos;ll stop reaching out, and mark your record for deletion.
          </p>
          <p>
            To do any of this, message us on WhatsApp using the button below. We&apos;ll act on
            it as soon as we can.
          </p>
          {whatsAppLink && (
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white"
              style={{ background: "#128C7E" }}
            >
              Message us on WhatsApp
            </a>
          )}
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your enquiry on file for as long as it&apos;s useful to you — so we can let
            you know when something matching your requirements comes up — unless you ask us to
            delete it sooner, in which case we mark it deleted and stop using it.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If this policy changes in any meaningful way, we&apos;ll update the date at the top
            of this page.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
