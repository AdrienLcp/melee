# Line-up entries — rows named two ways

Reported by Adrien on 2026-11-10 while setting up the ready-made line-up
_Mêlée générale_ in the console's side panel. The first point, a blind test's
source lost on the next round's entry, landed on 2026-11-10.

## Every row is named the same way

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
