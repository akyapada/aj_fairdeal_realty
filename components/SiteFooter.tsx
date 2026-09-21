import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs" style={{ color: "var(--ink-3)" }}>
        <span>© {new Date().getFullYear()} Homy Realty · Hyderabad</span>
        <div className="flex items-center gap-4">
          <Link href="/about" style={{ color: "var(--ink-2)" }}>
            About Us
          </Link>
          <Link href="/privacy" style={{ color: "var(--ink-2)" }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
