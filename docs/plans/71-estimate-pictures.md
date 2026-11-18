# 71 — A picture with every estimate question

**Done 18/11/2026** — the countries' outline on every screen, the
photographs built and credited, drawn on every screen, then on Plus ou
moins' tiles; prices stay out of its pairs. Asked
15/11/2026 with the prices of stage 58: _the object for a price, the
monument for a height, the country's map for a population_.

A number asked about something the table cannot see is a number asked about a
word. _Combien ça coûte ? Le tout premier sac Birkin_ is a better question with
the bag on the wall, and _Quelle hauteur pour cet édifice ? Burj Khalifa_ with
the tower. The picture is the question's, never its answer: nothing in it may
give the value away.

## What already exists, and what it costs

| Family                                                  | Picture                                                                                                   | New asset?                                                       |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `population.country`, `area.country`                    | the outline the silhouettes rubric draws (stage 57), 173 SVGs in `apps/game/public/silhouettes/`, 813 KiB | **none** — a mapping only                                        |
| `*.region`, `*.department`                              | the France map's own shapes (`world-geometry.ts`'s conic projection)                                      | an outline per region and department, built like the silhouettes |
| `population.city`, `area.city`                          | a dot on the country's outline, or nothing                                                                | none at first                                                    |
| `elevation.mountain`, `height.building`, `length.river` | a Wikimedia Commons photograph                                                                            | yes                                                              |
| `price.item`                                            | a Wikimedia Commons photograph                                                                            | yes, sixty, chosen by hand                                       |

**Step 1 is the countries, because it costs no asset.** A country row carries
its Wikidata id (`Q142`) and a silhouette its ISO alpha-3 code (`FRA`):
`build-quantity-bank.ts` reads `P298` beside the value, the row gains a
`countryCode` (`null` for every other family), and the question carries it
from the first frame — the outline is public, as it is in the map's _name_
round. A country with no silhouette (the 22 microstates the atlas cannot
draw) shows no picture rather than a placeholder.

## Photographs: Wikimedia Commons, credited

- **Chosen, not drawn.** `P18` (image) on the Wikidata entity gives a
  candidate for every mountain, tower and river; a price row names its Commons
  file by hand in `price-bank.json` (`image: "File:…"`), because no query finds
  _a PS5 with its disc drive_. A row with no file shows no picture.
- **Only free licences**: public domain, CC0, CC BY, CC BY-SA. The build
  reads each file's licence metadata (`LicenseShortName`, `Artist`,
  `Credit`) from the Commons API and refuses a file whose licence is anything else — a
  non-commercial or no-derivatives file cannot ship in an app that resizes it.
- **Attribution lives on the credits page**, one line per file — author,
  licence, link to the file page — under its own heading, as the flags and the
  word lists already are (`credits-page.tsx`). BY-SA covers the resized copy
  only, not the app around it. The reveal does not carry the credit: a wall
  read from four metres has no room for it, and Commons' terms are met by the
  credits page the menu links to.
- **A logo is not a photograph.** A brand's logo is a trademark, often
  non-free on Commons; a price shows the object, never its packaging or mark.

## Stored and served

- **Bundled under `apps/game/public/pictures/`**, each file named by a hash
  of its content like the flags and the silhouettes, so a cache never serves
  a stale picture and the Worker's static assets serve it with no code. R2 is
  the next step only if the budget below is passed: it costs a binding, an
  upload step in the deploy and a second origin in the CSP, for files that
  change once a year.
- **Budget**: one WebP per picture, 640px on its long side, quality 75 —
  about 40 KiB each. Every well-known mountain, tower and river (223 rows)
  and the 194 prices come to about 16 MiB, inside Workers' static-asset
  limits (25 MiB per file, 20 000 files). Hard-tier rows get no picture
  until the budget says otherwise.
- **Fetched when the round deals it**, never preloaded with the shell: the
  question carries a file name, each screen loads it, and the card is laid
  out at its final size before it arrives (`aspect-ratio` from the bank), so
  nothing jumps when it lands. It fades in like every other piece
  (`sass-architecture`, _A state change moves_).

## How each screen lays it out

Read `screen-roles` first; the picture gives way before any figure does.

- **Wall**: large, beside the question lying down and above it at 9:16. It
  is what the room looks at while it thinks. At the reveal it stays, smaller,
  beside the number line.
- **Console with no wall**: the wall's layout, since it is what the room
  reads.
- **Console beside a wall**: a thumbnail on the question card, or nothing.
- **Player**: the first thing to go. An answering screen never scrolls and
  the field and the keyboard take half of it, so a phone standing up shows no
  picture while the field is open; lying down it may take the question's
  side. The reveal shows it small above the number line.

