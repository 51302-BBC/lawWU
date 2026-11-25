import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Button, Sheet } from './components'

describe('Sheet focus trap', () => {
  it('keeps focus inside the dialog on Shift+Tab right after opening', async () => {
    render(
      <>
        <button>outside</button>
        <Sheet title="測試" onClose={() => {}}>
          <Button>裡面</Button>
        </Sheet>
      </>,
    )
    const dialog = screen.getByRole('dialog')
    const user = userEvent.setup()
    await user.tab({ shift: true })
    expect(dialog.contains(document.activeElement)).toBe(true)
    await user.tab({ shift: true })
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})
