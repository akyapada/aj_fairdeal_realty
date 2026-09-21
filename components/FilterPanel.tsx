"use client";

import { useState } from "react";
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

function FilterSection({
  label,
  count,
  defaultOpen,
  children,
}: {
  label: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b py-3 first:pt-0 last:border-b-0" style={{ borderColor: "var(--line)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          {label}
          {count > 0 && (
            <span
              className="tabular rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {count}
            </span>
          )}
        </span>
        <span
          className="text-sm transition-transform"
          style={{ color: "var(--ink-3)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>
      {open && <div className="mt-2.5 flex flex-wrap gap-1.5">{children}</div>}
    </div>
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

  const hasActiveFilters =
    filters.locality.length > 0 ||
    filters.bhk.length > 0 ||
    filters.budget.value !== "0" ||
    filters.propertyType.length > 0 ||
    filters.constructionStatus.length > 0 ||
    filters.kind.length > 0;

  return (
    <aside
      className="flex flex-col rounded-[var(--radius)] border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--line)" }}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
          Filters
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            Clear all
          </button>
        )}
      </div>

      <FilterSection label="Bedrooms" count={filters.bhk.length} defaultOpen={true}>
        {BHK_OPTIONS.map((n) => (
          <Chip
            key={n}
            active={filters.bhk.includes(n)}
            onClick={() => toggleInList("bhk", filters.bhk.map(String), String(n))}
          >
            {n} BHK
          </Chip>
        ))}
      </FilterSection>

      <div className="border-b py-3" style={{ borderColor: "var(--line)" }}>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Budget
        </span>
        <select
          value={filters.budget.value}
          onChange={(e) => setBudget(e.target.value)}
          className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
          style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)" }}
        >
          {BUDGET_BUCKETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <FilterSection label="Locality" count={filters.locality.length} defaultOpen={false}>
        {localities.map((loc) => (
          <Chip
            key={loc.slug}
            active={filters.locality.includes(loc.slug)}
            onClick={() => toggleInList("loc", filters.locality, loc.slug)}
          >
            {loc.name}
          </Chip>
        ))}
      </FilterSection>

      <FilterSection label="Property type" count={filters.propertyType.length} defaultOpen={false}>
        {PROPERTY_TYPE_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={filters.propertyType.includes(opt.value)}
            onClick={() => toggleInList("type", filters.propertyType, opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </FilterSection>

      <FilterSection label="Status" count={filters.constructionStatus.length} defaultOpen={false}>
        {CONSTRUCTION_STATUS_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={filters.constructionStatus.includes(opt.value)}
            onClick={() => toggleInList("status", filters.constructionStatus, opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </FilterSection>

      <FilterSection label="Sale type" count={filters.kind.length} defaultOpen={false}>
        {KIND_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={filters.kind.includes(opt.value)}
            onClick={() => toggleInList("kind", filters.kind, opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </FilterSection>
    </aside>
  );
}
