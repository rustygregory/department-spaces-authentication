import { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import {
  Table,
  Head,
  HeaderRow,
  HeaderCell,
  SortableCell,
  Body,
  Row,
  Cell,
  OverflowButton,
} from '@zendeskgarden/react-tables'
import { Field, Label, MediaInput } from '@zendeskgarden/react-forms'
import { Menu, Item } from '@zendeskgarden/react-dropdowns'
import { Anchor } from '@zendeskgarden/react-buttons'
import { MD } from '@zendeskgarden/react-typography'
import CopySettingsModal from './CopySettingsModal'
import FloraTag from './FloraTag'
import PageHeader from './PageHeader'
import { SearchIcon } from './icons'
import {
  BRANDS,
  PASSWORD_LEVELS,
  passwordLevelLabel,
  passwordLoginLabel,
  signInModeLabel,
  ssoLabel,
} from '../data/brands'

/* Option 2: End user authentication opens as a list of brands, and the settings are
 * one level down.
 *
 * The argument this option makes is that per-brand auth is 51 rows of state an admin
 * needs to *survey* — which brand still has passwords on, which has no SSO — and
 * that a dropdown can only ever show one brand at a time. The cost it accepts is a
 * click before you can change anything.
 */

const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 32px 32px;
`

const Description = styled(MD)`
  color: #646864;
  max-width: 620px;
`

/* Two overrides on Garden's MediaInput, carried over from organization-hierarchy:
   it sizes to its font, so the height is pinned; and it aligns its icon on
   `baseline`, which leaves the magnifying glass low in a taller-than-default input. */
const SearchField = styled(Field)`
  width: 450px;
  margin-top: 20px;

  [data-garden-id='forms.faux_input'] {
    align-items: center;
    box-sizing: border-box;
    height: 40px;
  }

  [data-garden-id='forms.input'] {
    height: 100%;
  }
`

/* Garden's Field sets `font-size: 0` to collapse the whitespace between its children,
   and its Label is inline with no margin of its own — so the label needs both the block
   display and the 4px, the same gap the settings page puts under its own field labels. */
const SearchLabel = styled(Label)`
  display: block;
  margin-bottom: 4px;
`

/* Rusty's numbers: 24px from the search input down to this line, 8px from it to the
   table header. Both stated here, on the element they're measured from, rather than one
   of them hiding in the search field's bottom margin. */
const Count = styled.div`
  font-size: 14px;
  color: #646864;
  margin: 24px 0 8px;
`

/* The brand name is the row's *indicator* now that the whole row is clickable, so it
   carries Garden's primary blue without an underline at rest — an underline on every
   row would read as 51 links to click, when the thing you click is the row. It
   underlines on hover, and on hover of the row rather than of the four characters in
   "RPM", because that's the target the pointer is actually over. */
const BrandLink = styled(Anchor)`
  font-size: 14px;
  text-decoration: none;
`

/* Rusty's ask: click anywhere in the row to drill into the brand. Garden already
   supplies the row's hover fill and border (see StyledRow's colorStyles), so this adds
   the pointer, and the name's underline follows the same hover.

   Deliberately no `tabIndex` on the row: a focusable <tr> would put a third tab stop on
   every one of 51 rows, in front of the brand link and the kebab that already do this
   from the keyboard. Enter on the brand link bubbles a click up to here, so the keyboard
   path and the pointer path end in the same handler. */
const ClickableRow = styled(Row)`
  cursor: pointer;

  &:hover ${BrandLink} {
    text-decoration: underline;
  }
`

const Empty = styled.div`
  padding: 24px 0;
  font-size: 14px;
  color: #646864;
`

/* Tag tones, from Rusty's Flora sheet — see `FloraTag`, which holds the fills and the
 * pill shape. One map covers all three of the on/off columns now that they read
 * Active / Inactive: password login, SSO and the brand's own status.
 *
 * Neutral is doing real work here rather than standing in for "no value": an inactive
 * method is a state an admin is scanning for, so it gets a chip of its own weight
 * rather than being left blank. */
const STATE_TONE = { Active: 'green', Inactive: 'neutral' }

/* Password level. Low stays neutral rather than going red — a low level is the
   unremarkable default, and red would assert "misconfigured", which isn't a claim this
   prototype should make for Rusty. High and Recommended share green because both are
   the strong end; the label itself tells them apart. */
const LEVEL_TONE = {
  Low: 'neutral',
  Medium: 'yellow',
  High: 'green',
  Recommended: 'green',
  Custom: 'purple',
}

/* Sorting, per column. Every comparator falls back to the brand name, so rows that tie —
 * and with three Active/Inactive columns most of them do — land in alphabetical order
 * rather than in whatever order the roster happens to hold. Without that, sorting by
 * Status would look like it had shuffled the table.
 *
 * The three on/off columns sort on their label, which puts Active before Inactive
 * ascending. Password level sorts by the order in `PASSWORD_LEVELS` — the same order the
 * settings page's dropdown lists them in — rather than alphabetically, which would give
 * Custom, High, Low, Medium, Recommended and mean nothing. The brands with password login
 * off have no level, and their blank cells sort to the end ascending: they belong after a
 * list of levels rather than seeded through it, and grouped rather than scattered.
 */
const byName = (a, b) => a.name.localeCompare(b.name)
const levelRank = (brand) => {
  const level = passwordLevelLabel(brand)
  return level ? PASSWORD_LEVELS.indexOf(level) : PASSWORD_LEVELS.length
}

const SORTERS = {
  brand: byName,
  passwordLogin: (a, b) =>
    passwordLoginLabel(a).localeCompare(passwordLoginLabel(b)) || byName(a, b),
  sso: (a, b) => ssoLabel(a).localeCompare(ssoLabel(b)) || byName(a, b),
  signInMode: (a, b) => signInModeLabel(a).localeCompare(signInModeLabel(b)) || byName(a, b),
  passwordLevel: (a, b) => levelRank(a) - levelRank(b) || byName(a, b),
}

export default function BrandsAuthTable({ onSelectBrand }) {
  const [query, setQuery] = useState('')
  /* Which brand's "Copy settings" modal is open — null when none. */
  const [copyTarget, setCopyTarget] = useState(null)
  /* Incremented after a copy so the table re-reads the mutated brand data. */
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCopySaved = useCallback(() => setRefreshKey((k) => k + 1), [])

  /* Brand ascending is the default, per Rusty — the roster's own order is neither
     alphabetical nor meaningful, and a table of 51 rows is in *some* order whether or not
     anyone chose it. Cycles asc → desc → asc; there's no unsorted state to return to,
     the same as the Brands list in Option 3. */
  const [sort, setSort] = useState({ column: 'brand', direction: 'asc' })

  // Filter first, then sort — sorting the whole roster and filtering after would do the
  // same thing at 51 rows, but this is the order that stays right if the roster grows.
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matching = needle
      ? BRANDS.filter((brand) => brand.name.toLowerCase().includes(needle))
      : BRANDS
    const sorted = [...matching].sort(SORTERS[sort.column])
    return sort.direction === 'desc' ? sorted.reverse() : sorted
    // refreshKey: re-read brand data after a copy-settings save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, refreshKey])

  const toggle = (column) =>
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    )

  // Garden's SortableCell takes 'asc' | 'desc' | undefined. Undefined is "sortable, but
  // not the column in force" — the double chevron in Rusty's screenshot — so passing it
  // for the other four columns is what makes them all read as sortable.
  const sortOf = (column) => (sort.column === column ? sort.direction : undefined)

  return (
    <>
      {/* Nothing above this page goes anywhere in Admin Center, so every crumb is grey.
          The drill-down is where a crumb becomes a link. */}
      <PageHeader
        breadcrumbs={[
          { label: 'Account' },
          { label: 'Security' },
          { label: 'End user authentication' },
        ]}
        title="End user authentication"
      >
        <Description>
          Each brand has its own end user authentication settings. Select a brand to review or change
          them.
        </Description>
        {/* No channel tabs on this screen. Tickets / Messaging / LLM as a channel scope
            a *setting*, and this page sets nothing — the tabs appear on the drill-down,
            where they have something to scope. Easy to flip if Rusty wants them on the
            list too. */}
      </PageHeader>

      <Scroll>
        {/* The label carries "Search brands" now; the input's placeholder is gone, at
            Rusty's ask. A placeholder disappears the moment someone types, so it can't
            be the only thing naming the field. */}
        <SearchField>
          <SearchLabel>Search brands</SearchLabel>
          <MediaInput
            start={<SearchIcon />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </SearchField>

        {/* Counts the filtered list, not the roster — a count that stayed at 51 while
            the table showed three rows would be worse than no count. */}
        <Count>
          {rows.length} {rows.length === 1 ? 'brand' : 'brands'}
        </Count>

        {/* No icons in this table, by Rusty's standing rule — the search glyph above and
            Garden's own overflow control are the exceptions it allows.
            Columns are subject to change (Rusty flagged this when specifying them),
            so they're listed in one place rather than spread through the row.
            The five widths total 94%; the rest goes to the unsized overflow column, the
            same way the Brands list sizes its own. */}
        <Table>
          <Head>
            <HeaderRow>
              <SortableCell width="28%" sort={sortOf('brand')} onClick={() => toggle('brand')}>
                Brand
              </SortableCell>
              <SortableCell
                width="16%"
                sort={sortOf('passwordLogin')}
                onClick={() => toggle('passwordLogin')}
              >
                Password login
              </SortableCell>
              <SortableCell width="14%" sort={sortOf('sso')} onClick={() => toggle('sso')}>
                SSO
              </SortableCell>
              <SortableCell
                width="18%"
                sort={sortOf('signInMode')}
                onClick={() => toggle('signInMode')}
              >
                End user sign in
              </SortableCell>
              <SortableCell
                width="18%"
                sort={sortOf('passwordLevel')}
                onClick={() => toggle('passwordLevel')}
              >
                Password level
              </SortableCell>
              {/* The overflow column stays a plain header — there's nothing in it to
                  order by. */}
              <HeaderCell hasOverflow />
            </HeaderRow>
          </Head>
          <Body>
            {rows.map((brand) => {
              const level = passwordLevelLabel(brand)
              return (
                <ClickableRow key={brand.id} onClick={() => onSelectBrand(brand.id)}>
                  <Cell>
                    {/* The anchor only cancels the `#`; the row above it does the
                        navigating, so there's one path in whether the reader clicked the
                        name, clicked the Password level column, or pressed Enter on the
                        link — a click from the keyboard bubbles up here too. */}
                    <BrandLink href="#" onClick={(event) => event.preventDefault()}>
                      {brand.name}
                    </BrandLink>
                  </Cell>
                  <Cell>
                    <FloraTag tone={STATE_TONE[passwordLoginLabel(brand)]}>
                      {passwordLoginLabel(brand)}
                    </FloraTag>
                  </Cell>
                  <Cell>
                    <FloraTag tone={STATE_TONE[ssoLabel(brand)]}>{ssoLabel(brand)}</FloraTag>
                  </Cell>
                  <Cell>{signInModeLabel(brand)}</Cell>
                  {/* Empty when password login is off — those end users sign in through an
                      external provider, so there is no password and no level to show.
                      Blank rather than an em dash, per Rusty: a dash reads as a value that
                      couldn't be found, and this is a setting that doesn't apply. */}
                  <Cell>{level && <FloraTag tone={LEVEL_TONE[level]}>{level}</FloraTag>}</Cell>
                  {/* One item, deliberately: View goes exactly where clicking the row goes.
                      A menu holding a single option is worth having anyway — it's where
                      Edit, Deactivate and the rest would land, so a reviewer can judge
                      whether this row wants a menu at all. */}
                  {/* stopPropagation so opening the kebab isn't also a click on the row —
                      it would drill in behind the menu it just opened. */}
                  <Cell hasOverflow onClick={(event) => event.stopPropagation()}>
                    <Menu
                      placement="bottom-end"
                      button={(props) => (
                        <OverflowButton {...props} aria-label={`Actions for ${brand.name}`} />
                      )}
                      onChange={(changes) => {
                        if (changes.value === 'view') onSelectBrand(brand.id)
                        if (changes.value === 'copy-settings') setCopyTarget(brand)
                      }}
                    >
                      <Item value="view">View</Item>
                      <Item value="copy-settings">Copy brand settings to here</Item>
                    </Menu>
                  </Cell>
                </ClickableRow>
              )
            })}
          </Body>
        </Table>

        {rows.length === 0 && <Empty>No brands match “{query}”.</Empty>}
      </Scroll>

      {copyTarget && (
        <CopySettingsModal
          targetBrand={copyTarget}
          onClose={() => setCopyTarget(null)}
          onSaved={handleCopySaved}
        />
      )}
    </>
  )
}
