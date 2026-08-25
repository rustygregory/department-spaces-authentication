import { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Tabs, TabList, Tab, TabPanel } from '@zendeskgarden/react-tabs'
import { Field, Label, Hint, Checkbox, Radio } from '@zendeskgarden/react-forms'
import { Combobox, Field as ComboField, Label as ComboLabel, Option } from '@zendeskgarden/react-dropdowns'
import { Alert, Title } from '@zendeskgarden/react-notifications'
import { Anchor, Button } from '@zendeskgarden/react-buttons'
import { MD } from '@zendeskgarden/react-typography'
import PageHeader from './PageHeader'
import SaveToast from './SaveToast'
import { ExternalLinkIcon } from './icons'
import { BRANDS, PASSWORD_LEVELS, PASSWORD_RULES, saveBrandAuth } from '../data/brands'

/* The End user authentication settings screen — the one page all three options are
 * arguments about, so there is exactly one copy of it and the options differ by
 * props. Three copies would drift, and a difference between options that nobody
 * intended is the one thing that would make the comparison worthless.
 *
 * Layout is three bands rather than one scrolling column, which is what the
 * reference screenshots show: the second one has the password rules scrolled up
 * directly beneath the tab strip while the breadcrumb, title and tabs stay put, and
 * Cancel/Save still sit at the bottom of the window.
 *
 *   ┌ header ──────────── breadcrumbs, title, description, tab strip   (fixed)
 *   │ settings ────────── everything the admin sets                    (scrolls)
 *   └ action bar ──────── full-width divider, Cancel, Save             (fixed)
 */

// The settings column. Bounded rather than full-width: the tab strip's underline and
// the footer's divider both end where it does, which is what the screenshots show —
// a column of controls, not a page-wide form.
const COLUMN_WIDTH = 840
// Indent for controls that belong to the checkbox above them.
const NEST = 28

const Shell = styled(Tabs)`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`

/* There's no Header band of its own here: the fixed top band is `PageHeader`, which
   owns the padding that puts the title 40px below the top of the work area. Every other
   screen uses the same component, so the title doesn't move when you switch between
   them. */

const Column = styled.div`
  max-width: ${COLUMN_WIDTH}px;
`

/* The scrolling middle. `min-height: 0` is what lets it shrink inside the flex
   column instead of pushing the footer off the bottom of the window. */
const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 32px;
`

/* The pinned action bar, full-bleed. Rusty's standing rule: a bottom bar spans the
   bottom of the screen all the way to the right side — so the divider runs the whole
   width of the work area and Save sits 32px in from its right edge, rather than
   stopping where the 840px settings column does. (The reference screenshot, which
   predates Flora, shows the bounded version; this is the deliberate departure, and it
   matches the action bar in transaction-log.) */
const Footer = styled.div`
  box-sizing: border-box;
  flex-shrink: 0;
  border-top: 1px solid #eae9e8;
  padding: 16px 32px;
  display: flex;
  justify-content: flex-end;
  /* 20px between Cancel and Save, per Rusty. */
  gap: 20px;
`

/* Cancel keeps the link button's blue and drops the underline in every state. Garden
   emits `&:hover { text-decoration: underline }` for link buttons, which single-`&`
   specificity would only tie with, so this doubles it. */
const CancelButton = styled(Button)`
  &&,
  &&:hover,
  &&:active {
    text-decoration: none;
  }
`

const Description = styled(MD)`
  color: #646864;
`

const Strip = styled(TabList)`
  margin-top: 20px;
`

const Section = styled.div`
  margin-top: ${(p) => p.$top ?? 24}px;
`

const Nested = styled.div`
  margin-left: ${NEST}px;
`

const SubLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2f3130;
  margin-bottom: 4px;
`

const GroupHeading = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #2f3130;
  margin-bottom: 12px;
`

const Rules = styled.ul`
  margin: 12px 0 0;
  padding-left: 20px;
  color: #2f3130;
  font-size: 14px;
  line-height: 22px;
`

const Muted = styled.div`
  font-size: 14px;
  color: #646864;
`

const LevelField = styled(ComboField)`
  width: 200px;
