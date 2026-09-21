# Hyderabad Real Estate Platform

Claude Code reads this file automatically at the start of every session.
Keep the **Current status** section at the bottom updated as work completes.

---

## What this is

A real estate consultancy website for Hyderabad. Two audiences:

1. **Buyers** — browse projects, see honest information, submit requirements.
   No login required, ever.
2. **Us (admin/agents)** — see who is visiting, what they looked at, what they
   want, and who to call first.

The differentiator is **honest, well-structured information** and
**understanding buyer requirements better than the portals do** — not having
more listings than 99acres. We will never win on volume.

---

## Who you are working with

The operator is **not a professional developer**. They know basic SQL and some
frontend concepts, enough to read code and spot when something looks wrong,
but not enough to debug a stack trace alone.

This changes how you should work:

- **Explain before doing** anything structural. One or two sentences, plain
  language, no jargon.
- **Never leave a broken state.** If a change spans several files, finish it.
- **Prefer boring, mainstream, well-documented choices.** Every clever
  dependency is a future debugging session they cannot do without help.
- When something fails, **say what failed and what you are doing about it**
  rather than silently trying another approach.
- **Do not add dependencies** without saying why in one line.

---

## Constraints

- Budget: ₹50k–1L total for 6 months. Effectively zero ad budget.
- Acquisition is SEO + content + video walkthroughs + existing network.
- Solo operator plus 1–2 agents.
- **Everything must run on free tiers.** If a change would require a paid
  service, stop and say so before writing the code.

---

## Scope: model everything, build a slice

`schema.sql` models the full business: apartments, villas, plots, commercial,
new launch, resale, rentals.

**The website v1 surfaces only:** new-launch and resale **apartments and
villas**, **for sale**.

Commercial, plots and rentals stay in the database, hidden from the UI, until
the sale flow works end to end. Do not build UI for them yet — schemas are
painful to change later, pages are trivial.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server-rendered; SEO is the whole strategy |
| Database/Auth | Supabase (free tier) | Postgres. Schema in `schema.sql` |
| Hosting | **Cloudflare Pages** (free) | **Not Vercel** — its Hobby plan is non-commercial personal use only, and this site is commercial. Vercel Pro is $20/mo, avoidable. Cloudflare Pages free permits commercial use and gives free DNS. |
| Styling | Tailwind CSS | Design tokens already in `app/globals.css` |
| Analytics | PostHog (free) + Microsoft Clarity + GA4 | Add at step 9, not before |
| Images | Cloudinary free tier | |
| Maps | Maps Embed API only | Unlimited free. **Never** use billable Maps SKUs — they have no hard billing cap |
| WhatsApp | `wa.me` click-to-chat links | **No** Business API. Per-message costs are not affordable yet |
| Admin | `/admin` leads dashboard (Supabase Auth) + Supabase table editor for everything else | See "Staff leads dashboard" below — scope is leads only, deliberately |

### Explicitly NOT in v1
- Buyer logins (kills SEO and conversion when nobody knows the brand — this
  is about buyers; staff have their own separate `/admin` login, see below)
- SMS OTP / DLT registration
- WhatsApp Business API
- **A full admin CRM/CMS** — project and listing management still goes
  through Supabase Table Editor. A *leads-only* dashboard was built (see
  below); this line is about not going further than that.
- Any ML or recommendation engine
- Native mobile apps

### Staff leads dashboard (`/admin`)

Added after v1 planning, once real use surfaced a genuine gap: raw Table
Editor was too technical for the field team's daily use. `property-console.html`
already had the design for this — a fourth "Admin › Leads" screen — but its
own inline note said not to build it in v1, since the `lead_scores` view
gives most of the value for free. It's now built for real, deliberately
scoped to **leads only**:

- `middleware.ts` + `lib/supabase-browser.ts` + `lib/supabase-server.ts` —
  Supabase Auth session handling (via `@supabase/ssr`), scoped to
  `/admin/*` only so public pages pay zero cost.
