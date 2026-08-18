import styled from 'styled-components'
import Breadcrumbs from './Breadcrumbs'

/* The top of every work-area page: breadcrumbs, then the title.
 *
 * One component, used by all of them, because the titles have to land in exactly the
 * same place — switching option, drilling into a brand or coming back should not make
 * the title hop up and down the page. Each screen used to carry its own header block
 * and its own padding, which is precisely how that drift starts.
 *
 * The geometry is fixed arithmetic rather than a stack of margins:
 *
 *   TOP_PAD (16) + CRUMB_HEIGHT (18) + CRUMB_GAP (6) = TITLE_TOP (40)
 *
 * 40px from the top of the work area to the top of the title, per Rusty, and DESC_GAP
 * (4) from the bottom of the title to the page description under it — also per Rusty,
 * and also owned here rather than as a margin on each page's own description, which is
 * how three pages ended up at 4px, 4px and 8px.
 *
 * The breadcrumb row keeps its 18px whether or not there are crumbs to put in it, so a
 * page without them doesn't pull its title up to where no other page's title is. Change
 * TITLE_TOP and the padding follows.
 */

const TITLE_TOP = 40
const CRUMB_HEIGHT = 18
const CRUMB_GAP = 6
const TOP_PAD = TITLE_TOP - CRUMB_HEIGHT - CRUMB_GAP

/* Title bottom → description top. Box to box, which is the number you read in dev
   tools; the title's 36px line-height on a 28px font leaves ~4px of half-leading below
   the glyphs, so the *optical* gap is a little more than 4. Don't subtract it — the
   measurement Rusty asked for is the element one. */
const DESC_GAP = 4

export const SIDE_PAD = 32

const Wrap = styled.div`
  box-sizing: border-box;
  padding: ${TOP_PAD}px ${SIDE_PAD}px 0;
  flex-shrink: 0;
`

/* Fixed height, always rendered — this is the space that keeps every title aligned. */
const CrumbSlot = styled.div`
  height: ${CRUMB_HEIGHT}px;
  margin-bottom: ${CRUMB_GAP}px;
`

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
`

const Lead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
  min-width: 0;
`

const TitleBlock = styled.div`
  min-width: 0;
`

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

/* Regular weight, per Rusty — not the 700 these titles were carrying. Deliberately not
   Garden's XXL: that component brings its own weight and margins, and the point of this
   file is that the title's size and position live in one place. */
const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 400;
  line-height: 36px;
  color: #2f3130;
`

// A subdomain under a brand's name is the same relationship as a description under a
// title, so it takes the same gap rather than a second number.
const Subtitle = styled.div`
  font-size: 14px;
  color: #646864;
  margin-top: ${DESC_GAP}px;
`

/* Everything under the title block — the page description, and on the settings page the
   channel tab strip below it. The gap lives here so no page can set its own. */
const Below = styled.div`
  margin-top: ${DESC_GAP}px;
`

const ActionSlot = styled.div`
  display: flex;
  gap: 12px;
  flex-shrink: 0;
`

/**
 * @param breadcrumbs  [{ label, onClick? }] — the row is reserved even without them
 * @param title        the page title
 * @param titleBefore  something to the left of the title block, e.g. a brand's logo
 * @param titleAfter   something beside the title itself, e.g. a status tag
 * @param subtitle     a line under the title, indented with it rather than under
 *                     `titleBefore` — a brand's subdomain sits here
 * @param actions      right-aligned buttons on the title row
 * @param children     anything under the title block: a description, a tab strip. It
 *                     lands DESC_GAP below the title, so a description passed here
 *                     needs no margin of its own.
 */
export default function PageHeader({
  breadcrumbs,
  title,
  titleBefore,
  titleAfter,
  subtitle,
  actions,
  children,
}) {
  return (
    <Wrap>
      <CrumbSlot>{breadcrumbs && <Breadcrumbs items={breadcrumbs} />}</CrumbSlot>
      <TitleRow>
        <Lead>
          {titleBefore}
          <TitleBlock>
            <NameRow>
              <Title>{title}</Title>
              {titleAfter}
            </NameRow>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </TitleBlock>
        </Lead>
        {actions && <ActionSlot>{actions}</ActionSlot>}
      </TitleRow>
      {children && <Below>{children}</Below>}
    </Wrap>
  )
}
