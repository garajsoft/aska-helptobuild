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

export default Logo;
