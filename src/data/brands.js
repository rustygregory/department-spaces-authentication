/* The 51 brands, shared by all three options.
 *
 * One roster on purpose: Option 1's dropdown, Option 2's table and Option 3's
 * brands list all read from here, so "Dinoco" means the same settings whichever
 * option a reviewer is looking at. Comparing three placements of the same feature
 * is the whole point of the prototype — two rosters would let the same brand hold
 * two different answers and quietly invalidate the comparison.
 *
 * The first two entries are the brands that actually exist in Rusty's staging
 * account (z3nrusteze), with the member counts and tags from the reference
 * screenshots, so those screenshots map 1:1 onto the prototype. Dinoco also
 * carries the exact auth settings shown on the End user authentication screenshot:
 * Zendesk auth on at Low, external auth on, Google only, Redirect to SSO.
 */

export const PASSWORD_LEVELS = ['Low', 'Medium', 'High', 'Recommended', 'Custom']

/* Names from the Cars/Dinoco register the staging account already uses.
 * Deliberately uneven in length — the shortest is 3 characters and the longest 24,
 * which is what gives Option 1's dropdown width and Option 2's Brand column a real
 * test rather than a flattering one. */
const NAMES = [
  'Dinoco',
  'Rusteze',
  'Lightyear Tires',
  'Piston Cup',
  'Gasprin',
  'Leak Less',
  'Sputter Stop',
  'Tank Coat',
  'Trunk Fresh',
  'Mood Springs',
  'No Stall',
  'Vitoline',
  'Nitroade',
  'Shifty Drug',
  'Re-Volting',
  'View Zeen',
  'Clutch Aid',
  'Bumper Save',
  'Easy Idle',
  'Faux Wheel Drive',
  'Vinyl Toupee',
  'Transberry Juice',
  'Hostile Takeover Bank',
  'Octane Gain',
  'Revo-Zone',
  'RPM',
  'Spare Mint',
  'Tach-O-Mint',
  'Blinkr',
  'Fiber Fuel',
  'N2O Cola',
  'Sidewall Shine',
  'Combustr',
  'Retread',
  'Gask-Its',
  "Lil' Torquey Pistons",
  'Bumper Bargains',
  'Carbon Cyber',
  'Konnect Wireless',
  'Mater Towing',
  'Flo V8 Cafe',
  'Ramone House of Body Art',
  'Luigi Casa Della Tires',
  'Sarge Surplus Hut',
  'Fillmore Organic Fuel',
  'Wheel Well Motel',
  'Copper Canyon Speedway',
  'Motor Speedway of the South',
  'Radiator Springs Courthouse',
  'Willys Butte Outfitters',
  // 51 rather than 50, at Rusty's ask: a round number reads as a placeholder, and an
  // odd one makes reviewers treat the count as real data.
  'Cotter Pin Tavern',
]

/* Placeholder logos. The real page shows an uploaded image per brand; there are 51
 * here and no assets, so each renders as a rounded square in one of these hues with
 * its own initial. Flagged rather than hidden — if Rusty wants real marks later,
 * this is the field to replace. */
const LOGO_COLORS = ['#1f73b7', '#2e5578', '#03363d', '#5293c7', '#227a76', '#644ba0', '#8a4d6f', '#ad5928']

/* Brands whose status is Inactive. Six of the fifty-one, spread through the list rather
 * than bunched at the end, so the Status column has something to sort. */
const INACTIVE = new Set(['Re-Volting', 'Shifty Drug', 'Bumper Bargains', 'Retread', 'Wheel Well Motel', 'Willys Butte Outfitters'])

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* Auth settings per brand, derived from the index so the roster is the same on
 * every load and in every option — a random spread would give two reviewers
 * different tables and make a comment about "the third row" meaningless.
 *
 * The one rule this enforces rather than derives: **at least one method is always
 * on.** The real page says "Choose at least one method for authenticating end
 * users", so a brand with both switched off is a state the product doesn't allow,
 * and a table row showing it would read as a bug in the prototype rather than as
 * data. When the index would produce that pair, Zendesk authentication wins. */

/* The brands with password login off — ten of the 51, per Rusty, which is the number of
 * blank Password level cells Option 2's table shows. Listed rather than derived: the
 * modulo that used to decide this produced seven, because the "at least one method"
 * rule above kept switching password login back on for brands that had no external
 * provider either. Every index here has external authentication on, so none of them
 * trips that rule, and the count is exactly what it says.
 *
 * Spread through the roster rather than bunched, so they're visible wherever a reviewer
 * is looking and the Password level sort has something to gather at its end. */
const NO_PASSWORD_LOGIN = new Set([2, 6, 9, 14, 20, 26, 33, 38, 44, 50])

