import { expect, test } from '@playwright/test'

/** In the alphabet, so the router accepts it — and held by no room. */
const NOBODY_HOME = 'K3M9'

/**
 * The one journey played in Portuguese: a room's path names no language, so
 * the screen reads the one it stored, and the way out has to carry it on.
 */
test('[e2e] a host pointed at a room that is gone is told, and given a way out', async ({
  page
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('melee:locale', 'pt')
  })

  await page.goto(`/host/${NOBODY_HOME}`)

  await expect(
    page.getByRole('heading', { name: 'Não há nenhuma mesa com esse código.' })
  ).toBeVisible()

  const wayOut = page.getByRole('link', { name: 'Voltar aos jogos' })

  await expect(wayOut).toBeVisible()

  // The console itself is gone rather than annotated: a lobby left under a dead
  // socket invites pressing buttons whose frames go nowhere.
  await expect(page.getByRole('button', { name: 'Para a mesa!' })).toBeHidden()

  await wayOut.click()
  // The language the screen reads, not the bare root: the way out of a dead
  // room is a link like any other, and every link names its language.
  await expect(page).toHaveURL('/pt')
})