## Plus ou moins reuses it

Stage 59 pairs the same rows, so the same file names serve it: one picture
per tile, side by side, which is the better half of the game — _Everest or
K2_ read as two faces. It lands after the estimate's, on the same assets.
Prices are kept out of its pairs today (`drawPairs` deals Wikidata rows
alone): a price's name is a sentence, too long for a tile, and a pair of
pictures is what would let it in with a short name beside it.

## What step 1 settled

- **`countryCode` sits on every bank row**, `null` off the two country
  families and on Tuvalu, which the map cannot name; the question carries
  `silhouette` (`bankQuestionOf`), the file the silhouettes rubric already
  serves, `null` for the 22 microstates. A required field: a deck only ever
  deals `own` questions, so no stored question lacks it.
- **The bank was patched, not rebuilt.** `quantities:build` now asks P298 in
  a query of its own (`countryCodesOf`), but a full run from the cache
  rewrote 1 766 rows — the Portuguese names stage 72 corrected among them —
  and added and dropped a few. Until the build reproduces the committed bank,
  a new column is written into the JSON in place.
- **The outline stands above the name on the card**, as on the quiz's
  silhouette question, rather than beside it: one shape on every screen. The
  wall draws it at 30cqh, the console beside a wall at 10cqh, a seated
  console and a player smaller, and every answering screen drops it under
  `shown-height-below(36)` — a keyboard up. The console's reveal drops it
  under 45rem tall, and its sentence under 30rem.
- `e2e/choice-fits.spec.ts` holds the outlined question on the wall, the
  player, the seated console, under a keyboard and on the reveal.

## What step 2 settled

