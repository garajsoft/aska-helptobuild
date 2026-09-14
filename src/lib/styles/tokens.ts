/**
 * Turns `styles` collection docs into CSS custom properties.
 *
 * Naming convention:
 *   Color / Spacing / Border Radius & Shadow → single value, var is `--{slug}`
 *     e.g. slug "color-primary"        → --color-primary: #1a1a1a;
 *   Typography Scale → one var per set property, `--{property}-{slug}`
 *     e.g. slug "display-lg", fontSize → --font-size-display-lg: 3.75rem;
 */

export interface StyleDoc {
  slug: string;
  category: string;
  colorValue?: string | null;
  fontFamily?: string | null;
  fontSize?: string | null;
  fontWeight?: string | null;
  lineHeight?: string | null;
  letterSpacing?: string | null;
  spacingValue?: string | null;
  radiusShadowValue?: string | null;
}

function tokenLines(doc: StyleDoc): string[] {
  if (!doc.slug) return [];
  switch (doc.category) {
    case "Color":
      return doc.colorValue ? [`--${doc.slug}: ${doc.colorValue};`] : [];
    case "Spacing / Container":
      return doc.spacingValue ? [`--${doc.slug}: ${doc.spacingValue};`] : [];
    case "Border Radius & Shadow":
      return doc.radiusShadowValue ? [`--${doc.slug}: ${doc.radiusShadowValue};`] : [];
    case "Typography Scale": {
      const lines: string[] = [];
      if (doc.fontFamily) lines.push(`--font-family-${doc.slug}: ${doc.fontFamily};`);
      if (doc.fontSize) lines.push(`--font-size-${doc.slug}: ${doc.fontSize};`);
      if (doc.fontWeight) lines.push(`--font-weight-${doc.slug}: ${doc.fontWeight};`);
      if (doc.lineHeight) lines.push(`--line-height-${doc.slug}: ${doc.lineHeight};`);
      if (doc.letterSpacing)
        lines.push(`--letter-spacing-${doc.slug}: ${doc.letterSpacing};`);
      return lines;
    }
    default:
      return [];
  }
}

export function buildStyleTokensCss(docs: StyleDoc[]): string {
  const lines = docs.flatMap(tokenLines);
  return lines.length ? `:root {\n  ${lines.join("\n  ")}\n}\n` : "";
}

// Self-check
if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildStyleTokensCss([
    { slug: "color-primary", category: "Color", colorValue: "#1a1a1a" },
    { slug: "spacing-container-max", category: "Spacing / Container", spacingValue: "1280px" },
    {
      slug: "h1",
      category: "Typography Scale",
      fontFamily: "Inter",
      fontSize: "3.75rem",
      fontWeight: "700",
    },
    { slug: "no-value", category: "Color", colorValue: null },
  ]);
  const expected =
    ":root {\n" +
    "  --color-primary: #1a1a1a;\n" +
    "  --spacing-container-max: 1280px;\n" +
    "  --font-family-h1: Inter;\n" +
    "  --font-size-h1: 3.75rem;\n" +
    "  --font-weight-h1: 700;\n" +
    "}\n";
  if (out !== expected) {
    console.error("FAIL");
    console.error("got:  ", JSON.stringify(out));
    console.error("want: ", JSON.stringify(expected));
    process.exit(1);
  }
  console.log("ok");
}
