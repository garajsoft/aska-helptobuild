import { AskaMark } from "./AskaMark";

export const Logo = () => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 4px",
      color: "var(--theme-elevation-1000)",
    }}
  >
    <AskaMark height={28} />
  </div>
);

// The step-nav's home slot (top-left of every admin view) is icon-sized by
// default - swap in the word itself so it reads as a real "back to
// dashboard" link instead of an unlabeled glyph.
export const Icon = () => <span style={{ fontWeight: 600 }}>Dashboard</span>;

export default Logo;
