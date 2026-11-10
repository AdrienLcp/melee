# Line-up entries — an edit that is not saved, and rows named two ways

Reported by Adrien on 2026-11-10 while setting up the ready-made line-up
_Mêlée générale_ in the console's side panel. Two fixes, in this order: the
first is a bug, the second changes what the rows say and is checked on top of
it.

## 1. The next round's blind test keeps its source as a draft

> « je clique sur le premier "blind test", je modifie un paramètre (j'ajoute
> "décennies" à musique de film), comment sauvegarder ? Si je fais "retour aux
> jeux" j'ai l'impression que ça n'a pas sauvegardé »

**Cause, read in the code (not yet reproduced in a browser):** loading
_Mêlée générale_ points `lineUpAt` at entry 0
(`packages/core/src/room/saved-evening.ts:155-174`), the film-scores blind
test (`ready-made-line-ups.ts:98`), so its page has `isNext` true
(`apps/game/src/features/host/evening-entry-page.tsx:71`). For the next entry
the source picker reports to `onDraftSource` instead of `commitSource`
(`evening-entry-page.tsx:152`), which only sets `draftSource` in
`host-console-page.tsx:184, 805`. The draft is sent only by `onOpenRound`
(`host-console-page.tsx:712-724`), and is lost when "Régler" remounts the
picker from the server's entry (`playlist-picker.tsx:165-167`) or when
`lineUpAt` moves (`host-console-page.tsx:192-195`). Every other entry commits
at once (`evening-entry-page.tsx:74-92`). The picker's own doc says so on
purpose: "Nothing here commits: whatever opens the next round is what sends
the source" (`playlist-picker.tsx:151-158, 181-185`).

**Fix:** the next entry saves its source like every other entry and every
other setting on the page — sent on the press, the server's
`followedByLineUp` (`socket-handler.ts:2241`, `line-up.ts:74-80`) writes
`game` back into `lineUp[lineUpAt]`. Keep the "same source, send nothing"
check so the picker's report on mount sends no frame. A typed playlist id or
search query sends once typing settles or on the preview press, never per
keystroke (`.claude/rules/data-fetching.md`). Then remove `draftSource` from
`host-console-page`, `onOpenRound`, `SettingsPanel` and the summaries, and
rewrite the picker's doc.

**Before deleting the draft, read why it exists:** `git log -S draftSource`
and `git log -S onDraftSource`. If a reason still holds (a Deezer fetch per
change, a source the server checks before a round), keep it and save the
draft into the line-up instead — the bug is the lost edit, not the draft.

**Check:** a test that the next entry's source is sent, beside the existing
one for other entries; then in a muted browser, open _Mêlée générale_,
"Régler" the first blind test, add a decade, "Retour aux jeux": its row
changes; reload the console: it is still there.

## 2. Every row is named the same way

> « Certains jeux n'ont que le titre du jeu puis les options du jeu choisi en
> petit en gris en dessous, et pour le blind test ou les quiz, c'est mis dans
> le titre en gros en noir avec un tiret pour séparer. Il faudrait pas faire
> comme les autres ? »

**Decided:** yes, in the side panel's list. A row's title is the game's name
alone, and every setting goes in the grey line under it. The list numbers
(_Nuancier 1_, _Nuancier 2_) only two rows of one game whose grey lines read
the same — that number lives in the list alone since `0cc50695`, and Adrien
approved it. Today `lineUpEntrySummaries`
(`apps/game/src/presentation/i18n/line-up-entry-names.ts`) moves the setting
that tells siblings apart into the title (_Blind test · Musiques de films_)
and leaves it out of the grey line.

**Stays as it is:** an entry named alone, where no grey line follows it —
`nextRoundName` (the next-round press, `reveal-actions.tsx`,
`next-round-card.tsx`) and `playedRoundName` (the reveal's heading on every
screen) — keeps the telling name (_Blind test · 70s_). That is how the room
knows which blind test is coming. `entryNamings` keeps working for those.

**Check:** UI work, so `impeccable` first. Update the `lineUpEntrySummaries`
tests (_titles a row by the name the line-up gives it_, _leaves out of a row's
detail what its name already says_). Look at _Mêlée générale_ and _Spéciale
musique_ (three blind tests) in the side panel at phone width and on a
desktop: every title is a game name, and the grey lines tell the three blind
tests apart. Check the draw page too (`evening-draw-page.tsx`, the same
summaries).