`

/* Flora's info Alert is a flat grey block (neutral 200, no border). The reference
   screenshot — taken before Flora landed — shows a lighter fill with a hairline
   border, so these two lines bring it back to the screenshot while leaving the
   component, its icon placement and its geometry to Flora. Worth knowing which of
   the two you're looking at before "fixing" either. */
const InfoAlert = styled(Alert)`
  max-width: 620px;
  background-color: #f7f7f7;
  border: 1px solid #eae9e8;
`

const AlertBody = styled.div`
  font-size: 14px;
  color: #2f3130;
  margin-top: 2px;
`

// Links that leave Admin Center. Underlined at rest, as in the reference.
const OutboundLink = styled(Anchor)`
  display: inline-flex;
  align-items: center;
  text-decoration: underline;
`

const RadioRow = styled(Field)`
  & + & {
    margin-top: 16px;
  }
`

/* The channel tabs. Only the first has content — Rusty scoped Messaging and LLM as
   a channel out of this prototype — so selection is fixed and `onChange` is a
   deliberate no-op. They are rendered rather than dropped because their presence is
   part of what the page looks like, and because "which tab does per-brand auth
   belong on" is a question a reviewer may well raise. Not `disabled`: a greyed tab
   would say the channel is unavailable, which isn't the claim. */
const CHANNEL_TABS = [
  { item: 'tickets', label: 'Tickets, help center, and community' },
  { item: 'messaging', label: 'Messaging' },
  { item: 'llm', label: 'LLM as a channel' },
]

const listboxHeightFor = (rows) => `${rows * 36 + 8}px`

/* The brand menu in alphabetical order, per Rusty. Sorted here rather than in the roster:
   the roster's order is its own — Dinoco and Rusteze lead it because they're the two brands
   that actually exist in staging, which is what makes the reference screenshots line up
   with the prototype, and `BRANDS[0]` is the brand every option opens on. A menu of 51 is
   a different job from a roster of 51: nobody scans it for the order it was written in. */
const BRANDS_BY_NAME = [...BRANDS].sort((a, b) => a.name.localeCompare(b.name))

/**
 * @param brand        the brand whose settings are shown
 * @param breadcrumbs  [{ label, onClick? }] — omitted inside a brand's own tab,
 *                     where the brand page above it already carries the trail
 * @param title        page title; the brand drill-down uses "[Brand] end user authentication"
 * @param showBrandMenu  Option 1 only — the brand switcher at the top of the settings
 * @param onBrandChange  called with a brand id when the switcher moves
 */
export default function EndUserAuthPage({
  brand,
  breadcrumbs,
  title = 'End user authentication',
  showBrandMenu = false,
  onBrandChange,
  toastTop,
}) {
  /* Settings are local state seeded from the brand, and re-seeded when the brand
     changes. That reset is the point of the option-1 switcher: picking another brand
     has to show *that brand's* settings, not the previous brand's edits wearing a
     new name. Nothing persists past a reload, which is standard for these
     prototypes. */
  const [zendeskAuth, setZendeskAuth] = useState(brand.auth.zendeskAuth)
  const [passwordLevel, setPasswordLevel] = useState(brand.auth.passwordLevel)
  const [externalAuth, setExternalAuth] = useState(brand.auth.externalAuth)
  const [providers, setProviders] = useState(brand.auth.providers)
  const [signInMode, setSignInMode] = useState(brand.auth.signInMode)

  /* Also what Cancel does: go back to the brand's saved values. A Cancel that did nothing,
     sitting next to a Save that commits, would be the odd one out. */
  const revert = useCallback(() => {
    setZendeskAuth(brand.auth.zendeskAuth)
    setPasswordLevel(brand.auth.passwordLevel)
    setExternalAuth(brand.auth.externalAuth)
    setProviders(brand.auth.providers)
    setSignInMode(brand.auth.signInMode)
  }, [brand])

  useEffect(revert, [revert])

  /* Save keeps the reader on the brand they're looking at — Rusty's ask — and says so with
     a toast rather than by navigating somewhere. `saves` is a counter, not a flag: saving
     twice has to give the second toast its own four seconds, and a flag that's already true
     wouldn't restart the timer. */
  const [saves, setSaves] = useState(0)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    saveBrandAuth(brand.id, {
      zendeskAuth,
      passwordLevel,
      externalAuth,
      providers,
      signInMode,
    })
    setSaves((count) => count + 1)
    setIsSaved(true)
  }

  const dismissToast = useCallback(() => setIsSaved(false), [])

  /* The brand switcher's typed filter. Garden's Combobox doesn't narrow its own
     options — it reports what was typed and leaves the list to the caller — so this
     is what makes the search dynamic across all 51 brands. Filtering an
     already-alphabetical list keeps it alphabetical, so there's nothing to re-sort. */
  const [brandQuery, setBrandQuery] = useState('')
  const matchingBrands = useMemo(() => {
    const needle = brandQuery.trim().toLowerCase()
    return needle
      ? BRANDS_BY_NAME.filter((option) => option.name.toLowerCase().includes(needle))
      : BRANDS_BY_NAME
  }, [brandQuery])

  const toggleProvider = (key) => setProviders((current) => ({ ...current, [key]: !current[key] }))

  return (
    <Shell selectedItem="tickets" onChange={() => {}}>
      <PageHeader breadcrumbs={breadcrumbs} title={title}>
        <Column>
          <Description>Choose at least one method for authenticating end users.</Description>
          <Strip>
            {CHANNEL_TABS.map((tab) => (
              <Tab key={tab.item} item={tab.item}>
                {tab.label}
              </Tab>
            ))}
          </Strip>
        </Column>
      </PageHeader>

      <Scroll>
        <TabPanel item="tickets">
          <Column>
            {showBrandMenu && (
              /* Option 1's whole argument: one page, and the brand is a control on
                 it. 51 brands with a typed filter, ten rows visible so the list
                 scrolls — a reviewer needs to feel the scrolling to judge whether a
                 dropdown is the right home for a per-brand setting. */
              <Section $top={20}>
                <LevelField style={{ width: '320px' }}>
                  {/* The roster's size, not the filtered count — it labels what the
                      menu holds, so it shouldn't drop to "3 Brands" while someone is
                      typing. It's also the number that makes Option 1's case worth
                      arguing about, which is why it's in the label at all. */}
                  <ComboLabel>{BRANDS.length} Brands</ComboLabel>
                  <Combobox
                    isAutocomplete
                    listboxAriaLabel="Brands"
                    listboxMaxHeight={listboxHeightFor(10)}
                    selectionValue={brand.id}
                    onChange={({ selectionValue, inputValue, isExpanded }) => {
                      /* Selection first and then stop: a single change can carry
                         both a selection and the input text Garden just wrote into
                         the field, and treating that text as a search would leave
                         the list filtered down to the one brand just chosen. */
                      if (selectionValue) {
                        setBrandQuery('')
                        onBrandChange?.(selectionValue)
                        return
                      }
                      // Opening or closing starts from the full list, not from
                      // whatever was typed last time.
                      if (isExpanded !== undefined) {
                        setBrandQuery('')
                        return
                      }
                      if (inputValue !== undefined) setBrandQuery(inputValue)
                    }}
                  >
                    {/* `isSelected` is what puts the brand's name in the field on
                        landing. Garden takes the input's initial text from whichever
                        *option* is flagged selected — not from `selectionValue` — so with
                        only the controlled value below, the field sat empty until someone
                        picked a brand, even though a brand was already loaded. */}
                    {matchingBrands.map((option) => (
                      <Option
                        key={option.id}
                        value={option.id}
                        label={option.name}
                        isSelected={option.id === brand.id}
                      >
                        {option.name}
                      </Option>
                    ))}
                    {matchingBrands.length === 0 && (
                      <Option isDisabled value="none" label="No brands found">
                        No brands found
                      </Option>
                    )}
                  </Combobox>
                </LevelField>
              </Section>
            )}

            <Section $top={showBrandMenu ? 28 : 24}>
              <Field>
                <Checkbox checked={zendeskAuth} onChange={() => setZendeskAuth((on) => !on)}>
                  <Label>Zendesk authentication</Label>
                  <Hint>End users will sign in with an email and password.</Hint>
                </Checkbox>
              </Field>

              {/* Password level belongs to the checkbox above it, so unchecking Zendesk
                  authentication takes the whole block out of the page rather than greying
                  it — there's no password to set a level for, and everything below slides
                  up into the space. Per Rusty. The level itself stays in state, so
                  re-checking the box brings the same value back rather than a default. */}
              {zendeskAuth && (
                <Nested style={{ marginTop: '16px' }}>
                  <SubLabel>Password level</SubLabel>
                  <LevelField>
                    <Combobox
                      isEditable={false}
                      listboxAriaLabel="Password levels"
                      inputValue={passwordLevel}
                      selectionValue={passwordLevel}
                      onChange={({ selectionValue }) => {
                        if (selectionValue) setPasswordLevel(selectionValue)
                      }}
                    >
                      {PASSWORD_LEVELS.map((level) => (
                        <Option key={level} value={level} label={level}>
                          {level}
                        </Option>
                      ))}
                    </Combobox>
                  </LevelField>
                  {/* Derived from the level, so moving the dropdown visibly changes the
                      rules rather than leaving three sentences that contradict it. */}
                  <Rules>
                    {PASSWORD_RULES[passwordLevel].map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </Rules>
                </Nested>
              )}
            </Section>

            <Section $top={28}>
              <Field>
                <Checkbox checked={externalAuth} onChange={() => setExternalAuth((on) => !on)}>
                  <Label>External authentication</Label>
                  <Hint>End users can sign in using third-party services.</Hint>
                </Checkbox>
              </Field>

              <Nested style={{ marginTop: '16px' }}>
                <InfoAlert type="info">
                  <Title>Keep Zendesk authentication active as a backup</Title>
                  <AlertBody>
                    If external authentication goes down, end users will have another way to sign in.
                  </AlertBody>
                  <div style={{ marginTop: '4px' }}>
                    <OutboundLink href="#" onClick={(event) => event.preventDefault()}>
                      Learn about external authentication down time
                      <ExternalLinkIcon />
                    </OutboundLink>
                  </div>
                </InfoAlert>

                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '14px', color: '#2f3130' }}>Single sign-on (SSO)</div>
                  <Muted>Requires configuration to enable</Muted>
                  <OutboundLink href="#" onClick={(event) => event.preventDefault()}>
                    Configure SSO
                    <ExternalLinkIcon />
                  </OutboundLink>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Field>
                    <Checkbox checked={providers.google} onChange={() => toggleProvider('google')}>
                      <Label>Google</Label>
                    </Checkbox>
                  </Field>
                  <Field>
                    <Checkbox checked={providers.microsoft} onChange={() => toggleProvider('microsoft')}>
                      <Label>Microsoft</Label>
                    </Checkbox>
                  </Field>
                  <Field>
                    <Checkbox checked={providers.facebook} onChange={() => toggleProvider('facebook')}>
                      <Label>Facebook</Label>
                    </Checkbox>
                  </Field>
                </div>
              </Nested>
            </Section>

            <Section $top={32} style={{ paddingBottom: '32px' }}>
              <GroupHeading>How end users sign in</GroupHeading>
              <RadioRow>
                <Radio
                  name={`sign-in-${brand.id}`}
                  value="choose"
                  checked={signInMode === 'choose'}
                  onChange={() => setSignInMode('choose')}
                >
                  <Label>Let them choose</Label>
                  <Hint>End users select any active authentication method.</Hint>
                </Radio>
              </RadioRow>
              <RadioRow>
                <Radio
                  name={`sign-in-${brand.id}`}
                  value="sso"
                  checked={signInMode === 'sso'}
                  onChange={() => setSignInMode('sso')}
                >
                  <Label>Redirect to SSO</Label>
                  <Hint>If more than one method is active, end users go to primary SSO.</Hint>
                </Radio>
              </RadioRow>
            </Section>
          </Column>
        </TabPanel>
        {/* Empty by design — see CHANNEL_TABS. Present so the tab strip is a real
            Garden Tabs rather than three styled words. */}
        <TabPanel item="messaging" />
        <TabPanel item="llm" />
      </Scroll>

      <Footer>
        <CancelButton isLink onClick={revert}>
          Cancel
        </CancelButton>
        <Button isPrimary onClick={handleSave}>
          Save
        </Button>
      </Footer>

      {isSaved && (
        <SaveToast title="Changes saved" top={toastTop} onClose={dismissToast} resetKey={saves}>
          {brand.name} end user authentication settings were updated.
        </SaveToast>
      )}
    </Shell>
  )
}
