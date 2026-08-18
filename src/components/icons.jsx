/* Inline SVGs.
 *
 * There is no SVG loader in this build (`vite-plugin-svgr` isn't installed), so
 * Garden's stroke icons are inlined here rather than imported from
 * `@zendeskgarden/svg-icons`. Same reasoning as transaction-log and
 * organization-hierarchy, which do the same thing for the same reason.
 *
 * All of these are `currentColor`, so they take the colour of whatever they sit
 * in — which is what lets the external-link glyph sit inside a blue link and the
 * kebab sit in a grey cell without either being told its colour twice.
 */

// Garden's `search-stroke`. Allowed inside a search input by Rusty's standing rule.
export const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" focusable="false" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="5" />
    <path strokeLinecap="round" d="m10.5 10.5 4 4" />
  </svg>
)

/* Garden's `new-window-stroke`, the trailing glyph on a link that leaves the page.
 * Every link in the reference screenshots that goes somewhere else carries it. */
export const ExternalLinkIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
    style={{ marginLeft: '4px', verticalAlign: '-1px', flexShrink: 0 }}
  >
    <path d="M9.5 1.5h5v5" />
    <path d="M14.5 1.5 8 8" />
    <path d="M13.5 10v4a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h4" />
  </svg>
)

/* Only three glyphs live here, and that's deliberate: Garden supplies the rest.
 * The Alert draws its own info icon, `SortableCell` its own sort control, and
 * `OverflowButton` the row kebab on the Brands list — so hand-rolled versions of
 * those were deleted rather than kept as near-duplicates of the real components. */

// The chevron on the brand page's Actions button.
export const ChevronDownIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <path d="M2.5 4.5 6 8l3.5-3.5" />
  </svg>
)
