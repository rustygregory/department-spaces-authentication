import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ThemeProvider } from './flora-theme/elements/ThemeProvider'
import { TopBar, MainNav } from 'zendesk-globalnav-template'
import styled from 'styled-components'
import PrototypeBar from './prototype-bar/PrototypeBar'
import AdminCenterNav from './components/AdminCenterNav'
import EndUserAuthPage from './components/EndUserAuthPage'
import BrandsAuthTable from './components/BrandsAuthTable'
import BrandsListPage from './components/BrandsListPage'
import BrandDetailPage from './components/BrandDetailPage'
import EuaMovedPage from './components/EuaMovedPage'
import CommentLayer from './comments/CommentLayer'
import CopySettingsPanel from './components/CopySettingsPanel'
import SaveToast from './components/SaveToast'
import { BRANDS, getBrand } from './data/brands'
import './App.css'

/* Department spaces authentication — three answers to one question.
 *
 * End user authentication is becoming per-brand. Where does the brand dimension
 * live? Option 1 puts it in a dropdown on the existing page, Option 2 makes the page
 * a list of brands you drill into, Option 3 moves the settings inside Brands
 * altogether. All three render the *same* settings screen and the *same* 51 brands,
 * so what a reviewer is comparing is only the navigation.
 */

/* The whole window: our prototype bar, then the product below it.
   Sized in percent rather than viewport units so that comment mode — which
   narrows #root to make room for its sidebar — actually narrows this too. A
   100vw child ignores a narrower parent and slides under the sidebar. */
const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background-color: #f8f9f9;
  overflow: hidden;
`

const ContentRow = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
`

/* Always in the DOM — transitions from 0 to the panel width so MainContent
   visibly narrows as the panel opens, without the panel itself being a flex
   item (which caused the Combobox listbox body-scroll bug). */
const PANEL_SPACE = 381
const PanelSpacer = styled.div`
  flex-shrink: 0;
  width: ${(p) => (p.$open ? `${PANEL_SPACE}px` : '0px')};
  transition: width 180ms ease-out;
`

const MainContent = styled.main`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border-radius: 8px 0px 0px 0px;
  box-shadow: 0px 0px 4px rgba(10, 13, 14, 0.16);
  overflow: hidden;
`

const TopBarRow = styled.div`
  flex-shrink: 0;
`

/* The three options. Ids are permanent — a comment pin stores one, so renaming an id
   would silently point old pins at a different option.

   `label` is the short title shown both on the trigger button and as the first line of the
   menu item — "Option 1", "Option 2", "Option 3", semi-bold. `description` is the sub-line
   in the menu only, regular weight, no em dash. The em dash + inline description were
   replaced at Rusty's ask (2026-08-24). Ids are permanent — comment pins store them. */
/* opt2 is the working option — it comes first and is not archived. opt1 and opt3
   are archived alternatives kept for comparison. The switcher shows them below a
   separator so a reviewer always knows which one is current. */
const OPTIONS = [
  { id: 'opt2', label: 'Option 2', description: 'End user auth table' },
  { id: 'opt1', label: 'Option 1', description: 'End user auth with brands dropdown', archived: true },
  { id: 'opt3', label: 'Option 3', description: 'Brands flow', archived: true },
]

const isKnownOption = (id) => OPTIONS.some((option) => option.id === id)

/* Screens, by option. Navigation is App state rather than a router — same as
   organization-hierarchy — because that is what lets a comment pin be restored onto
   the exact screen it was made on.

   opt1: 'auth'                                  the settings page, brand chosen in its dropdown
   opt2: 'table' → 'brand-auth'                  the brand list, then one brand's settings
   opt3: 'moved' | 'brands' → 'brand' → 'brand-auth'
                                                 the signpost, the Brands list, one brand,
                                                 and its settings from the Actions menu

   'brand-auth' is shared by Options 2 and 3 — the same settings for the same brand,
   reached two different ways — so the option decides its breadcrumbs, not the route. */
const HOME_ROUTE = { opt1: 'auth', opt2: 'table', opt3: 'moved' }

