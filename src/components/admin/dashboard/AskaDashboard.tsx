import "server-only";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@/payload.config";

/**
 * Renders above Payload's default dashboard cards via admin.components.beforeDashboard.
 * Reads Settings.dashboard.widgets to decide which widget cards to show;
 * defaults to all enabled when unset.
 */

type WidgetKey = "site_traffic" | "form_submissions" | "conversions" | "comments";

const ALL_WIDGETS: WidgetKey[] = [
  "site_traffic",
  "form_submissions",
  "conversions",
  "comments",
];

async function loadEnabledWidgets(): Promise<Set<WidgetKey>> {
  try {
    const payload = await getPayload({ config });
    const s = await payload.findGlobal({ slug: "settings", depth: 0 });
    const raw = (s as { dashboard?: { widgets?: string[] | null } }).dashboard?.widgets;
    if (!raw || raw.length === 0) return new Set(ALL_WIDGETS);
    return new Set(raw.filter((k): k is WidgetKey => (ALL_WIDGETS as string[]).includes(k)));
  } catch {
    return new Set(ALL_WIDGETS);
  }
}

async function loadFormStats(): Promise<{ submissions: number; forms: number } | null> {
  try {
    const payload = await getPayload({ config });
    const [submissions, forms] = await Promise.all([
      payload.count({ collection: "form-submissions" }),
      payload.count({ collection: "forms" }),
    ]);
    return { submissions: submissions.totalDocs, forms: forms.totalDocs };
  } catch {
    return null;
  }
}

const TRAFFIC_DAYS = 28;

// One page-views count per day for the last TRAFFIC_DAYS days, oldest first.
async function loadTrafficSeries(): Promise<number[] | null> {
  try {
    const payload = await getPayload({ config });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await Promise.all(
      Array.from({ length: TRAFFIC_DAYS }, async (_, i) => {
        const dayStart = new Date(today);
        dayStart.setDate(dayStart.getDate() - (TRAFFIC_DAYS - 1 - i));
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const { totalDocs } = await payload.count({
          collection: "page-views",
          where: {
            createdAt: {
              greater_than_equal: dayStart.toISOString(),
              less_than: dayEnd.toISOString(),
            },
          },
        });
        return totalDocs;
      })
    );
  } catch {
    return null;
  }
}

// Distinct visitor count over the last TRAFFIC_DAYS days. No ORM-level
// distinct-count API, so this runs raw SQL against the same drizzle
// instance the onInit safety net already uses.
async function loadVisitorsTotal(): Promise<number | null> {
  try {
    const payload = await getPayload({ config });
    const drizzle = (
      payload.db as { drizzle?: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> } }
    ).drizzle;
    if (!drizzle) return null;
    const { sql } = await import("drizzle-orm");

    const windowStart = new Date();
    windowStart.setHours(0, 0, 0, 0);
    windowStart.setDate(windowStart.getDate() - (TRAFFIC_DAYS - 1));
    const result = await drizzle.execute(
      sql`SELECT COUNT(DISTINCT visitor_id) AS c FROM page_views WHERE created_at >= ${windowStart.toISOString()} AND visitor_id IS NOT NULL`
    );
    const c = result.rows?.[0]?.c;
    return typeof c === "string" ? parseInt(c, 10) : Number(c ?? 0);
  } catch {
    return null;
  }
}

type ConversionGoal = { label?: string | null; path?: string | null };
type ConversionsConfig = {
  formSubmissions?: boolean | null;
  sales?: boolean | null;
  goals?: ConversionGoal[] | null;
};

async function loadConversions(): Promise<{ total: number; sources: string[] } | null> {
  try {
    const payload = await getPayload({ config });
    const settings = await payload.findGlobal({ slug: "settings", depth: 0 });
    const conv = (settings as { conversions?: ConversionsConfig }).conversions;
    if (!conv) return { total: 0, sources: [] };

    let total = 0;
    const sources: string[] = [];

    if (conv.formSubmissions) {
      const { totalDocs } = await payload.count({ collection: "form-submissions" });
      total += totalDocs;
      sources.push("form submissions");
    }

    if (conv.sales) {
      const { totalDocs } = await payload.count({ collection: "orders" });
      total += totalDocs;
      sources.push("sales");
    }

    const goals = (conv.goals ?? []).filter((g): g is Required<ConversionGoal> => Boolean(g.path));
    if (goals.length > 0) {
      const goalCounts = await Promise.all(
        goals.map((g) => payload.count({ collection: "page-views", where: { path: { equals: g.path } } }))
      );
      total += goalCounts.reduce((sum, c) => sum + c.totalDocs, 0);
      sources.push(`${goals.length} custom goal${goals.length === 1 ? "" : "s"}`);
    }

    return { total, sources };
  } catch {
    return null;
  }
}

