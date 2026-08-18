import { useMemo, useState } from 'react'
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
import { Anchor, Button } from '@zendeskgarden/react-buttons'
import { MD } from '@zendeskgarden/react-typography'
import FloraTag from './FloraTag'
import PageHeader from './PageHeader'
import BrandLogo from './BrandLogo'
import { BRANDS } from '../data/brands'

/* Option 3's Brands list — Account › Brand management › Brands.
 *
 * Reproduced from the reference screenshot of the real page rather than designed:
 * this screen already exists, and Option 3's proposal is only that end-user auth
 * moves *inside* it. The one thing that changes is the row count, 2 in staging and
 * 51 here, which is the number that decides whether "put it in Brands" scales.
 *
 * Two departures from the screenshot worth knowing before either is treated as a
 * bug. There is **no search field** — the real page has none, and it isn't Option
 * 3's proposal to add one, though 51 rows is where a reviewer will want it. And the
 * row kebab is an icon inside a table, which Rusty's standing no-icons rule would
 * normally exclude; it's here because the page being reproduced has it on every row.
 */

const Description = styled(MD)`
  color: #646864;
  /* Wrapped to three lines as in the reference, rather than running the width of
     the work area. */
  max-width: 540px;
`

const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 32px 32px;
`

const Count = styled.div`
  font-size: 14px;
  color: #646864;
  margin: 24px 0 8px;
`

const NameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const BrandLink = styled(Anchor)`
  font-size: 14px;
`

const RowTags = styled.div`
  display: flex;
  gap: 8px;
`

// Flora tones — see `FloraTag`. Default / Agent route take the sheet's generic "Tag"
// purple; they were blue, which the sheet doesn't offer.
const STATUS_TONE = { Active: 'green', Inactive: 'neutral' }

// Sort cycles asc → desc → asc; there is no unsorted state, because the reference
// opens sorted by name and a table of 51 has to be in *some* order anyway.
const SORTERS = {
  name: (a, b) => a.name.localeCompare(b.name),
  status: (a, b) => a.status.localeCompare(b.status) || a.name.localeCompare(b.name),
  teamMembers: (a, b) => a.teamMembers - b.teamMembers || a.name.localeCompare(b.name),
}

export default function BrandsListPage({ onSelectBrand, onNavigateBrandManagement }) {
  const [sort, setSort] = useState({ column: 'name', direction: 'asc' })

  const rows = useMemo(() => {
    const sorted = [...BRANDS].sort(SORTERS[sort.column])
    return sort.direction === 'desc' ? sorted.reverse() : sorted
  }, [sort])

  const toggle = (column) =>
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    )

  // Garden's SortableCell takes 'asc' | 'desc' | undefined — undefined being
  // "sortable, but not the column in force", which is how the two inactive headers
  // in the reference render.
  const sortOf = (column) => (sort.column === column ? sort.direction : undefined)

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Account' },
          { label: 'Brand management', onClick: onNavigateBrandManagement },
          { label: 'Brands' },
        ]}
        title="Brands"
        /* Both inert. They're on the real page, and leaving them out would make the
           screen read as a mock-up of a list rather than as the page auth is moving
           into. */
        actions={
          <>
            <Button onClick={() => {}}>Manage settings</Button>
            <Button isPrimary onClick={() => {}}>
              Create brand
            </Button>
          </>
        }
      >
        <Description>
          Organize your account the way you organize your business. Brands can represent
          departments, regions, or products. Use them to arrange teams, control data access, and
          manage branding.
        </Description>
      </PageHeader>

      <Scroll>
        <Count>{BRANDS.length} brands</Count>

        <Table>
          <Head>
            <HeaderRow>
              <SortableCell width="46%" sort={sortOf('name')} onClick={() => toggle('name')}>
                Name
              </SortableCell>
              <SortableCell width="18%" sort={sortOf('status')} onClick={() => toggle('status')}>
                Status
              </SortableCell>
              <SortableCell
                width="24%"
                sort={sortOf('teamMembers')}
                onClick={() => toggle('teamMembers')}
              >
                Team members
              </SortableCell>
              <HeaderCell hasOverflow />
            </HeaderRow>
          </Head>
          <Body>
            {rows.map((brand) => (
              <Row key={brand.id}>
                <Cell>
                  <NameCell>
                    <BrandLogo brand={brand} />
                    <BrandLink
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        onSelectBrand(brand.id)
                      }}
                    >
                      {brand.name}
                    </BrandLink>
                    <RowTags>
                      {brand.isDefault && <FloraTag tone="purple">Default</FloraTag>}
                      {brand.isAgentRoute && <FloraTag tone="purple">Agent route</FloraTag>}
                    </RowTags>
                  </NameCell>
                </Cell>
                <Cell>
                  <FloraTag tone={STATUS_TONE[brand.status]}>{brand.status}</FloraTag>
                </Cell>
                <Cell>{brand.teamMembers}</Cell>
                <Cell hasOverflow>
                  <OverflowButton aria-label={`Actions for ${brand.name}`} onClick={() => {}} />
                </Cell>
              </Row>
            ))}
          </Body>
        </Table>
      </Scroll>
    </>
  )
}
