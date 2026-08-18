# Department spaces authentication

A prototype for one question: **end user authentication is becoming per-brand — where
does the brand dimension live?**

Today Account › Security › End user authentication is a single account-wide page. Three
answers are on the table, switchable from the dropdown in the top right:

| Option | Shape | The argument it makes |
| --- | --- | --- |
| **1 — End user auth with brands dropdown** | The page as it is, with a **Brands** menu at the top of the settings | Smallest change. One page, one place to look, the brand is just another control. |
| **2 — End user auth table** | The page becomes a **table of 51 brands**; a brand drills down to its settings | Per-brand auth is state you need to *survey* — which brand still has passwords on, which has no SSO. A dropdown shows one brand at a time. |
| **3 — Brands flow** | The settings move **inside Brands**, reached from a brand's **Actions** menu; the old location becomes a signpost | Brand is a place, not a field. Costs the reader a longer trip, leaves a redirect page behind, and puts the setting behind a menu. |

All three render the **same settings screen** (`EndUserAuthPage`) against the **same 51
brands** (`src/data/brands.js`), so what a reviewer is comparing is only the
navigation — not accidental differences between three copies of a form.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
npm run deploy   # gh-pages, if/when it's shared as a link
```

Comment mode needs `.env.local` (already present, gitignored) — see **Comments** below.

## Where things are

| File | What it is |
| --- | --- |
| [src/App.jsx](src/App.jsx) | Chrome, the option switcher, and all navigation state |
| [src/components/AdminCenterNav.jsx](src/components/AdminCenterNav.jsx) | The Account sub-nav, every real item, only two clickable |
| [src/components/PageHeader.jsx](src/components/PageHeader.jsx) | Breadcrumbs + title for every screen — the one place page-title geometry lives |
| [src/components/FloraTag.jsx](src/components/FloraTag.jsx) | The one tag — Flora's pale fill, tinted text and pill shape; the one place tag colour lives |
| [src/components/EndUserAuthPage.jsx](src/components/EndUserAuthPage.jsx) | The settings screen, shared by all three options |
| [src/components/BrandsAuthTable.jsx](src/components/BrandsAuthTable.jsx) | Option 2's brand table |
| [src/components/EuaMovedPage.jsx](src/components/EuaMovedPage.jsx) | Option 3's signpost |
| [src/components/BrandsListPage.jsx](src/components/BrandsListPage.jsx) | Option 3's Brands list |
| [src/components/BrandDetailPage.jsx](src/components/BrandDetailPage.jsx) | Option 3's brand page — Access tab, and the Actions menu that opens the settings |
| [src/data/brands.js](src/data/brands.js) | The 51-brand roster and its auth settings |
| [src/comments/](src/comments/) | Comment mode (from the `prototype-comments` skill) |

Garden `^9.15.6` throughout, with the vendored Flora theme in
[src/flora-theme/](src/flora-theme/) and the global nav from
`zendesk-globalnav-template`. Navigation is App-level state, **not react-router** — a
comment pin has to be able to restore the exact screen it was made on.

## Decisions and departures worth knowing

Things that look like bugs but aren't, and things a reviewer may want changed:

- **Messaging and LLM as a channel do nothing.** Rusty scoped both out. They render, and
  clicking them is a deliberate no-op rather than a disabled state — a greyed tab would
  claim the channel is unavailable.
- **Option 2's table has no channel tabs.** The tabs scope a *setting*, and the list sets
  nothing; they appear on the drill-down. Easy to flip.
- **Option 3's Brands list has no search field** — the real page doesn't have one. 51 rows
  is where a reviewer will want it. Its row kebab is an icon inside a table, which the
  standing no-icons rule would normally exclude; it's there because the real page has it.
- **Brand logos are placeholders** — a coloured square with the brand's initial. The real
  page shows uploaded images and there are no assets for 51 brands.
- **Every tag is `FloraTag`**, built to Rusty's Flora tag sheet: pale fill + the same
  hue's dark text (palette 200/900), fully round `isPill` ends, and a **20px height cap**
  — Rusty's rule, and Garden's `medium` size exactly, so the two agree rather than one
  clipping the other. (The sheet's chips measure ~32px; the cap is the later
  instruction.) Garden's own named hues render *solid*
  chips with white text, which is what this used to look like. The sheet has no blue
  swatch, so Default / Agent route on the Brands list took its generic purple "Tag"
  style; they were blue, from the pre-Flora screenshot of that page. Low password level
  stays neutral rather than red — red would assert "misconfigured".
- **Password login and SSO read Active / Inactive**, the same words as a brand's own
  status, so Option 2's table carries one vocabulary for "is this on" across three
  columns. They said Turned on / Turned off.
- **Password level shows an em dash, not a tag, when password login is off.** There's no
  password to set a level for, and a chip would claim a level that isn't in force.
- **Column set in Option 2 is subject to change** — Rusty flagged that when specifying it.
- **Option 2's row menu holds one item, *View***, which goes exactly where clicking the
  brand name goes. A one-item menu is the point: it's where Edit / Deactivate would land,
  so a reviewer can judge whether these rows want a menu at all. Unlike the Brands list's
  kebab, this one works.
- **Option 2's search field has a label, not a placeholder.** A placeholder vanishes as
  soon as someone types, so it can't be the only thing naming the field.
- **The info Alert** is nudged lighter than Flora's flat grey, to match the reference
  screenshot, which predates Flora. Know which of the two you're looking at before
  "fixing" either.
- **Option 3's Actions menu items are placeholders** apart from *End user authentication* —
  Edit / Deactivate / Delete brand are standing in until the reference screenshot of that
  menu lands. They're one array at the top of `BrandDetailPage.jsx`, and all inert.
- **Option 3's brand page has no tabs.** End user authentication was briefly a second tab
  beside Access; it now lives in Actions, and the page is the real one from the
  screenshot — breadcrumbs, identity, Actions, "Who has access".
- **A brand from the Brands list always opens its own page**, however the reader got to
  the list. It briefly skipped ahead to the settings when they arrived via *View brands*;
  that's out, so nobody bypasses Access and the trip through Actions is the same trip for
  everyone — which is part of what Option 3 asks reviewers to judge.
- **Page titles are regular weight, 40px from the top of the work area**, and every screen
  gets them from `PageHeader` — so switching option or drilling into a brand never makes
  the title hop. The breadcrumb row keeps its 18px even when a page has no crumbs, which
  is what holds that alignment. `TITLE_TOP` in that file is the single number to change.
- **The Cancel/Save bar is full-bleed** — its divider spans the whole work area and Save
  sits 32px from the right edge, not where the 840px settings column ends. Rusty's
  standing rule for bottom bars; the reference screenshot shows the bounded version.
- **Section headings inside a page are still bold** ("Who has access") — only the page
  titles went regular.
- **Nothing persists.** Every control is live within the session; a reload resets it.
- **`currentProduct` is `admin-center`, with a hyphen.** That's the id in the template's
  product list, and MainNav compares against it literally — `admin_center` isn't
  rejected, it just silently falls back to Support's nav rail.

## Comments

Comment mode is the [prototype-comments](../../.claude/skills/prototype-comments/SKILL.md)
skill, backed by the shared Supabase project (`project` column namespaces prototypes, so
there's no per-prototype setup beyond `PROJECT` in
[src/comments/store.js](src/comments/store.js) and copying `.env.local`).

Pins attach to the `MainContent` work area only, so the top bar, option switcher, global
nav and the Account sub-nav stay clickable with comment mode on. The trade-off: a reviewer
can't pin a comment *on* the "End user authentication" nav item, which is itself part of
what Option 3 changes. Keeping the sub-nav live wins — covering it would strand a reviewer
on whichever screen they entered on.

A pin remembers `{ option, route, brandId }` and restores all three, because the same
screen position holds different content in each.