export default function App() {
  /* Product switcher stays pinned to Admin Center for this prototype.
     The id is 'admin-center' with a hyphen — that's the id in the template's own
     product list, and MainNav compares against it literally to pick which rail of
     icons to draw. 'admin_center' isn't rejected, it just doesn't match, so the rail
     silently falls back to Support's items. (custom-roles-all-plans passes the
     underscore and has that fallback showing.) */
  const [currentProduct, setCurrentProduct] = useState('admin-center')
  const [activeNavItem, setActiveNavItem] = useState(0)
  const [isSubnavExpanded, setIsSubnavExpanded] = useState(false)

  const [option, setOption] = useState('opt2')

  /* The prototype bar's slot for the Comment button, held in state rather than a
     ref so that its arrival re-renders and CommentLayer can portal into it. */
  const [commentSlot, setCommentSlot] = useState(null)

  /* Measure where ContentRow starts so the copy panel's top aligns with the
     work area, not with the viewport top (which would include the top bar). */
  const contentRowRef = useRef(null)
  const [contentTop, setContentTop] = useState(0)
  useLayoutEffect(() => {
    const measure = () => {
      if (contentRowRef.current) {
        setContentTop(contentRowRef.current.getBoundingClientRect().top)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  /* 72px below the work area's top edge, per Rusty. */
  const toastTop = contentTop + 72

  /* Copy-settings panel — lives in App so it survives navigating from the table
     into a brand's settings page while it's open. Closing on option switch since
     the concept of "copy to [brand from table row]" is opt2-specific. */
  const [copyPanelTarget, setCopyPanelTarget] = useState(null)
  const [copyToast, setCopyToast] = useState(null)
  const [copyCount, setCopyCount] = useState(0)

  const handleCopyPanelSaved = useCallback(({ sourceName, targetName }) => {
    setCopyPanelTarget(null)
    setCopyToast({ sourceName, targetName })
    setCopyCount((n) => n + 1)
  }, [])

  const [route, setRoute] = useState(HOME_ROUTE.opt1)
  // Which brand is being looked at. Option 1 reads it as the dropdown's selection;
  // Options 2 and 3 as the row that was clicked. Defaults to the first of the roster.
  const [brandId, setBrandId] = useState(BRANDS[0].id)

  const brand = getBrand(brandId) ?? BRANDS[0]

  /* Switching option resets to that option's home screen. Routes don't cross
     options — 'brands' has no meaning in Option 1 — so carrying one over would leave
     the work area blank. */
  const selectOption = (next) => {
    setOption(next)
    setRoute(HOME_ROUTE[next])
    setCopyPanelTarget(null)
  }

  const openBrandAuth = (id) => {
    setBrandId(id)
    setRoute('brand-auth')
  }

  const openBrand = (id) => {
    setBrandId(id)
    setRoute('brand')
  }

  /* The nav's own selection follows the route rather than being set by the click, so
     that a comment pin restoring 'brands' also restores the pill on Brands. */
  const activeNavLabel =
    option === 'opt3' && route !== 'moved' ? 'Brands' : 'End user authentication'

  const onSelectNavItem = (label) => {
    if (label === 'Brands') {
      setRoute('brands')
      return
    }
    setRoute(HOME_ROUTE[option])
  }

  useEffect(() => {
    document.title = 'End user authentication — Admin Center'
  }, [])

  const renderWorkArea = () => {
    if (option === 'opt1') {
      // One page, brand chosen on it. The dropdown carries all 51.
      return (
        <EndUserAuthPage
          brand={brand}
          breadcrumbs={[
            { label: 'Account' },
            { label: 'Security' },
            { label: 'End user authentication' },
          ]}
          showBrandMenu
          onBrandChange={setBrandId}
          toastTop={toastTop}
        />
      )
    }

    if (option === 'opt2') {
      if (route === 'brand-auth') {
        return (
          <EndUserAuthPage
            brand={brand}
            breadcrumbs={[
              { label: 'Account' },
              { label: 'Security' },
              { label: 'End user authentication', onClick: () => setRoute('table') },
              { label: brand.name },
            ]}
            title={`${brand.name} end user authentication`}
            toastTop={toastTop}
          />
        )
      }
      return (
        <BrandsAuthTable
          onSelectBrand={openBrandAuth}
          onOpenCopyPanel={setCopyPanelTarget}
          copyRefreshKey={copyCount}
        />
      )
    }

    // Option 3.
    if (route === 'brand-auth') {
      /* The settings as their own page under the brand, reached from that brand's
         Actions menu. Both ancestors are live links: the brand's page, and the list.
         No brand switcher and no brand in the title — the trail already says whose
         settings these are, twice. */
      return (
        <EndUserAuthPage
          brand={brand}
          breadcrumbs={[
            { label: 'Account' },
            { label: 'Brand management' },
            { label: 'Brands', onClick: () => setRoute('brands') },
            { label: brand.name, onClick: () => setRoute('brand') },
            { label: 'End user authentication' },
          ]}
          toastTop={toastTop}
        />
      )
    }
    if (route === 'brand') {
      return (
        <BrandDetailPage
          brand={brand}
          onOpenAuth={() => setRoute('brand-auth')}
          onNavigateBrands={() => setRoute('brands')}
        />
      )
    }
    if (route === 'brands') {
      /* A brand always opens its own page, however the reader reached the list — via
         the nav or via *View brands*. It used to skip ahead to the settings when they
         came from that link; Rusty took that out, so the Access page is never bypassed
         and the trip through Actions is the same trip for everyone. That length is
         part of what Option 3 is asking reviewers to judge. */
      return <BrandsListPage onSelectBrand={openBrand} />
    }
    return <EuaMovedPage onViewBrands={() => setRoute('brands')} />
  }

  return (
    <ThemeProvider>
      <Shell>
        {/* Our chrome, above the product's. The option switcher and the Comment
            button both live here, so neither covers the design. */}
        <PrototypeBar
          title="Department spaces authentication"
          meta="Aug 2026"
          versions={OPTIONS}
          versionId={option}
          onVersionChange={selectOption}
          versionLabel="Option"
          commentSlotRef={setCommentSlot}
        />
        <PageContainer>
          <TopBarRow>
            <TopBar currentProduct={currentProduct} onProductChange={setCurrentProduct} />
          </TopBarRow>
          <ContentRow ref={contentRowRef}>
            <MainNav
              currentProduct="admin-center"
              activeNavItem={activeNavItem}
              setActiveNavItem={setActiveNavItem}
              isSubnavExpanded={isSubnavExpanded}
              setIsSubnavExpanded={setIsSubnavExpanded}
            />
            <AdminCenterNav
              activeItem={activeNavLabel}
              onSelect={onSelectNavItem}
              // Brands is only a destination in Option 3; elsewhere the brand lives
              // inside the auth page and the nav item would offer a screen the option
              // doesn't have.
              brandsEnabled={option === 'opt3'}
            />
            {/* Comment mode pins to this wrapper only — inside the chrome, so the
                prototype bar, the top bar, the global nav rail and the Account sub-nav
                all stay clickable with comment mode on. The trade-off worth naming to
                Rusty: a reviewer can't pin a comment *on* the "End user
                authentication" nav item, which is itself part of what Option 3
                changes. Keeping the sub-nav live wins, because covering it would
                strand a reviewer on whichever screen they entered on. */}
            <MainContent data-comment-root="true">{renderWorkArea()}</MainContent>
            {/* Spacer reserves the panel's width in the flex row so MainContent
                shrinks when the panel opens. The panel itself is position:fixed
                so its Combobox listbox never touches the document layout. */}
            <PanelSpacer $open={Boolean(copyPanelTarget)} />
          </ContentRow>
        </PageContainer>

        {copyPanelTarget && (
          <CopySettingsPanel
            targetBrand={copyPanelTarget}
            contentTop={contentTop}
            onClose={() => setCopyPanelTarget(null)}
            onSaved={handleCopyPanelSaved}
          />
        )}

        {copyToast && (
          <SaveToast
            title="Settings copied"
            top={toastTop}
            right={20}
            onClose={() => setCopyToast(null)}
            resetKey={copyCount}
          >
            {copyToast.sourceName} settings copied to {copyToast.targetName}.
          </SaveToast>
        )}

        {/* Comment mode. Outside the prototype's own flow: with it off, nothing here
            intercepts a click and the prototype behaves as if it weren't installed.

            Its button is portalled into the prototype bar rather than floated over the
            bottom-left of the page, so it covers nothing — `commentSlot` is that slot.

            `context` is what a pin remembers about the view it was made in. All three
            values matter, because the same screen position holds different content per
            option, per route and per brand — a pin without them would reopen pointing
            at something else. */}
        <CommentLayer
          toggleContainer={commentSlot}
          context={{ option, route, brandId }}
          onRestoreContext={(saved) => {
            /* Guarded against an id no option answers to: that would leave the
               switcher with a blank field and the work area rendering Option 3's
               branch by default. Falls back to leaving the option alone, so the
               comment opens on what's on screen rather than on nothing. */
            if (isKnownOption(saved.option)) setOption(saved.option)
            if (saved.brandId && getBrand(saved.brandId)) setBrandId(saved.brandId)
            // Route last: it's the value `selectOption` would otherwise overwrite.
            if (saved.route) setRoute(saved.route)
          }}
        />
      </Shell>
    </ThemeProvider>
  )
}
