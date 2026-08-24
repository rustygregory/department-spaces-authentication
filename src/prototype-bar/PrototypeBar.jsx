import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

/**
 * The prototype info bar: a strip of *our* chrome above the product's chrome.
 *
 * Everything a reviewer needs that isn't part of the design lives here — what
 * they're looking at, which version of it, and the way in to commenting. The
 * reason it's a band of its own rather than something floated over the app is
 * that a prototype has two audiences at once: the design, which has to be seen
 * exactly as designed, and the reviewer, who needs controls the design doesn't
 * have. Overlaying the second on the first always costs something — the option
 * switcher used to sit on the Zendesk top bar, where it read as a Zendesk
 * feature, and the Comment button sat over the bottom-left corner of the page.
 * Neither covers anything now.
 *
 * Deliberately not Garden and deliberately not Flora colours: this bar is not
 * part of the product being reviewed, and it should be impossible to mistake for
 * it. Dark, compact, and visually outside.
 *
 * Built to the component sheet Rusty drew: slate band, white title, grey meta after a
 * hairline divider, and two light pill buttons at the right — the switcher and Comment.
 * The hexes below are read off that PNG by eye rather than from a token list, so they're
 * approximations of it; the shapes and spacing are not.
 *
 * Host-agnostic on purpose — it knows nothing about brands, options or comments:
 * - `title` / `meta`      what this is, and its version or date
 * - `versions`            [{ id, label }] for the switcher; omit for no switcher
 * - `commentSlotRef`      callback ref for the right-hand slot the comment
 *                         toggle is portalled into (see CommentLayer's
 *                         `toggleContainer`); omit and nothing renders there
 */

const BAR_HEIGHT = 52

/* Above the comment layer (9000–9003), which is the one thing that would
   otherwise swallow clicks on the version menu: comment mode's click-catcher
   covers the work area, and this menu opens down over it. The bar has to keep
   working with comment mode on — it's where the way out of comment mode is. */
const MENU_Z = 9500

const Bar = styled.header`
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: ${BAR_HEIGHT}px;
  padding: 0 16px 0 20px;
  background-color: #313739;
  color: #ffffff;
  font-size: 14px;
`

const Titles = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
`

const Title = styled.span`
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Meta = styled.span`
  flex-shrink: 0;
  color: #8d9391;
  font-size: 13px;
  white-space: nowrap;

  /* A rule rather than a literal "|", so the divider can't be selected or read
     out as text. */
  &::before {
    content: '';
    display: inline-block;
    width: 1px;
    height: 12px;
    margin-right: 10px;
    background-color: #4c5254;
    vertical-align: -1px;
  }
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`

const ControlGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

/* The switcher's button. Three things Rusty asked for, all in here:
   it carries the **whole title** of the selected option rather than "Option 2", and
   it's sized to that title — `inline-flex` with no width, so the pill is exactly as
   wide as the words plus its padding, however long they are. The chevron sits at the
   right end of the pill, after the title. And there is no "Option" label beside it any
   more: the title starts with the word Option, so the label was saying it twice.
   `versionLabel` lives on now only as the menu's accessible name.

   Light pill on the slate band, per the component sheet — the same treatment the
   Comment button next to it gets (its `$inline` branch in CommentLayer). Consequence
   worth knowing: the pill's width changes with the selection, so the Comment button
   shifts a little when the option changes. Sizing it to the longest of the three titles
   instead would hold it still, at the cost of dead space in the pill on the short ones. */
const Trigger = styled.button`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  padding: 0 16px;
  border: 0;
  /* Fully round, whatever the height — a pill, not a rounded rectangle. */
  border-radius: 999px;
  background-color: ${(props) => (props.$open ? '#bfc4c2' : '#ced2d0')};
  color: #22282a;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background-color: #bfc4c2;
  }
`

/* A drawn chevron rather than the "▾" glyph: the glyph renders at a different weight
   and baseline in every font it falls back to, and the sheet's is a stroked mark. */
