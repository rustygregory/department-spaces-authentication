import styled from 'styled-components'
import { Anchor } from '@zendeskgarden/react-buttons'
import { MD } from '@zendeskgarden/react-typography'
import PageHeader from './PageHeader'

/* Option 3: what's left at Account › Security › End user authentication once the
 * settings move into Brands.
 *
 * A signpost rather than a redirect. Admins have this page bookmarked, linked from
 * help articles, and in muscle memory, so it keeps existing and says where the
 * thing went. Deliberately one sentence and one link — no settings, no summary
 * table — because anything more would make it look like a page you can still work
 * on, which is the failure mode this option has to avoid.
 */

const Body = styled.div`
  padding: 24px 32px 32px;
`

const Message = styled(MD)`
  color: #2f3130;
`

/* Blue and underlined, as Rusty specified. Garden's Anchor is already the primary
   blue; the underline is the part that isn't the default. */
const ViewBrandsLink = styled(Anchor)`
  display: inline-block;
  margin-top: 12px;
  text-decoration: underline;
  font-size: 14px;
`

export default function EuaMovedPage({ onViewBrands }) {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Account' },
          { label: 'Security' },
          { label: 'End user authentication' },
        ]}
        title="End user authentication"
      />

      <Body>
        <Message>End user authentication is now located in brands.</Message>
        <ViewBrandsLink
          href="#"
          onClick={(event) => {
            event.preventDefault()
            onViewBrands()
          }}
        >
          View brands
        </ViewBrandsLink>
      </Body>
    </>
  )
}
