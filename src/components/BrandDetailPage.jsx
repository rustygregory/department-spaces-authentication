import styled from 'styled-components'
import { Menu, Item } from '@zendeskgarden/react-dropdowns'
import { Anchor, Button } from '@zendeskgarden/react-buttons'
import { XXL } from '@zendeskgarden/react-typography'
import FloraTag from './FloraTag'
import PageHeader from './PageHeader'
import BrandLogo from './BrandLogo'
import { ChevronDownIcon, ExternalLinkIcon } from './icons'

/* Option 3: a brand's page, reproduced from the reference screenshot — breadcrumbs,
 * the brand's identity, an Actions menu, and "Who has access" with the Brand members
 * card. No tabs: the real page has none, and Option 3's proposal doesn't add one.
 *
 * End user authentication is an item in the **Actions** menu instead. That costs the
 * discoverability a tab would give — you have to open a menu to learn the setting is
 * there — and buys a brand page that isn't growing a tab per setting, plus settings
 * that aren't nested two levels of tabs deep. That trade is the thing for reviewers to
 * argue about.
 */

/* The Actions menu.
 *
 * ⚠️ Only `end-user-authentication` is confirmed. The rest are placeholders standing in
 * for the items in the real menu, which the reference screenshot doesn't show opened —
 * replace this array wholesale when it lands, and keep destructive items on
 * `type="danger"`. Every item but End user authentication is inert.
 */
const ACTIONS = [
  { value: 'edit', label: 'Edit brand' },
  { value: 'deactivate', label: 'Deactivate brand' },
  { value: 'end-user-authentication', label: 'End user authentication' },
  { value: 'delete', label: 'Delete brand', type: 'danger' },
]

const AUTH_ACTION = 'end-user-authentication'

/* Everything under the header scrolls as one column — no pinned footer, because unlike
   the settings page there's nothing here to save. The horizontal padding matches
   PageHeader's so the card lines up under the title. */
const Page = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 0 32px 32px;
`

/* Blue label on a hairline border, as in the reference. Flora's neutral button is dark
   grey — the screenshot predates Flora, and Rusty asked for this page to match it. */
const ActionsButton = styled(Button)`
  color: #1f73b7;
  border-color: #d8dcde;

  &:hover {
    color: #144a75;
    border-color: #c2c8cc;
  }
`

const SectionHeading = styled(XXL)`
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #2f3130;
  /* The screenshot leaves a deliberate gap between the brand's identity and the first
     section — this isn't a header the card sits directly beneath. */
  margin: 56px 0 24px;
`

const Card = styled.div`
  box-sizing: border-box;
  width: 336px;
  padding: 20px;
  border: 1px solid #eae9e8;
  border-radius: 8px;
`

const CardTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2f3130;
`

const CardBody = styled.div`
  font-size: 13px;
  color: #646864;
  margin-top: 6px;
  line-height: 20px;
`

const CardNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #2f3130;
  margin: 12px 0 8px;
`

const OutboundLink = styled(Anchor)`
  display: inline-flex;
  align-items: center;
  text-decoration: underline;
  font-size: 14px;
`

// Flora tones — see `FloraTag`.
const STATUS_TONE = { Active: 'green', Inactive: 'neutral' }

/**
 * @param brand              the brand being shown
 * @param onOpenAuth         Actions → End user authentication
 * @param onNavigateBrands   back to the Brands list
 */
export default function BrandDetailPage({ brand, onOpenAuth, onNavigateBrands }) {
  return (
    <>
      {/* The brand's name is this page's title, so it goes through the same header as
          every other screen — which is what keeps it from sitting higher or lower than
          the titles either side of it in the flow. */}
      <PageHeader
        breadcrumbs={[
          { label: 'Account' },
          { label: 'Brand management' },
          { label: 'Brands', onClick: onNavigateBrands },
          { label: brand.name },
        ]}
        title={brand.name}
        titleBefore={<BrandLogo brand={brand} size={44} />}
        titleAfter={<FloraTag tone={STATUS_TONE[brand.status]}>{brand.status}</FloraTag>}
        subtitle={brand.subdomain}
        actions={
          /* Garden reports a clicked item as `changes.value` with a `menuItem:click`
             type — not on `selectedItems`, which is for menus that hold a selection.
             This one performs actions, so it holds none. */
          <Menu
            placement="bottom-end"
            button={(props) => (
              <ActionsButton {...props}>
                Actions
                <Button.EndIcon>
                  <ChevronDownIcon />
                </Button.EndIcon>
              </ActionsButton>
            )}
            onChange={(changes) => {
              if (changes.value === AUTH_ACTION) onOpenAuth()
            }}
          >
            {ACTIONS.map((action) => (
              <Item key={action.value} value={action.value} type={action.type}>
                {action.label}
              </Item>
            ))}
          </Menu>
        }
      />

      <Page>
        <SectionHeading tag="h2">Who has access</SectionHeading>
        <Card>
          <CardTitle>Brand members</CardTitle>
          <CardBody>
            These team members can work on this brand&apos;s tickets. Their access also depends
            on their role.
          </CardBody>
          <CardNumber>{brand.teamMembers}</CardNumber>
          <OutboundLink href="#" onClick={(event) => event.preventDefault()}>
            Manage brand membership
            <ExternalLinkIcon />
          </OutboundLink>
        </Card>
      </Page>
    </>
  )
}
