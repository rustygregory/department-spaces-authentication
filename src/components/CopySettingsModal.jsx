import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { Combobox, Field as ComboField, Option } from '@zendeskgarden/react-dropdowns'
import { BRANDS, saveBrandAuth } from '../data/brands'

/* Modal that copies one brand's end-user auth settings into another.
 *
 * `targetBrand` — the brand to copy INTO (the row the overflow menu was on)
 * `onClose`     — called to close without saving
 * `onSaved`     — called after saving, so the table can re-render
 */

const listboxHeightFor = (rows) => `${rows * 36 + 8}px`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(10, 13, 14, 0.5);
`

const Dialog = styled.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 80px);
  margin: 0 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 48px rgba(10, 13, 14, 0.32);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #eae9e8;
  flex-shrink: 0;
`

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2f3130;
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 4px;
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

const ModalBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
`

const SourceLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #2f3130;
  margin-bottom: 8px;
`

/* The Combobox needs a Field wrapper for its internal context. No visible label
   here — `SourceLabel` above is doing that job. */
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

const ModalFooter = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  padding: 16px 24px;
  border-top: 1px solid #eae9e8;
`

const GoBackButton = styled.button`
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

/* The settings preview under the dropdown — derived from the source brand so
   it updates as soon as the user picks a different one. */
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

export default function CopySettingsModal({ targetBrand, onClose, onSaved }) {
  /* All 50 other brands, alphabetical, built once per target. */
  const sourceBrands = useMemo(
    () => [...BRANDS].filter((b) => b.id !== targetBrand.id).sort((a, b) => a.name.localeCompare(b.name)),
    [targetBrand.id],
  )

  const [sourceBrand, setSourceBrand] = useState(sourceBrands[0])
  const [query, setQuery] = useState('')

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? sourceBrands.filter((b) => b.name.toLowerCase().includes(needle)) : sourceBrands
  }, [sourceBrands, query])

  /* Escape to close. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  /* Prevent the page from scrolling while the modal is open. */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleSave = useCallback(() => {
    saveBrandAuth(targetBrand.id, { ...sourceBrand.auth })
    onSaved({ sourceName: sourceBrand.name, targetName: targetBrand.name })
    onClose()
  }, [targetBrand.id, targetBrand.name, sourceBrand.auth, sourceBrand.name, onSaved, onClose])

  /* Stop clicks inside the dialog reaching the overlay's onClose. */
  const stopProp = useCallback((e) => e.stopPropagation(), [])

  return createPortal(
    <Overlay onClick={onClose}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-modal-title"
        onClick={stopProp}
      >
        <ModalHeader>
          <ModalTitle id="copy-modal-title">Copy settings to {targetBrand.name}</ModalTitle>
          <CloseButton aria-label="Close" onClick={onClose}>
            ✕
          </CloseButton>
        </ModalHeader>

        <ModalBody>
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
        </ModalBody>

        <ModalFooter>
          <GoBackButton onClick={onClose}>Go back</GoBackButton>
          <SaveButton onClick={handleSave}>Save settings</SaveButton>
        </ModalFooter>
      </Dialog>
    </Overlay>,
    document.body,
  )
}
