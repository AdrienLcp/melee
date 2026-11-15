# 71 — A picture with every estimate question

**Not started.** Asked 15/11/2026 with the prices of stage 58: _the object for
a price, the monument for a height, the country's map for a population_.

A number asked about something the table cannot see is a number asked about a
word. _Combien ça coûte ? Le tout premier sac Birkin_ is a better question with
the bag on the wall, and _Quelle hauteur pour cet édifice ? Burj Khalifa_ with
the tower. The picture is the question's, never its answer: nothing in it may
give the value away.

## What already exists, and what it costs

| Family                       | Picture                                   | New asset?                                 |
| ---------------------------- | ----------------------------------------- | ------------------------------------------ |
| `population.country`, `area.country` | the outline the silhouettes rubric draws (stage 57), 173 SVGs in `apps/game/public/silhouettes/`, 813 KiB | **none** — a mapping only |
| `*.region`, `*.department`   | the France map's own shapes (`world-geometry.ts`'s conic projection) | an outline per region and department, built like the silhouettes |
| `population.city`, `area.city` | a dot on the country's outline, or nothing | none at first |
| `elevation.mountain`, `height.building`, `length.river` | a Wikimedia Commons photograph | yes |
| `price.item`                 | a Wikimedia Commons photograph            | yes, sixty, chosen by hand                 |

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

## Steps

1. **Countries**: `P298` in the bank build, `countryCode` on the row and the
   question, the outline on the question card for both country families, on
   every screen. Protocol bump only if an old peer could mis-read the frame
   (a new optional field does not).
2. **The picture pipeline**: a build script reading `P18` and the hand-named
   price files, checking licences, resizing to WebP and writing the hashed
   files plus a `pictures.json` of name, size, author and licence; the credits
   section read from it.
3. **The screens**: wall, console and player layouts above, filmed in and
   out (`docs/browser-driving.md`, _Filming a motion_), full room at phone
   width.
4. **Plus ou moins**: the pictures on its tiles, and the decision whether
   prices join its pairs.

## How to tell it is done

- A country question shows the country's outline on every screen from the
  first frame; a country the atlas cannot draw shows none.
- No picture ships whose licence is not free, and every one is credited on
  the credits page.
- The answering screen of a phone standing up never scrolls with a picture
  on the round.
- The picture adds nothing a player could read the value from.
