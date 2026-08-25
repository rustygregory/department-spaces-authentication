import { useCallback, useEffect, useMemo, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { Combobox, Field as ComboField, Option } from '@zendeskgarden/react-dropdowns'
import { BRANDS, saveBrandAuth } from '../data/brands'

/* Copy-settings side panel — position:fixed so its Combobox listbox never
 * touches the document layout. The push effect comes from a PanelSpacer in
 * App's ContentRow flex row, not from this panel being a flex item.
 *
 * Follows Flora's DrawerModal spec: border-radius 24px (xxl), 4px margins.
 *
 * `targetBrand` — the brand to copy INTO
 * `onClose`     — Cancel, × or Escape
 * `onSaved`     — called with { sourceName, targetName } then panel closes
 */

const PANEL_WIDTH = 380

const listboxHeightFor = (rows) => `${rows * 36 + 8}px`

const panelIn = keyframes`
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
`

const Panel = styled.div`
  position: fixed;
  top: ${(p) => p.$top ?? 0}px;
  right: 0;
  bottom: 0;
  width: ${PANEL_WIDTH}px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-left: 1px solid #eae9e8;
  animation: ${panelIn} 180ms ease-out;
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

/* The Combobox and confirm text live here — a non-scrolling zone. This is what
   stops the scroll-to-top bug: when Garden returns focus to the Combobox input
   after selection, the browser tries to scroll-into-view the input, but this
   container has no overflow so nothing moves. */
const PanelStatic = styled.div`
  flex-shrink: 0;
  padding: 20px 24px 0;
`

/* Only the settings summary scrolls — the controls above stay visible.
   padding-top: 12px is the gap between ConfirmText and the first summary group. */
const PanelBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 24px 20px;
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
  /* The 12px below this is handled by PanelBody's padding-top. */
  font-size: 14px;
  color: #646864;
`

const SummarySection = styled.div`
  /* 8px between groups; the first group needs no top margin since PanelBody
     padding-top already gives the 12px gap from ConfirmText. */
  & + & {
    margin-top: 8px;
  }
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

export default function CopySettingsPanel({ targetBrand, contentTop, onClose, onSaved }) {
  const sourceBrands = useMemo(
    () =>
      [...BRANDS]
        .filter((b) => b.id !== targetBrand.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [targetBrand.id],
  )

  const [sourceBrand, setSourceBrand] = useState(null)
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
    if (!sourceBrand) return
    saveBrandAuth(targetBrand.id, { ...sourceBrand.auth })
    onSaved({ sourceName: sourceBrand.name, targetName: targetBrand.name })
    onClose()
  }, [targetBrand.id, targetBrand.name, sourceBrand, onSaved, onClose])

  return (
    <Panel role="dialog" aria-modal="false" aria-labelledby="copy-panel-title" $top={contentTop}>
      <PanelHeader>
        <PanelTitle id="copy-panel-title">Copy settings to {targetBrand.name}</PanelTitle>
        <CloseButton aria-label="Close" onClick={onClose}>
          ✕
        </CloseButton>
      </PanelHeader>

      <PanelStatic>
        <SourceLabel>Choose a brand to copy settings from</SourceLabel>
        <BrandField>
          <Combobox
            isAutocomplete
            listboxAriaLabel="Brands"
            listboxMaxHeight={listboxHeightFor(10)}
            selectionValue={sourceBrand?.id}
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
              <Option key={b.id} value={b.id} label={b.name} isSelected={b.id === sourceBrand?.id}>
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
        {sourceBrand && (
          <ConfirmText>Copy these settings into {targetBrand.name}.</ConfirmText>
        )}
      </PanelStatic>

      <PanelBody>
        {sourceBrand && <SettingsSummary brand={sourceBrand} />}
      </PanelBody>

      <PanelFooter>
        <CancelButton onClick={onClose}>Cancel</CancelButton>
        <SaveButton onClick={handleSave}>Copy settings</SaveButton>
      </PanelFooter>
    </Panel>
  )
}