// A tiny hand-rolled sparkline. Original SVG, no library, no branded palette.
function TrafficChart({ points }: { points: number[] }) {
  const w = 640;
  const h = 180;
  const pad = 28;
  const maxY = Math.max(...points, 1) * 1.15;
  const dx = (w - pad * 2) / (points.length - 1);
  const y = (v: number) => h - pad - (v / maxY) * (h - pad * 2);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(pad + i * dx).toFixed(1)},${y(p).toFixed(1)}`)
    .join(" ");
  const area =
    `M${pad.toFixed(1)},${(h - pad).toFixed(1)} ` +
    points.map((p, i) => `L${(pad + i * dx).toFixed(1)},${y(p).toFixed(1)}`).join(" ") +
    ` L${(pad + (points.length - 1) * dx).toFixed(1)},${(h - pad).toFixed(1)} Z`;
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="180" role="img" aria-label="Page views, last 28 days">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const gy = pad + ((h - pad * 2) * i) / ticks;
        const val = Math.round(maxY - (maxY * i) / ticks);
        return (
          <g key={i}>
            <line x1={pad} y1={gy} x2={w - pad} y2={gy} stroke="currentColor" strokeOpacity={0.08} />
            <text x={4} y={gy + 3} fontSize="9" fill="currentColor" fillOpacity={0.5}>
              {val}
            </text>
          </g>
        );
      })}
      <path d={area} fill="var(--theme-success-500)" fillOpacity={0.12} />
      <path d={d} fill="none" stroke="var(--theme-success-500)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Widget({
  title,
  value,
  hint,
  children,
}: {
  title: string;
  value?: string | number;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="aska-widget">
      <div className="aska-widget__head">
        <span className="aska-widget__title">{title}</span>
        {hint && <span className="aska-widget__hint">{hint}</span>}
      </div>
      {typeof value !== "undefined" && <div className="aska-widget__value">{value}</div>}
      {children}
    </div>
  );
}

export const AskaDashboard = async () => {
  const enabled = await loadEnabledWidgets();
  const [formStats, trafficSeries, visitorsTotal, conversions] = await Promise.all([
    enabled.has("form_submissions") ? loadFormStats() : null,
    enabled.has("site_traffic") ? loadTrafficSeries() : null,
    enabled.has("site_traffic") ? loadVisitorsTotal() : null,
    enabled.has("conversions") ? loadConversions() : null,
  ]);

  return (
    <section className="aska-dashboard">
      <header className="aska-dashboard__header">
        <div>
          <div className="aska-dashboard__eyebrow">Dashboard</div>
          <h1 className="aska-dashboard__title">Overview</h1>
        </div>
        <Link href="/admin/globals/settings#dashboard" className="aska-dashboard__edit">
          Edit dashboard
        </Link>
      </header>

      <div className="aska-dashboard__grid">
        {enabled.has("site_traffic") && (
          <Widget title="Page views" hint={`last ${TRAFFIC_DAYS} days`}>
            <div className="aska-widget__stats">
              <div className="aska-widget__stat">
                <div className="aska-widget__value">
                  {trafficSeries ? trafficSeries.reduce((a, b) => a + b, 0) : "—"}
                </div>
                <div className="aska-widget__stat-label">Page views</div>
              </div>
              <div className="aska-widget__stat">
                <div className="aska-widget__value">{visitorsTotal ?? "—"}</div>
                <div className="aska-widget__stat-label">Visitors</div>
              </div>
            </div>
            <TrafficChart points={trafficSeries ?? Array(TRAFFIC_DAYS).fill(0)} />
          </Widget>
        )}
        {enabled.has("form_submissions") && (
          <Widget
            title="Form submissions"
            value={formStats?.submissions ?? "—"}
            hint={formStats ? `across ${formStats.forms} form${formStats.forms === 1 ? "" : "s"}` : "unavailable"}
          />
        )}
        {enabled.has("conversions") && (
          <Widget
            title="Conversions"
            value={conversions ? conversions.total : "—"}
            hint={
              conversions
                ? conversions.sources.length > 0
                  ? conversions.sources.join(", ")
                  : "none enabled — set up in Settings → Conversions"
                : "unavailable"
            }
          />
        )}
        {enabled.has("comments") && (
          <Widget title="Comments" value="—" hint="no comments collection yet" />
        )}
      </div>
    </section>
  );
};

export default AskaDashboard;
