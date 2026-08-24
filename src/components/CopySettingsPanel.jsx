import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import { Combobox, Field as ComboField, Option } from '@zendeskgarden/react-dropdowns'
import { BRANDS, saveBrandAuth } from '../data/brands'

/* Side panel for copying one brand's end-user auth settings into another.
 *
 * Follows Flora's DrawerModal spec:
 *   border-radius: 24px (Flora xxl)
 *   margin: 4px from viewport edges (Flora xxs)
 *   no border, card shadow
 *
 * No backdrop — the table behind it stays interactive, so a reviewer can look
 * at another brand's row while deciding what to copy. The panel closes on
 * Cancel, the × button, or Escape.
 *
 * `targetBrand` — the brand to copy INTO (the row the overflow menu was on)
 * `onClose`     — called to close without saving
 * `onSaved`     — called with { sourceName, targetName } after saving
 */

const BAR_HEIGHT = 52
const PANEL_WIDTH = 380
/* Flora xxs = 4px — the margin the DrawerModal override sets on all sides. */
const FLORA_MARGIN = 4

const listboxHeightFor = (rows) => `${rows * 36 + 8}px`

const slideIn = keyframes`
  from { transform: translateX(calc(100% + ${FLORA_MARGIN * 2}px)); }
  to   { transform: translateX(0); }
`

/* The panel sits above Garden's own overlays (~400) and the work-area content,
   but below the prototype bar's menu (9500) and the comment layer (9000). */
const Panel = styled.div`
  position: fixed;
  top: ${BAR_HEIGHT + FLORA_MARGIN}px;
  right: ${FLORA_MARGIN}px;
  bottom: ${FLORA_MARGIN}px;
  width: ${PANEL_WIDTH}px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 4px 32px rgba(10, 13, 14, 0.2);
  animation: ${slideIn} 180ms ease-out;
`

const PanelHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #eae9e8;
`

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2f3130;
  /* The brand name can be long; truncate rather than wrap so the close button
     always has room. */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CloseButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: 8px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #646864;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: #f3f4f3;
    color: #2f3130;
  }
`

const PanelBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
`

const SourceLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #2f3130;
  margin-bottom: 8px;
`

const BrandField = styled(ComboField)`
  width: 100%;
`

const ConfirmText = styled.div`
  margin-top: 16px;
  font-size: 14px;
  color: #646864;
`

const SummarySection = styled.div`
  margin-top: 16px;
`

const SectionHeading = styled.div`
  font-size: 14px;
  color: #2f3130;
`

const BulletList = styled.ul`
  margin: 4px 0 0;
  padding-left: 20px;
  font-size: 14px;
  color: #2f3130;
  line-height: 24px;
`

const PanelFooter = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  padding: 16px 24px;
  border-top: 1px solid #eae9e8;
`

const CancelButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: #2f3130;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const SaveButton = styled.button`
  min-height: 40px;
  padding: 0 24px;
  border: 0;
  border-radius: 999px;
  background-color: #2f3130;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background-color: #1f2120;
  }
`

function SettingsSummary({ brand }) {
  const providers = Object.entries(brand.auth.providers)
    .filter(([, on]) => on)
    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))

  return (
    <>
      {brand.auth.zendeskAuth && (
        <SummarySection>
          <SectionHeading>Zendesk authentication</SectionHeading>
          <BulletList>
            <li>{brand.auth.passwordLevel}</li>
          </BulletList>
        </SummarySection>
      )}
      {brand.auth.externalAuth && providers.length > 0 && (
        <SummarySection>
          <SectionHeading>External authentication</SectionHeading>
          <BulletList>
            {providers.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </BulletList>
        </SummarySection>
      )}
      <SummarySection>
        <SectionHeading>How end users sign in</SectionHeading>
        <BulletList>
          <li>{brand.auth.signInMode === 'sso' ? 'Redirect to SSO' : 'Let them choose'}</li>
        </BulletList>
      </SummarySection>
    </>
  )
}

export default function CopySettingsPanel({ targetBrand, onClose, onSaved }) {
  const sourceBrands = useMemo(
    () =>
      [...BRANDS]
        .filter((b) => b.id !== targetBrand.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [targetBrand.id],
  )

  const [sourceBrand, setSourceBrand] = useState(sourceBrands[0])
  const [query, setQuery] = useState('')

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? sourceBrands.filter((b) => b.name.toLowerCase().includes(needle)) : sourceBrands
  }, [sourceBrands, query])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSave = useCallback(() => {
    saveBrandAuth(targetBrand.id, { ...sourceBrand.auth })
    onSaved({ sourceName: sourceBrand.name, targetName: targetBrand.name })
    onClose()
  }, [targetBrand.id, targetBrand.name, sourceBrand.auth, sourceBrand.name, onSaved, onClose])

  return createPortal(
    <Panel role="dialog" aria-modal="false" aria-labelledby="copy-panel-title">
      <PanelHeader>
        <PanelTitle id="copy-panel-title">Copy settings to {targetBrand.name}</PanelTitle>
        <CloseButton aria-label="Close" onClick={onClose}>
          ✕
        </CloseButton>
      </PanelHeader>

      <PanelBody>
        <SourceLabel>Choose a brand to copy settings</SourceLabel>
        <BrandField>
          <Combobox
            isAutocomplete
            listboxAriaLabel="Brands"
            listboxMaxHeight={listboxHeightFor(10)}
            selectionValue={sourceBrand.id}
            onChange={({ selectionValue, inputValue, isExpanded }) => {
              if (selectionValue) {
                const found = sourceBrands.find((b) => b.id === selectionValue)
                if (found) setSourceBrand(found)
                setQuery('')
                return
              }
              if (isExpanded !== undefined) {
                setQuery('')
                return
              }
              if (inputValue !== undefined) setQuery(inputValue)
            }}
          >
            {matching.map((b) => (
              <Option key={b.id} value={b.id} label={b.name} isSelected={b.id === sourceBrand.id}>
                {b.name}
              </Option>
            ))}
            {matching.length === 0 && (
              <Option isDisabled value="none" label="No brands found">
                No brands found
              </Option>
            )}
          </Combobox>
        </BrandField>

        <ConfirmText>Copy these settings into {targetBrand.name}</ConfirmText>
        <SettingsSummary brand={sourceBrand} />
      </PanelBody>

      <PanelFooter>
        <CancelButton onClick={onClose}>Cancel</CancelButton>
        <SaveButton onClick={handleSave}>Save settings</SaveButton>
      </PanelFooter>
    </Panel>,
    document.body,
  )
}
