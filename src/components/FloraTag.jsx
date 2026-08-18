import styled from 'styled-components'
import { Tag } from '@zendeskgarden/react-tags'
import { PALETTE } from '../flora-theme/elements/palette'

/* The one tag in this prototype, built to Rusty's Flora tag sheet (Allowed / None /
 * Escalated / Denied / Tag).
 *
 * Two things that sheet settles, both of which Garden gets wrong by default:
 *
 * **Colour.** A Garden `Tag hue="green"` is a *solid emphasis* chip — saturated fill,
 * white text. Flora's tags are the opposite: a pale fill with the same hue's dark
 * shade as the text. That's the 200/900 pair out of the Flora palette for every tone,
 * which is why the tones below are written as palette lookups rather than hexes — the
 * rule is legible, and a palette revision carries. Passing the hex to Garden's own
 * `hue` prop isn't enough: it would take the pale fill but then pick the text colour
 * by luminance, giving five identical near-black labels instead of the tinted ones on
 * the sheet.
 *
 * **Shape.** Fully round ends — `isPill`, which Garden renders as a 100px radius
 * rather than its default 4px. Height is capped at **20px**, Rusty's rule for every tag
 * in the prototype, which is Garden's `medium` exactly — so the size and the cap agree
 * and neither is fighting the other. (The sheet's own chips measure ~32px, Garden's
 * `large`; the cap is the later instruction and it wins.) `MAX_HEIGHT` is stated as CSS
 * as well as picked by size, so bumping `SIZE` can't quietly make tall tags again.
 *
 * Note the sheet has **no blue swatch**. `Tag` — the purple one — is its generic label
 * chip, so that's what the Brands list's Default / Agent route tags use now; they were
 * blue, from the pre-Flora reference screenshot of that page.
 */

const TONES = {
  green: { bg: PALETTE.green[200], fg: PALETTE.green[900] },
  neutral: { bg: PALETTE.grey[200], fg: PALETTE.grey[900] },
  yellow: { bg: PALETTE.yellow[200], fg: PALETTE.yellow[900] },
  red: { bg: PALETTE.red[200], fg: PALETTE.red[900] },
  purple: { bg: PALETTE.purple[200], fg: PALETTE.purple[900] },
}

const SIZE = 'medium'
const MAX_HEIGHT = 20

/* `&&` doubles the specificity. Garden sets a `height`, a `background-color` and a
   `&:hover` colour of its own, and without the extra weight which of the two rules wins
   would come down to stylesheet order. */
const Chip = styled(Tag).attrs({ isPill: true, size: SIZE })`
  &&,
  &&:hover {
    max-height: ${MAX_HEIGHT}px;
    background-color: ${(props) => TONES[props.$tone].bg};
    color: ${(props) => TONES[props.$tone].fg};
  }
`

/**
 * @param tone  one of the sheet's tones: green | neutral | yellow | red | purple
 */
export default function FloraTag({ tone = 'neutral', children, ...rest }) {
  return (
    <Chip $tone={TONES[tone] ? tone : 'neutral'} {...rest}>
      {children}
    </Chip>
  )
}
