import styled from 'styled-components'

/* Admin Center's Account sub-nav, reproduced from the reference screenshots.
 *
 * Same styling contract as custom-roles-all-plans' AdminCenterNav — 240px panel,
 * page title above the sections, grey section headers, dark pill on the active
 * item — with one detail those screenshots show and that component doesn't have: a
 * hairline rule running from each section header to the right edge of the panel.
 *
 * Every item in the real page is listed, in the real order, because the question
 * Option 3 asks is *where in this list does end-user auth live* — a nav trimmed to
 * the two items that work would remove the context that makes the question worth
 * asking. Only those two respond to a click; the rest are inert and say so by not
 * changing the cursor.
 */

const NavPanel = styled.nav`
  box-sizing: border-box;
  width: 240px;
  min-width: 240px;
  background: transparent;
  overflow-y: auto;
  padding: 16px 12px 32px;
  height: 100%;
`

const PageTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #2f3130;
  padding: 4px 12px 12px;
`

/* The rule runs to the right edge of the panel rather than stopping at the label,
   which is what the screenshots show: a caption with a line trailing off it. */
const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px 4px;
  margin-top: ${(p) => (p.$first ? '4px' : '20px')};
  font-size: 12px;
  font-weight: 600;
  color: #68737d;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e9ebed;
  }
`

const NavItem = styled.div`
  padding: 7px 12px;
  margin: 1px 0;
  border-radius: 6px;
  font-size: 14px;
  color: ${(p) => (p.$active ? '#ffffff' : '#2f3130')};
  font-weight: ${(p) => (p.$active ? 500 : 400)};
  background: ${(p) => (p.$active ? '#2f3130' : 'transparent')};
  cursor: ${(p) => (p.$clickable ? 'pointer' : 'default')};

  &:hover {
    background: ${(p) => (p.$clickable && !p.$active ? '#f1f3f5' : p.$active ? '#2f3130' : 'transparent')};
  }
`

const SECTIONS = [
  { title: 'Billing', items: ['Subscription', 'Contacts'] },
  {
    title: 'Usage',
    items: [
      'Summary',
      'Storage',
      'API',
      'AI and bots',
      'Automated resolutions',
      'Conversations',
      'Overage',
      'Features',
    ],
  },
  {
    title: 'Security',
    items: [
      'Security overview',
      'Team member authentication',
      'End user authentication',
      'Single sign-on',
      'Deletion schedules',
      'Redaction suggestions',
      'Advanced encryption',
      'Advanced',
      'More settings',
    ],
  },
  { title: 'Brand management', items: ['Brands', 'Brand membership'] },
]

/**
 * @param activeItem  which label wears the dark pill
 * @param onSelect    called with 'End user authentication' or 'Brands'
 * @param brandsEnabled  Brands is only a destination in Option 3; in the other two
 *   the brand dimension lives inside the auth page, so making it clickable would
 *   offer a screen that option doesn't have.
 */
export default function AdminCenterNav({ activeItem, onSelect, brandsEnabled = false }) {
  const isClickable = (label) =>
    label === 'End user authentication' || (label === 'Brands' && brandsEnabled)

  return (
    <NavPanel>
      <PageTitle>Account</PageTitle>
      {SECTIONS.map((section, index) => (
        <div key={section.title}>
          <SectionHeader $first={index === 0}>{section.title}</SectionHeader>
          {section.items.map((label) => (
            <NavItem
              key={label}
              $active={label === activeItem}
              $clickable={isClickable(label)}
              onClick={isClickable(label) ? () => onSelect(label) : undefined}
            >
              {label}
            </NavItem>
          ))}
        </div>
      ))}
    </NavPanel>
  )
}
