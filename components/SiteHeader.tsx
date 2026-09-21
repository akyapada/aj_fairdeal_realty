import Link from "next/link";
import { ArrowLeft, Building2, MapPin } from "lucide-react";

// Shared top bar for every public page. Two modes:
// - Home (no props): full logo mark + wordmark + locality nav.
// - Everywhere else: a compact "back" link, so the logo doesn't compete
//   with each page's own H1 (project name, locality name, etc.).
export default function SiteHeader({
  backHref,
  backLabel,
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="border-b" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
      <div className="mx-auto max-w-6xl px-5 py-4">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--accent)" }}
              >
                <Building2 size={20} color="var(--accent-ink)" strokeWidth={2.25} />
              </span>
              <span>
                <span
                  className="block text-lg font-extrabold leading-tight"
                  style={{ color: "var(--ink)", fontFamily: "var(--font-bricolage)" }}
                >
                  AJ FairDeal Realty
                </span>
                <span className="block text-xs leading-tight" style={{ color: "var(--ink-3)" }}>
                  Hyderabad
                </span>
              </span>
            </Link>
            <Link
              href="/localities"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              <MapPin size={16} />
              <span className="hidden sm:inline">Browse by locality</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
