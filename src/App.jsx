import { useEffect, useState } from 'react'
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

   One `label` each, shown in full both on the switcher's button and in its menu, at
   Rusty's ask — the button used to carry a `short` form ("Option 2") with the word
   "Option" printed beside it, which said less in more space. There was a Garden Combobox
   overlaid on the Zendesk top bar before that; it read as a Zendesk control rather than a
   prototype one, which is why the prototype bar exists at all. */
const OPTIONS = [
  { id: 'opt1', label: 'Option 1 — End user auth with brands dropdown' },
  { id: 'opt2', label: 'Option 2 — End user auth table' },
  { id: 'opt3', label: 'Option 3 — Brands flow' },
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

  const [option, setOption] = useState('opt1')

  /* The prototype bar's slot for the Comment button, held in state rather than a
     ref so that its arrival re-renders and CommentLayer can portal into it. */
  const [commentSlot, setCommentSlot] = useState(null)

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
              // The one crumb that goes anywhere, and so the only blue one: back to
              // the table.
              { label: 'End user authentication', onClick: () => setRoute('table') },
              { label: brand.name },
            ]}
            title={`${brand.name} end user authentication`}
          />
        )
      }
      return <BrandsAuthTable onSelectBrand={openBrandAuth} />
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
          <ContentRow>
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
          </ContentRow>
        </PageContainer>

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
