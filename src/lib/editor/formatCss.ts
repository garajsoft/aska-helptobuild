import { css as cssBeautify } from "js-beautify";

/** Pretty-prints GrapesJS's minified `editor.getCss()` output so it stays
 * readable in the saved page.css and Payload's preview. */
export function formatGrapesCss(rawCss: string): string {
  return cssBeautify(rawCss, {
    indent_size: 2,
    space_around_combinator: true,
    newline_between_rules: true,
  });
}
