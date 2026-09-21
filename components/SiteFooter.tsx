import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs" style={{ color: "var(--ink-3)" }}>
        <span>© {new Date().getFullYear()} AJ FairDeal Realty · Hyderabad</span>
        <Link href="/privacy" style={{ color: "var(--ink-2)" }}>
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
