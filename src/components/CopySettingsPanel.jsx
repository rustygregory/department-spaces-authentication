import { useCallback, useEffect, useMemo, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { Combobox, Field as ComboField, Option } from '@zendeskgarden/react-dropdowns'
import { Button } from '@zendeskgarden/react-buttons'
import { BRANDS, getBrand, saveBrandAuth } from '../data/brands'
import { RefreshIcon } from './icons'

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
  font-size: 14px;
  line-height: 20px;
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
   padding-top: 20px is the gap between the confirm row and the first summary group. */
const PanelBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
`

const SourceLabel = styled.div`
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
  color: #2f3130;
  margin-bottom: 8px;
`

const BrandField = styled(ComboField)`
  width: 100%;
`

/* Row holding the confirm sentence and the refresh button side by side. */
const ConfirmRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
`

const ConfirmText = styled.div`
  font-size: 14px;
  line-height: 20px;
  color: #2f3130;
`


const SummarySection = styled.div`
  /* 20px between groups, as margin on the later group only so neighbours never
     stack to 40px; the first group needs none since PanelBody padding-top already
     gives the 20px gap from the confirm row. */
  & + & {
    margin-top: 20px;
  }
`

const SectionHeading = styled.div`
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
  color: #2f3130;
`

/* Plain lines under the heading, no bullets — still a list underneath so a screen
   reader announces how many providers there are. */
const ValueList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #2f3130;
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
          <ValueList>
            <li>{brand.auth.passwordLevel}</li>
          </ValueList>
        </SummarySection>
      )}
      {brand.auth.externalAuth && providers.length > 0 && (
        <SummarySection>
          <SectionHeading>External authentication</SectionHeading>
          <ValueList>
            {providers.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ValueList>
        </SummarySection>
      )}
      <SummarySection>
        <SectionHeading>How end users sign in</SectionHeading>
        <ValueList>
          <li>{brand.auth.signInMode === 'sso' ? 'Redirect to SSO' : 'Let them choose'}</li>
        </ValueList>
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

  /* Re-read the source brand from the shared roster. saveBrandAuth mutates the
     object in-place so the auth values are current, but React only re-renders
     when state changes — spreading into a new object gives it a new reference. */
  const [justRefreshed, setJustRefreshed] = useState(false)

  const handleRefresh = useCallback(() => {
    if (!sourceBrand) return
    const fresh = getBrand(sourceBrand.id)
    if (fresh) setSourceBrand({ ...fresh })
    setJustRefreshed(true)
  }, [sourceBrand])

  /* The re-read usually finds nothing new, so without a sign it looks like the button
     did nothing. "Refreshed" for a moment says it ran. */
  useEffect(() => {
    if (!justRefreshed) return
    const timer = setTimeout(() => setJustRefreshed(false), 1500)
    return () => clearTimeout(timer)
  }, [justRefreshed])

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
        <SourceLabel>Copy settings from</SourceLabel>
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
          <ConfirmRow>
            <ConfirmText>Copy these settings into {targetBrand.name}.</ConfirmText>
            <Button size="small" onClick={handleRefresh}>
              <Button.StartIcon><RefreshIcon /></Button.StartIcon>
              {justRefreshed ? 'Refreshed' : 'Refresh'}
            </Button>
          </ConfirmRow>
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
