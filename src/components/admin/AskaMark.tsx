// Aska logo — plain text logotype, set in Averta.
//
// Averta is a paid TypeType foundry font; we can't legally bundle the font
// files ourselves without a license. This references it by family name with
// a system-sans fallback stack, so it renders correctly the moment actual
// Averta @font-face files are added (e.g. via the Styles collection's
// custom-font-upload typography fields) and degrades gracefully until then.
const ASKA_FONT_STACK =
  '"Averta", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const AskaMark = ({
  height = 22,
  style,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { height?: number }) => (
  <span
    aria-label="aska"
    style={{
      fontFamily: ASKA_FONT_STACK,
      fontWeight: 700,
      fontSize: height,
      lineHeight: 1,
      letterSpacing: "-0.01em",
      color: "currentColor",
      ...style,
    }}
    {...rest}
  >
    aska
  </span>
);

export default AskaMark;
