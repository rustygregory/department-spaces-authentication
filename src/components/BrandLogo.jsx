import styled from 'styled-components'

/* A brand's mark.
 *
 * The real page shows an uploaded image per brand. There are 51 brands here and no
 * assets for them, so this is a coloured rounded square carrying the brand's
 * initial — a placeholder, and deliberately a plain one rather than a stock logo
 * that would read as a real mark. If Rusty wants real marks later, this component
 * and `logoColor` / `initial` in data/brands.js are the only places to change.
 */

const Mark = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  border-radius: 6px;
  background-color: ${(p) => p.$color};
  color: #ffffff;
  font-size: ${(p) => Math.round(p.$size * 0.45)}px;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
  user-select: none;
`

export default function BrandLogo({ brand, size = 24 }) {
  return (
    <Mark $size={size} $color={brand.logoColor} aria-hidden="true">
      {brand.initial}
    </Mark>
  )
}