- `app/admin/login/page.tsx` — email+password sign-in. **No self-serve
  signup** — staff accounts are provisioned manually (Supabase Dashboard →
  Authentication → Users → Add user, then one SQL insert into `profiles`;
  see the schema's own notes at the bottom of `schema.sql`).
- `app/admin/(protected)/page.tsx` — KPI tiles + the full leads table
  sorted by score (`lead_scores` view), matching the prototype's exact
  columns.
- `app/admin/(protected)/leads/[id]/page.tsx` — latest requirement,
  engagement, activity timeline, and **one combined form** to log an
  activity and optionally change status in the same action (this used to
  be two separate controls — a status dropdown that auto-saved on every
  click, which was genuinely bad: easy to misclick and silently commit a
  real status change plus a fake audit-log entry. Fixed by merging into
  one explicit-submit form).
- **RLS already scopes all of this correctly** — a non-admin agent only
  ever sees their own leads (`staff read own leads` policy); admins see
  everything. The dashboard's queries go through the real `leads` table
  first (guaranteed-correct RLS) and only enrich those already-authorized
  rows with scores/requirements, rather than trusting the `lead_scores`
  view's own RLS behavior — defense in depth, since view RLS semantics in
  Postgres have real sharp edges worth not relying on blindly.
- `listing_views` (page-view engagement) is admin-only by existing RLS
  (`admins read views` policy) — a regular agent will correctly see 0
  views on every lead detail page. That's not a bug.
- Projects, listings, builders, media: still Table Editor only. Not in
  scope here.

---

## Design

`property-console.html` in the project root is a working prototype of all four
screens, with every element labelled with its database column. **Port its
visual design** — colors, type scale, spacing, component shapes — into the
Next.js app. It is the design reference, not throwaway.

Design tokens are already extracted into `app/globals.css`.

---

## Database

Full schema: `schema.sql`. Seed data: `seed-localities.sql`.

Key conventions — these are not negotiable:

- **`listings` is the searchable unit.** Everything a buyer can enquire about
  is a row here. New-launch configs, resale units and rentals all live in this
  one table, discriminated by `kind`. Search stays one indexed query.
- **`lead_requirements` is append-only.** Never UPDATE a requirement — INSERT
  a new row. The history of how a buyer's brief changes is the dataset that
  makes prediction possible later. This is the single most important
  convention in the project.
- **`listing_views` records anonymous sessions.** When someone submits their
  phone number, `submit_enquiry()` backfills `lead_id` across their whole
  session history. Do not break this.
- **Enums, not free text**, for anything filterable.
- **`workplace_locality_id`** on requirements is Hyderabad-specific and highly
  predictive of locality choice. Always ask for it in forms.

### Security — non-negotiable

- RLS is ON for every table.
- `leads` has **no** public read policy. The only public write path is the
  `submit_enquiry()` security-definer function. Never query `leads` from a
  client component.
- **Known gap in v1:** `listings.owner_name` / `owner_phone` / `owner_notes`
  are readable under the public listings policy. Move them to a separate
  `listing_owners` table before listing any real resale property.
- `internal_pros`, `internal_cons`, `internal_notes` and `owner_*` must
  **never** be selected in a public page query. Use explicit column lists,
  never `select *`, on the public site.
- Before launch, verify exactly two things:
  1. An unauthenticated request cannot read `leads`.
  2. Agent A cannot read Agent B's leads.

---

## Compliance

- **TG-RERA:** every project listing must display its RERA number prominently.
  Telangana enforces font size and clarity standards on advertisements, and has
  issued show-cause notices over non-compliant ads. A project must not be
  publishable without `rera_number` set.
- **DPDP:** consent checkbox at every capture point, recorded in
  `leads.consent_given` / `consent_at` / `consent_text` — the exact wording,
  not just a boolean. Privacy policy page. Deletion via `is_deleted` soft delete.

---

## Registrations and sequencing

Nothing below blocks building. They block *publishing*.

| When | What | Cost |
|---|---|---|
| Week 1 | Buy domain (before any SEO content, not before code) | ~₹1,200/yr |
| Week 1 | File TG-RERA agent application — takes weeks, run in parallel | ₹10,000 |
| Week 1 | Supabase account, run `schema.sql` + `seed-localities.sql` | free |
| Weeks 1–3 | Build; deploy to `*.pages.dev` when useful | free |
| Before launch | RERA number on every listing + privacy policy + consent | free |

- **Do not** register a company — RERA agent fee is ₹10,000 as an individual
  vs ₹50,000 as an entity.
- **Do not** publish SEO content on the free subdomain. Search authority
  attaches to the domain; migrating later throws it away.
- A free `*.pages.dev` URL does not change RERA exposure.

---

## Build order

1. ~~Schema designed~~ — `schema.sql`
2. ~~UI prototype with schema mapping~~ — `property-console.html`
3. Supabase project + run schema + seed localities
4. Next.js skeleton, connected to Supabase, one page rendering real data
5. Project listing page with filters (locality, budget, BHK, status)
6. Individual project page — RERA number, photos, pros/cons, config table
7. Requirement capture form → `submit_enquiry()`
8. View tracking → `record_listing_view()`
9. WhatsApp click-to-chat, pre-filled with project name
10. PostHog + Clarity + GA4
11. Locality landing pages (`/localities/kokapet`) — the SEO engine
12. Deploy, domain, sitemap, robots.txt, JSON-LD structured data

**Target: live in 3–4 weeks.** Ship ugly. The remaining time goes into content
and talking to buyers, not polish.

---

## Conventions

- Money in INR as `numeric`. Display as lakhs/crores (`₹1.24 Cr`, `₹92 L`).
- Areas in **sqft**, except plots which are **sq yards** (Hyderabad norm).
- Every public page needs a unique `<title>` and meta description.
- URLs are slug-based and permanent: `/projects/aranya-skyline`,
  `/localities/kokapet`. **Never change a live slug** — it breaks SEO.
- Server components for anything public (SEO). Client components only where
  interactivity genuinely requires it.

---

## Current status

- [x] Schema designed
- [x] UI prototype built
- [x] Supabase project created, schema run
- [x] Localities seeded
- [x] Next.js skeleton connected to Supabase (App Router + TS + Tailwind v4,
      scaffolded via `create-next-app` and merged into this folder)
- [x] First page rendering real data — homepage (`app/page.tsx`) queries
      `listings` joined to `projects` (RLS-filtered to published/active,
      apartments & villas, for sale only) and renders cards with price
      (lakhs/crore formatting), BHK, area and RERA number, styled with the
      ported design tokens (`app/globals.css`) and Google fonts via
      `next/font`. Verified against live Supabase data in the browser.
- [x] Project listing page with filters — locality, bedrooms, budget,
      property type, construction status, sale type (step 5). Filters live
      in the URL (`?loc=&bhk=&budget=&type=&status=&kind=`) via
      `components/FilterPanel.tsx` (client) and are parsed/applied
      server-side in `app/page.tsx` + `lib/filters.ts`. Verified in-browser:
      multi-select chips OR together correctly, empty state shows a
      filtered-specific message, "Clear all filters" resets the URL.
- [x] Individual project page (step 6) — `app/projects/[slug]/page.tsx`.
      Shows locality/builder byline, hero photo (falls back to the same
      gradient placeholder as listing cards when no `media` row exists),
      a prominent TG-RERA bar (number + validity, or a "registration
      pending" warning), a spec grid (status/possession/towers/units/land
      area/open space), the config table (one row per active listing:
      area, facing, price, units available or floor), and amenities chips.
      Deliberately does **not** show `internal_pros`/`internal_cons` or
      owner fields — the build-order label says "pros/cons" but the
      Security section is explicit that those columns must never reach a
      public page, and that's the rule that wins. Listing cards on the
      homepage now link to their project page. Verified in-browser against
      the live test row, including the null-field fallbacks.
- [x] Requirement capture form → `submit_enquiry()` (step 7).
      `components/EnquiryForm.tsx` on the project page sidebar captures
      name, phone (required), email, which configuration, bedrooms wanted,
      budget bucket, other localities considered, workplace locality,
      purpose, notes, and DPDP consent (exact wording stored via
      `consent_text`). Extended `submit_enquiry()` in `schema.sql` to accept
      `p_workplace_locality_id` — the function didn't expose it even though
      `lead_requirements.workplace_locality_id` already existed and
      CLAUDE.md calls it out as always-ask. **You ran the updated function
      in the Supabase SQL editor this session** (`create or replace
      function submit_enquiry(...)`) — verified end-to-end with a real
      submission in the browser (got the "we've got your details" success
      state, no RPC error).
- [x] View tracking → `record_listing_view()` (step 8).
      `components/ViewTracker.tsx` on the project page records a
      `listing_views` row (session id, `project_id`, seconds on page) on
      tab-hide, real unload, and client-side route change away — App
      Router swaps content without unloading the document, so unload
      events alone would miss almost every real navigation.
      Caught and fixed a real bug while verifying this: `supabase.rpc(...)`
      returns a lazy thenable that only actually sends the request once you
      call `.then()`/`await` it — the first version used `void supabase.rpc(...)`,
      which built the request but never fired it. Fixed by chaining
      `.then()`. Verified the fix by calling the RPC directly via `fetch`
      (204 success) and, separately, by checking `performance.getEntriesByType`
      in the live page after a real navigation — confirmed the request goes
      out (the browser tool's network-request log doesn't appear to capture
      cross-origin `fetch` calls at all, so don't rely on it for verifying
      Supabase calls in future sessions).

- [x] WhatsApp click-to-chat (step 9). `lib/whatsapp.ts` builds a `wa.me`
      link with the message pre-filled with the project name and locality;
      rendered as a green "Ask on WhatsApp" button on the project page,
      right under the starting price. Reads `NEXT_PUBLIC_WHATSAPP_NUMBER`
      from env and renders nothing if it's unset, so a missing number never
      shows a dead button. The number is a dedicated second SIM on WhatsApp
      Business (not a VoIP number — those get flagged/banned by WhatsApp's
      anti-fraud checks, which is a bad risk for the number leads actually
      call), registered by the operator this session: `918897327276`.
- [x] PostHog + Clarity + GA4 (step 10). `components/Analytics.tsx`,
      mounted once in the root layout, loads all three — each reads its
      own env var and simply doesn't load if that var is blank, so any
      subset can be wired in independently. GA4 and Clarity load via
      `next/script` (no npm dependency needed — both are just tracking
      snippets). PostHog needed one dependency, `posthog-js` — the
      official client SDK; there's no way to call PostHog's ingestion API
      without it. All three fire a manual pageview/event on every route
      change, since Next's App Router swaps pages without a full document
      reload and none of these trackers see that for free. Verified live in
      the browser via `performance.getEntriesByType` (not the browser
      tool's network-request log, which still doesn't seem to catch these):
      confirmed `gtag/js`, PostHog's `/e/` event endpoint, and Clarity's
      `collect` endpoint all fired. Accounts, in case they're needed again:
      PostHog project key `phc_rnQu...` (US Cloud), Clarity project
      `ylpkmbczhy`, GA4 property `G-KBZ0JBG3RL`.
- [x] Locality landing pages (step 11) — the SEO engine.
      `app/localities/[slug]/page.tsx` shows the locality name/zone, its
      `description` (your own SEO copy — currently null for all 54 seeded
      localities, so the intro paragraph just doesn't render until you
      write one; the listing grid below it works regardless), and every
      active sale listing (apartments/villas) in that locality, each with
      its own unique `<title>`/meta description. Added `app/localities/page.tsx`,
      an index grouped by zone, linking to every locality page — without it
      the locality pages would have no internal links pointing to them,
      which defeats the point before step 12's sitemap even exists. Added a
      "Browse by locality" link on the homepage header so the index itself
      is reachable. Extracted the listing-card JSX (duplicated between the
      homepage and this) into `components/ListingCard.tsx` and shared
      query-result types into `lib/types.ts`. Verified in-browser: index
      page groups correctly by zone, Gachibowli shows the one real listing
      with the right SEO title, Kokapet (no listings) shows the empty
      state, and an invalid slug 404s properly.
- [~] Step 12 (deploy, domain, sitemap, robots.txt, JSON-LD) — **partially
      done**. Domain bought: **homyrealty.com** (via Cloudflare Registrar).
      Code pushed to GitHub (`akyapada/aj_fairdeal_realty`). Deployment
      tooling set up: `@cloudflare/next-on-pages` doesn't support Next.js
      16 yet, so this uses **Cloudflare Workers via the OpenNext adapter**
      instead (`@opennextjs/cloudflare`, `wrangler.jsonc`, `open-next.config.ts`,
      `npm run deploy`/`npm run preview` scripts) — same free tier, same
      reasons for picking Cloudflare over Vercel, just the current
      supported path rather than the older "Pages" adapter. Verified
      locally with `npm run preview` (real Workers runtime via `wrangler`,
      not just `next build`) — Supabase queries, the enquiry form, and
      the WhatsApp button all work correctly on it. **Not yet done:**
      actually connecting the GitHub repo to a Cloudflare Workers project
      in the dashboard, adding the env vars there, attaching the domain,
      and the sitemap/robots.txt/JSON-LD pieces.
- [x] **Staff leads dashboard** (`/admin`) — not in the original 12-step
      build order; added after the operator asked for something friendlier
      than raw Table Editor for the field team. See "Staff leads
      dashboard" under Stack above for the full writeup. Verified
      end-to-end in the browser with a real login: dashboard KPIs and
      leads table render correctly, lead detail page shows real
      requirement/engagement data, logging an activity works, and the
      combined activity+status form (fixed from an earlier auto-save
      dropdown that committed on every click — a real bug caught during
      testing) saves correctly on explicit submit.

### Notes for next session

- Next up: finish step 12 — connect the GitHub repo to a Cloudflare
  Workers project (dashboard → Workers & Pages → Create → Import a
  repository), set the deploy command to `npm run deploy`, add the env
  vars listed earlier in this file's history to the project's Settings →
  Variables and Secrets, deploy, then attach `homyrealty.com`. After that:
  sitemap.xml, robots.txt, JSON-LD structured data.
- One real staff admin account exists (created this session, linked to a
  `profiles` row with `role = 'admin'`) — that's how `/admin` was tested.
- All 54 seeded localities still have `description = null` — the locality
  pages work fine without it, but that column is the actual SEO
  content (one honest paragraph per area, per `seed-localities.sql`'s own
  comment) that these pages exist to rank on. Writing those is real content
  work, not a coding task, and it's the highest-leverage thing left before
  step 11 does anything for organic traffic.
- Analytics load unconditionally right now — no cookie/tracking consent
  banner gates PostHog, Clarity or GA4. DPDP's consent requirement is
  currently wired only for lead capture (`leads.consent_given`); whether
  analytics trackers also need their own consent gate before launch is
  worth a real legal read, not a guess — flagging it rather than deciding
  it here.
- `.env.local` is filled in with the real Supabase URL/anon key and
  WhatsApp number. RERA agent number env var is still blank — fill in
  `NEXT_PUBLIC_RERA_AGENT_NUMBER` in `.env.local` once known (never commit
  this file — it's gitignored).
- Only `localities` was seeded from `seed-localities.sql`. One test project
  ("Aranya Skyline", Gachibowli) and one test listing were inserted by hand
  via the Supabase SQL editor to verify rendering — real project/listing data
  still needs to be entered before this is useful content. With only one
  listing in the database, the filter UI has not been exercised against a
  realistic result set (multiple projects/localities/price points) — worth
  a pass once more data exists.
- Git repo initialized this session (`git init` + first commit). Continue
  committing at meaningful checkpoints.
- The enquiry form links to no privacy policy page yet (none exists). The
  consent checkbox text stands on its own for now — Compliance requires a
  privacy policy page before launch regardless; add it and link it from the
  form before going live.
- A real test enquiry was submitted through the form this session (name
  "Test Buyer", phone 9999999999) — there's a live row in `leads` /
  `lead_requirements` now. Fine to delete from the Supabase table editor
  once you're done testing.
- Run the app locally with `npm run dev`.

_Update this section at the end of every session._
