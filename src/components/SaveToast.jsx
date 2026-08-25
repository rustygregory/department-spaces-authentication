import { useEffect } from 'react'
import styled from 'styled-components'
import { Notification, Title, Close } from '@zendeskgarden/react-notifications'

/* The success toast that follows Save.
 *
 * Garden's own `ToastProvider` places toasts by named corner and owns the offsets, which is
 * exactly the part Rusty specified — 70px from the top of the screen, 40px from the right —
 * so the placement lives here as two numbers instead. What's Flora's is the notification
 * itself: `react-notifications` picks up the vendored `notifications/notification.ts`
 * override for its radius, padding, shadow and close-button position.
 *
 * Fixed to the viewport, not to the work area, because "top right of the screen" is what was
 * asked for — it sits over the top bar's right end rather than under it.
 */

// Dismisses itself; the close button is for a reader who wants it gone sooner.
const DISMISS_AFTER = 4000

const Anchored = styled.div`
  position: fixed;
  top: ${(props) => props.$top}px;
  right: ${(props) => props.$right}px;
  /* Above the copy-settings panel (z-index: 2000). */
  z-index: 2100;
`

const Toast = styled(Notification)`
  /* Wide enough for the brand's name on one line — "Hostile Takeover Bank" is the longest
     in the roster — and bounded so a toast never runs the width of the screen. */
  min-width: 320px;
  max-width: 420px;
`

const Body = styled.div`
  font-size: 14px;
  color: #2f3130;
  margin-top: 2px;
`

/**
 * @param title    the bold first line
 * @param children the line under it, e.g. which brand was saved
 * @param onClose  called by the close button and by the timer
 * @param top      px from the top of the viewport; caller should pass contentTop + 72 so
 *                 the toast sits 72px below the work area's top edge
 * @param right    px from the right edge of the viewport; defaults to 20
 * @param resetKey change it to restart the dismiss timer — two saves in a row have to give
 *                 the second one its own four seconds, and the toast never unmounts between
 *                 them for the timer to restart on its own
 */
export default function SaveToast({ title, children, onClose, resetKey, top = 70, right = 20 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, DISMISS_AFTER)
    return () => clearTimeout(timer)
  }, [onClose, resetKey])

  return (
    <Anchored $top={top} $right={right}>
      <Toast type="success" role="status" aria-live="polite">
        <Title>{title}</Title>
        {children && <Body>{children}</Body>}
        <Close aria-label="Dismiss" onClick={onClose} />
      </Toast>
    </Anchored>
  )
}
