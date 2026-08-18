import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { Table, Head, HeaderRow, HeaderCell, Body, Row, Cell } from '@zendeskgarden/react-tables'
import { Field, MediaInput } from '@zendeskgarden/react-forms'
import { Anchor } from '@zendeskgarden/react-buttons'
import { MD } from '@zendeskgarden/react-typography'
import FloraTag from './FloraTag'
import PageHeader from './PageHeader'
import { SearchIcon } from './icons'
import { BRANDS, passwordLevelLabel, passwordLoginLabel, ssoLabel } from '../data/brands'

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
  /* Rusty's spacing: 24px from the input to the count line, 8px from the count to
     the table. Set here rather than as a margin on the count line so the two
     numbers stay in one place. */
  margin: 20px 0 24px;

  [data-garden-id='forms.faux_input'] {
    align-items: center;
    box-sizing: border-box;
    height: 40px;
  }

  [data-garden-id='forms.input'] {
    height: 100%;
  }
`

const Count = styled.div`
  font-size: 14px;
  color: #646864;
  margin-bottom: 8px;
`

const BrandLink = styled(Anchor)`
  font-size: 14px;
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

export default function BrandsAuthTable({ onSelectBrand }) {
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? BRANDS.filter((brand) => brand.name.toLowerCase().includes(needle)) : BRANDS
  }, [query])

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
        <SearchField>
          <MediaInput
            start={<SearchIcon />}
            placeholder="Search brands"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </SearchField>

        {/* Counts the filtered list, not the roster — a count that stayed at 51 while
            the table showed three rows would be worse than no count. */}
        <Count>
          {rows.length} {rows.length === 1 ? 'brand' : 'brands'}
        </Count>

        {/* No icons in this table, by Rusty's standing rule — the search glyph above
            is the exception it allows.
            Columns are subject to change (Rusty flagged this when specifying them),
            so they're listed in one place rather than spread through the row. */}
        <Table>
          <Head>
            <HeaderRow>
              <HeaderCell width="30%">Brand</HeaderCell>
              <HeaderCell width="17%">Password login</HeaderCell>
              <HeaderCell width="15%">SSO</HeaderCell>
              <HeaderCell width="15%">Status</HeaderCell>
              <HeaderCell width="23%">Password level</HeaderCell>
            </HeaderRow>
          </Head>
          <Body>
            {rows.map((brand) => {
              const level = passwordLevelLabel(brand)
              return (
                <Row key={brand.id}>
                  <Cell>
                    <BrandLink
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        onSelectBrand(brand.id)
                      }}
                    >
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
                  <Cell>
                    <FloraTag tone={STATE_TONE[brand.status]}>{brand.status}</FloraTag>
                  </Cell>
                  {/* An em dash rather than a tag when password login is off: there is
                      no password to set a level for, and a chip would claim a level
                      that isn't in force. */}
                  <Cell>{level ? <FloraTag tone={LEVEL_TONE[level]}>{level}</FloraTag> : '—'}</Cell>
                </Row>
              )
            })}
          </Body>
        </Table>

        {rows.length === 0 && <Empty>No brands match “{query}”.</Empty>}
      </Scroll>
    </>
  )
}
