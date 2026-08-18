import styled from 'styled-components'

/* The breadcrumb trail above every page title.
 *
 * Adapted from custom-roles-all-plans' Breadcrumbs to state-based navigation —
 * there's no router here, so an item carries an `onClick` rather than a path.
 *
 * The colour rule comes from the reference screenshots and is not the usual "all
 * ancestors are links": on the account-level auth page every crumb is grey, because
 * none of them goes anywhere in Admin Center. A crumb turns blue only when it has
 * somewhere to go — Option 2's drill-down back to the table, Option 3's Brands
 * list. So the trail is honest about what's clickable instead of decorating three
 * dead words in link blue.
 */

/* No margin and a pinned line-height: PageHeader reserves an exact 18px row for this
   and owns the gap beneath it, which is what keeps every page title at the same
   height. `flex-wrap` is gone with it — a trail that wrapped to two lines would push
   its own title down and undo that. None of the trails here come close. */
const Trail = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
`

/* A crumb that goes somewhere is blue and underlined *at rest*, per the brand-page
   screenshot — not underlined on hover only. That's what distinguishes it from the grey
   ancestors beside it at a glance. */
const Crumb = styled.span`
  color: ${(p) => (p.$link ? '#1f73b7' : '#68737d')};
  cursor: ${(p) => (p.$link ? 'pointer' : 'default')};
  text-decoration: ${(p) => (p.$link ? 'underline' : 'none')};

  &:hover {
    color: ${(p) => (p.$link ? '#144a75' : '#68737d')};
  }
`

const Current = styled.span`
  color: #2f3130;
`

const Separator = styled.span`
  color: #87929d;
`

/**
 * @param items  [{ label, onClick? }] — the last item renders as the current page.
 */
export default function Breadcrumbs({ items }) {
  return (
    <Trail aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {index > 0 && <Separator>&gt;</Separator>}
            {isLast ? (
              <Current>{item.label}</Current>
            ) : (
              <Crumb $link={Boolean(item.onClick)} onClick={item.onClick}>
                {item.label}
              </Crumb>
            )}
          </span>
        )
      })}
    </Trail>
  )
}