function authFor(index) {
  const zendeskAuth = !NO_PASSWORD_LOGIN.has(index)
  const externalAuth = index % 3 !== 1
  return {
    zendeskAuth: zendeskAuth || !externalAuth,
    passwordLevel: PASSWORD_LEVELS[index % PASSWORD_LEVELS.length],
    externalAuth,
    providers: {
      google: externalAuth && index % 2 === 0,
      microsoft: externalAuth && index % 4 === 1,
      facebook: externalAuth && index % 7 === 3,
    },
    // Which radio in "How end users sign in" is selected.
    signInMode: index % 3 === 0 ? 'sso' : 'choose',
  }
}

/* Explicit settings for the two staging brands, so the reference screenshots and
 * the prototype show the same thing. */
const OVERRIDES = {
  dinoco: {
    teamMembers: 5,
    auth: {
      zendeskAuth: true,
      passwordLevel: 'Low',
      externalAuth: true,
      providers: { google: true, microsoft: false, facebook: false },
      signInMode: 'sso',
    },
  },
  rusteze: {
    teamMembers: 7,
    isDefault: true,
    isAgentRoute: true,
  },
}

export const BRANDS = NAMES.map((name, index) => {
  const id = slugify(name)
  const base = {
    id,
    name,
    subdomain: `${id}.zendesk.com`,
    logoColor: LOGO_COLORS[index % LOGO_COLORS.length],
    initial: name.replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase(),
    status: INACTIVE.has(name) ? 'Inactive' : 'Active',
    // 3–41, walked rather than randomised. Two brands share no count with their
    // neighbours, which keeps the Team members sort visibly doing something.
    teamMembers: 3 + ((index * 7) % 39),
    isDefault: false,
    // A couple of brands route agents, matching the tag on Rusteze in the
    // reference. Kept rare — it reads as an exception in the real list too.
    isAgentRoute: index === 12 || index === 27,
    auth: authFor(index),
  }
  const override = OVERRIDES[id]
  return override ? { ...base, ...override, auth: { ...base.auth, ...override.auth } } : base
})

export const getBrand = (id) => BRANDS.find((brand) => brand.id === id)

/* Save. The settings page edits a local copy and commits it here, so a saved change to
 * Dinoco's password level is the value Option 2's table shows when the reader goes back to
 * it — a Save that a table then contradicted would be worse than no Save at all.
 *
 * It writes onto the roster entry rather than into a store with subscribers: the screens
 * that read `auth` re-render when navigation state changes, which is the only way to leave
 * this page, so nothing needs to be notified. The brand object itself keeps its identity,
 * which matters — the settings page re-seeds its fields whenever the `brand` it was handed
 * changes, and a new object would make saving look like a reset.
 *
 * Still nothing past a reload. This is session state, not a backend. */
export const saveBrandAuth = (id, auth) => {
  const brand = getBrand(id)
  if (brand) brand.auth = { ...brand.auth, ...auth }
  return brand
}

/* Column values for Option 2's table, derived from the same `auth` object the
 * settings page renders. Derived rather than stored so the table and the page it
 * drills into cannot disagree — the failure mode being a row that says Inactive
 * above a page with the box checked.
 *
 * Active / Inactive rather than Turned on / Turned off, at Rusty's ask. It means the
 * table carries the same two words in three columns — password login, SSO and the
 * brand's own status — which is the point: one vocabulary for "is this on", whatever
 * the subject. */
export const passwordLoginLabel = (brand) => (brand.auth.zendeskAuth ? 'Active' : 'Inactive')
export const ssoLabel = (brand) => (brand.auth.externalAuth ? 'Active' : 'Inactive')
export const signInModeLabel = (brand) =>
  brand.auth.signInMode === 'sso' ? 'Redirect to SSO' : 'Let them choose'

/* Null when Zendesk authentication is off, per Rusty: that brand's end users sign in
 * through an external provider, so there is no password and no level to report. Option 2's
 * cell then renders **empty** — not an em dash, which would read as a value that couldn't
 * be looked up rather than as a setting that doesn't apply. */
export const passwordLevelLabel = (brand) => (brand.auth.zendeskAuth ? brand.auth.passwordLevel : null)

/* The bullet list under Password level. Derived from the level so changing the
 * dropdown visibly changes the rules — the Low set is verbatim from the reference
 * screenshot; the rest tighten from there. */
export const PASSWORD_RULES = {
  Low: ['Must be at least 5 characters', '10 attempts allowed before lockout', 'Must be different from email address'],
  Medium: [
    'Must be at least 6 characters',
    'Must include a letter and a number',
    '10 attempts allowed before lockout',
    'Must be different from email address',
  ],
  High: [
    'Must be at least 8 characters',
    'Must include upper and lower case letters, a number and a symbol',
    '5 attempts allowed before lockout',
    'Cannot reuse the last 5 passwords',
    'Expires every 90 days',
  ],
  Recommended: [
    'Must be at least 8 characters',
    'Must include a letter and a number',
    '5 attempts allowed before lockout',
    'Cannot reuse the last 3 passwords',
  ],
  Custom: ['Rules are set individually for this brand', 'Configured under Advanced security settings'],
}
