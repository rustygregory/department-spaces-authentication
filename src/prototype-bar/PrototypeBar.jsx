import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

/**
 * Reviewer chrome: a compact dark strip above the product prototype.
 *
 * Keeps prototype identity (title + meta) and controls (version switcher,
 * comment toggle) visible without interfering with the design being reviewed.
 *
 * Visual language matches the organization-hierarchy prototype bar — very dark
 * band, outlined controls, pipe separator, dark dropdown menu.
 *
 * Host-agnostic — knows nothing about brands, options or comments:
 *   title / meta          what this is and its version or date
 *   versions              [{ id, label, description?, archived? }] for the switcher
 *   versionId             which entry is currently selected
 *   onVersionChange       called with the new id when the user picks one
 *   commentSlotRef        callback ref for a CommentLayer portal target
 */

export const BAR_HEIGHT = 48

/* Above the comment layer (9000–9003) so the menu stays clickable with comment
   mode on — the bar is also where the way OUT of comment mode is. */
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
  padding: 0 16px;
  background-color: #1a1f24;
  color: #ffffff;
  font-family: inherit;
  user-select: none;
`

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`

const Title = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Pipe = styled.span`
  flex-shrink: 0;
  color: #363d44;
  font-size: 13px;
  line-height: 1;
`

const Meta = styled.span`
  flex-shrink: 0;
  color: #7c8590;
  font-size: 12px;
  white-space: nowrap;
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const DropdownWrapper = styled.div`
  position: relative;
`

const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid ${(p) => (p.$open ? '#555e66' : '#363d44')};
  border-radius: 4px;
  background: ${(p) => (p.$open ? '#262c32' : 'transparent')};
  color: #c8cdd0;
  font-family: inherit;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background-color: #262c32;
    border-color: #555e66;
    color: #ffffff;
  }
`

/* Label and description side by side in the trigger. */
const TriggerContent = styled.div`
  display: flex;
  align-items: baseline;
  gap: 7px;
`

const TriggerLabel = styled.span`
  font-weight: 600;
`

const TriggerDesc = styled.span`
  font-weight: 400;
  color: #7c8590;
  font-size: 12px;
`

/* Filled downward triangle, matches org-hierarchy's CaretIcon. Flips when open. */
const Caret = styled.svg`
  flex-shrink: 0;
  transform: ${(p) => (p.$open ? 'rotate(180deg)' : 'none')};
`

const CaretIcon = ({ $open }) => (
  <Caret $open={$open} width="8" height="5" viewBox="0 0 8 5" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M0 0 L4 5 L8 0 Z" />
  </Caret>
)

/* Dark dropdown — grows to fit its longest item (width: max-content), never wraps. */
const Menu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: ${MENU_Z};
  padding: 4px 0;
  border: 1px solid #363d44;
  border-radius: 4px;
  background-color: #262c32;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  width: max-content;
`

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 14px;
  border: 0;
  background: ${(p) => (p.$selected ? '#323b44' : 'transparent')};
  color: ${(p) => (p.$selected ? '#ffffff' : '#c8cdd0')};
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background-color: #323b44;
    color: #ffffff;
  }
`

/* Fixed-width so item text lines up whether or not the row is selected. */
const Check = styled.span`
  flex-shrink: 0;
  width: 12px;
  color: #6ba4e0;
  font-size: 11px;
`

const ItemContent = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`

const ItemTitle = styled.span`
  font-weight: 600;
`

const ItemDesc = styled.span`
  font-weight: 400;
  font-size: 12px;
  color: #7c8590;
`

const MenuDivider = styled.div`
  height: 1px;
  background: #363d44;
  margin: 4px 0;
`

const MenuSectionLabel = styled.div`
  padding: 5px 14px 2px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #555e66;
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
  const dropdownRef = useRef(null)

  const selected = versions?.find((v) => v.id === versionId)
  const activeVersions = versions?.filter((v) => !v.archived) ?? []
  const archivedVersions = versions?.filter((v) => v.archived) ?? []

  /* Close on outside click and Escape. Capture phase so comment mode's
     click-catcher (which stops propagation) can't swallow the close. */
  useEffect(() => {
    if (!isOpen) return undefined
    const onPointerDown = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setIsOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  return (
    <Bar>
      <Identity>
        <Title>{title}</Title>
        {meta && (
          <>
            <Pipe aria-hidden="true">|</Pipe>
            <Meta>{meta}</Meta>
          </>
        )}
      </Identity>

      <Controls>
        {versions?.length > 0 && (
          <DropdownWrapper ref={dropdownRef}>
            <Trigger
              type="button"
              $open={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            >
              <TriggerContent>
                <TriggerLabel>{selected?.label ?? versionLabel}</TriggerLabel>
                {selected?.description && <TriggerDesc>{selected.description}</TriggerDesc>}
              </TriggerContent>
              <CaretIcon $open={isOpen} />
            </Trigger>

            {isOpen && (
              <Menu role="listbox" aria-label={versionLabel}>
                {activeVersions.map((entry) => (
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

                {archivedVersions.length > 0 && (
                  <>
                    <MenuDivider />
                    <MenuSectionLabel>Archive</MenuSectionLabel>
                    {archivedVersions.map((entry) => (
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
                  </>
                )}
              </Menu>
            )}
          </DropdownWrapper>
        )}

        {/* CommentLayer portals its toggle button into this slot. */}
        <CommentSlot ref={commentSlotRef} />
      </Controls>
    </Bar>
  )
}
