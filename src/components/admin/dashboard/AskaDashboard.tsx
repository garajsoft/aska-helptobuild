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

// A tiny hand-rolled sparkline. Original SVG, no library, no branded palette.
function TrafficChart() {
  const points = [
    12, 18, 15, 22, 26, 24, 30, 28, 34, 41, 38, 45, 52, 48, 55, 60, 58, 66, 72, 70, 78, 84, 80, 88, 96, 92, 101, 108,
  ];
  const w = 640;
  const h = 180;
  const pad = 28;
  const maxY = Math.max(...points) * 1.15;
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
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="180" role="img" aria-label="Site traffic (placeholder)">
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
  const formStats = enabled.has("form_submissions") ? await loadFormStats() : null;

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
          <Widget title="Site traffic" hint="last 28 days (demo data)">
            <TrafficChart />
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
          <Widget title="Conversions" value="—" hint="wire to Stripe / analytics" />
        )}
        {enabled.has("comments") && (
          <Widget title="Comments" value="—" hint="no comments collection yet" />
        )}
      </div>
    </section>
  );
};

export default AskaDashboard;