const Chevron = styled.svg`
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  transform: ${(props) => (props.$open ? 'rotate(180deg)' : 'none')};
`

const ChevronDown = ({ $open }) => (
  <Chevron $open={$open} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    <path
      d="M2 4.25 6 8.25l4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Chevron>
)

/* White, because the options are prose — three sentence-long labels are far easier to
   compare on white than on the bar's own slate.

   `max-content` rather than a measured pixel width, which is what this used to carry:
   the browser fits the longest label exactly, and no number here can go stale when a
   label is edited. It's what stops the labels wrapping — the failure the old measurement
   existed to prevent. `min-width: 100%` keeps the panel from ever being narrower than
   the pill it hangs off, since the pill now holds a full title too. */
const Menu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: ${MENU_Z};
  box-sizing: border-box;
  width: max-content;
  min-width: 100%;
  padding: 4px;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 8px 24px rgba(10, 13, 14, 0.32);
`

const MenuItem = styled.button`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  border-radius: 6px;
  background-color: ${(props) => (props.$selected ? '#f3f6fb' : 'transparent')};
  color: #2f3130;
  font-family: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => (props.$selected ? '#e4eaf6' : '#f7f7f7')};
  }
`

/* Fixed-width so the labels line up whether or not a row is the selected one —
   an indent that only appears on one row makes the list look ragged. */
const Check = styled.span`
  flex-shrink: 0;
  width: 14px;
  color: #406cc4;
  font-size: 12px;
`

const ItemContent = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`

/* The "Option N" part — semi-bold. */
const ItemTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
`

/* Description sits on the same line, lighter. */
const ItemDesc = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #646864;
`

const CommentSlot = styled.div`
  display: flex;
  align-items: center;
`

export default function PrototypeBar({
  title,
  meta,
  versions,
  versionId,
  onVersionChange,
  versionLabel = 'Version',
  commentSlotRef,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const groupRef = useRef(null)

  const selected = versions?.find((entry) => entry.id === versionId)

  /* Close on a click anywhere else, and on Escape. Both are bound only while the
     menu is open, so the bar adds no listeners to the page at rest. */
  useEffect(() => {
    if (!isOpen) return undefined
    const onPointerDown = (event) => {
      if (!groupRef.current?.contains(event.target)) setIsOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    /* Capture phase: comment mode's click-catcher stops propagation on some
       clicks, and a bubble-phase listener would miss those and leave the menu
       open over the design. */
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  return (
    <Bar>
      <Titles>
        <Title>{title}</Title>
        {meta && <Meta>{meta}</Meta>}
      </Titles>
      <Controls>
        {versions?.length > 0 && (
          <ControlGroup ref={groupRef}>
            <Trigger
              type="button"
              $open={isOpen}
              onClick={() => setIsOpen((value) => !value)}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            >
              {selected?.label ?? versionLabel}
              <ChevronDown $open={isOpen} />
            </Trigger>
            {isOpen && (
              <Menu role="listbox" aria-label={versionLabel}>
                {versions.map((entry) => (
                  <MenuItem
                    key={entry.id}
                    type="button"
                    role="option"
                    aria-selected={entry.id === versionId}
                    $selected={entry.id === versionId}
                    onClick={() => {
                      setIsOpen(false)
                      if (entry.id !== versionId) onVersionChange?.(entry.id)
                    }}
                  >
                    <Check>{entry.id === versionId ? '✓' : ''}</Check>
                    <ItemContent>
                      <ItemTitle>{entry.label}</ItemTitle>
                      {entry.description && <ItemDesc>{entry.description}</ItemDesc>}
                    </ItemContent>
                  </MenuItem>
                ))}
              </Menu>
            )}
          </ControlGroup>
        )}
        {/* Empty in the markup: CommentLayer portals its toggle in here, so the
            button keeps all of its own state (unresolved count, active styling)
            and this bar stays ignorant of commenting. */}
        <CommentSlot ref={commentSlotRef} />
      </Controls>
    </Bar>
  )
}
