"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BHK_OPTIONS,
  BUDGET_BUCKETS,
  CONSTRUCTION_STATUS_OPTIONS,
  KIND_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  parseFilters,
} from "@/lib/filters";

interface Locality {
  id: number;
  name: string;
  slug: string;
}

const chipBase =
  "rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer select-none";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={chipBase}
      style={
        active
          ? {
              background: "var(--accent)",
              borderColor: "var(--accent)",
              color: "var(--accent-ink)",
            }
          : {
              background: "var(--surface)",
              borderColor: "var(--line)",
              color: "var(--ink-2)",
            }
      }
    >
      {children}
    </button>
  );
}

export default function FilterPanel({ localities }: { localities: Locality[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseFilters(Object.fromEntries(searchParams.entries()));

  function updateParam(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (values.length === 0) {
      params.delete(key);
    } else {
      params.set(key, values.join(","));
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleInList(key: string, current: string[], value: string) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParam(key, next);
  }

  function setBudget(value: string) {
    updateParam("budget", value === "0" ? [] : [value]);
  }

  function clearAll() {
    router.push(pathname, { scroll: false });
  }

  return (
    <aside
      className="flex flex-col gap-5 rounded-[var(--radius)] border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--line)" }}
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Locality
        </span>
        <div className="flex flex-wrap gap-1.5">
          {localities.map((loc) => (
            <Chip
              key={loc.slug}
              active={filters.locality.includes(loc.slug)}
              onClick={() => toggleInList("loc", filters.locality, loc.slug)}
            >
              {loc.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Bedrooms
        </span>
        <div className="flex flex-wrap gap-1.5">
          {BHK_OPTIONS.map((n) => (
            <Chip
              key={n}
              active={filters.bhk.includes(n)}
              onClick={() => toggleInList("bhk", filters.bhk.map(String), String(n))}
            >
              {n} BHK
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Budget
        </span>
        <select
          value={filters.budget.value}
          onChange={(e) => setBudget(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
          style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)" }}
        >
          {BUDGET_BUCKETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Property type
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={filters.propertyType.includes(opt.value)}
              onClick={() => toggleInList("type", filters.propertyType, opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Status
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CONSTRUCTION_STATUS_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={filters.constructionStatus.includes(opt.value)}
              onClick={() => toggleInList("status", filters.constructionStatus, opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Sale type
        </span>
        <div className="flex flex-wrap gap-1.5">
          {KIND_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={filters.kind.includes(opt.value)}
              onClick={() => toggleInList("kind", filters.kind, opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={clearAll}
        className="w-full rounded-md border py-2 text-sm font-medium"
        style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}
      >
        Clear all filters
      </button>
    </aside>
  );
}