- **`pnpm --filter @melee/server pictures:build`** (`build-picture-bank.ts`,
  `sharp` its only importer) pictures 322 of 327 candidate rows in 12.1 MiB:
  238 well-known mountains, buildings and rivers (`wellKnownIn` not empty —
  the quantity bank's stand-in for a tier) and 84 prices. 243 of those rows,
  not 223, and 252 prices, not 194: the counts above were estimates.
- **Two outputs, one per app**, not one `pictures.json`: the server's
  `picture-bank.json` (entity, file, width, height — what a question will
  carry) beside the quantity bank, and the game's
  `features/credits/picture-credits.json` (title, page, author, licence),
  which the lazy credits chunk imports. Neither app reads the other's files.
- **Candidates, in order**: every `P18` (sorted), then the French then the
  English article's lead image when every `P18` was refused — that is how
  Mont Blanc and the Rhine, whose `P18` are 3:1 panoramas, got a picture.
  A price's `image` in `price-bank.json` is its only candidate.
- **Refused**: a licence other than `pd`, `cc0`, `cc-by-*`, `cc-by-sa-*`
  (FAL, GFDL, _Attribution_ and _Copyrighted free use_ among them); a shape
  wider than 2.3:1 or taller than 1:3.2 (a tower is allowed its height); a
  Wikidata row's PNG, because every one was a map, and a river's map draws
  its length; an `Artist` field over 160 characters, a licence notice pasted
  in; two files by eye (`REFUSED_BY_EYE`). A file with no author is
  credited to its uploader, as Commons' own attribution does.
- **Every Wikidata picture was looked at** on contact sheets, and every
  price picture by the agent that chose it: nothing on any of them states
  the value. Three rows stay bare: the Rubicon (_Attribution_ only),
  an Aeolian island (a panorama, then a map) and Tour Majunga (French freedom of
  panorama keeps it off Commons).
- **French architecture under copyright** — the Louvre pyramid, Millau, La
  Défense's towers — ships as Commons keeps it. Commons may delete one; the
  next build then drops the row.
- `picture-bank.test.ts` holds the bank to the served folder, both ways,
  and to the rows the banks deal.

## What step 3 settled

- **`photo` sits beside `silhouette` on the bank question** — file, width
  and height, the file held to `[0-9a-f]{12}.webp` like a flag's.
  `bankQuestionOf` reads it from `picture-bank.json` by `entity`
  (`picture-bank.ts`), a price row's included; `null` on the five rows no
  free file showed and on every other family.
- **One component, `EstimatePhoto`, inside `EstimateQuestion`**, so every
  screen that drew the outline draws the photograph in its place, sized by
  the same `--prompt-picture-height`. Its frame takes the file's ratio
  (`--photo-ratio`) on a `--card-well` ground, printed on the card like a
  flag, and the image fades in on `load` on `--transition-slow`: filmed with
  the file held back 900ms, the frame stands at its final size and nothing
  around it moves. A panorama stops at 1.6 times the height wide. The image
  is `alt=''` — the name beside it says what it shows.
- **Wall and console with no wall**: lying down (`aspect-ratio >= 13/10` on
  the `playing` container) the card is two columns, the photograph up to
  26rem tall and the name left-aligned beside it; standing up it stands
  above the name, up to 32rem. Both stay under the file's 640 pixels.
- **Console beside a wall**: the 10cqh thumbnail the outline had, beside
  the name since the podium's card lies down.
- **Player**: none upright; lying down above the name (`28cqh`, at most
  9rem), gone once a keyboard leaves under 20rem — a phone lying down is
  never 36rem tall, so the outline's threshold would have hidden it always.
  The seated console answering keeps the outline's rule.
- **The reveal keeps it above the name, not beside the ruler** as planned:
  the ruler is a log scale whose pins need the card's whole width. It goes
  under 45rem tall, with the outline.
- `e2e/choice-fits.spec.ts` holds the tallest photograph (208×640) on the
  wall, the room's reveal, a player and a seated console with and without a
  keyboard, and the widest (640×287) on the wall and the reveal. The
  leaving was not filmed apart: the photograph leaves inside the question
  card, which the stage swap already carries.

## What step 4 settled

- **A pair carries `pictures`, both sides or `null`** (`pairPictureSchema`:
  a photograph with its size, or an outline's file). One bare tile beside a
  photograph reads as the famous one, so `bankedPairOf` pictures a pair only
  when both rows are, and an evening's own pair is never pictured.
  `pairPictureOf` reads the row's photograph, else its outline, from the
  same lookup the estimate question does. Pairs come from one tier, so a
  well-known pair is usually pictured whole: 238 summits, towers and rivers
  and 172 countries have a picture, no city, region or department yet.
- **Prices stay out of the pairs.** A price's name is its qualifier — _au
  tarif bleu EDF, option base (février 2025)_, 59 characters at the median,
  78 at the ninth decile — and the qualifier is what the value depends on:
  cut to fit a tile, _a kWh_ against _a stamp_ is no longer a question with
  one answer, kept whole it is two paragraphs on two tiles. Only 84 of the
  252 are pictured, so most price pairs would be two bare sentences anyway.
  What would let them in is a short name written by hand per price and a
  pair dealt within one year; nothing short of that.
- **On a tile the picture takes what the words leave**: `AnswerTile` takes
  an optional `picture`, printed in a size-container slot above the mark
  and the name (`--prompt-picture-height: 100cqh`), the gap under it inside
  its own track, and hidden once that slot is under 3.5rem. A phone upright
  shows both photographs on its two stacked tiles (204 and 236px at
  390×844); the seated console's shorter tiles drop them. An outline prints
  in the tile's ink.
- **The listed pairs** (the wall, the console, the reveals) print the
  picture over each side's name, sized by `--pairs-picture-height`: the wall
  `clamp(4rem, 44cqh, 26rem)` with the names centred under it, the console's
  reveal `clamp(3rem, 12 stage units, 9rem)` and none under 50rem tall —
  the names and the values are the reveal, and the head is too short for
  both above them. Once the values are in, the lower side's photograph goes
  grey with its name.
- **Filmed** with the files held back 900ms on a phone upright: the names
  and both frames stand at their final place from the first frame, and only
  the image's opacity changes as each lands. `e2e/choice-fits.spec.ts`
  holds the tallest photograph beside a wide one on the player, the seated
  console, the wall from 720p to 4K and the room's reveal.

## Steps

1. **Done.** **Countries**: `P298` in the bank build, `countryCode` on the row and the
   question, the outline on the question card for both country families, on
   every screen. Protocol bump only if an old peer could mis-read the frame
   (a new optional field does not).
2. **Done.** **The picture pipeline**: a build script reading `P18` and the hand-named
   price files, checking licences, resizing to WebP and writing the hashed
   files plus a `pictures.json` of name, size, author and licence; the credits
   section read from it.
3. **Done.** **The screens**: wall, console and player layouts above, filmed in and
   out (`docs/browser-driving.md`, _Filming a motion_), full room at phone
   width.
4. **Done.** **Plus ou moins**: the pictures on its tiles, and the decision whether
   prices join its pairs.

## How to tell it is done

- A country question shows the country's outline on every screen from the
  first frame; a country the atlas cannot draw shows none.
- No picture ships whose licence is not free, and every one is credited on
  the credits page.
- The answering screen of a phone standing up never scrolls with a picture
  on the round.
- The picture adds nothing a player could read the value from.
