# Portuguese 03 — The small banks

Series: `handoffs/README.md`. Read `docs/plans/72-portuguese.md` first.
Banks live in `apps/server/src/infrastructure/questions/`.

## The work

Add a `pt` label beside `en` and `fr` on every row — written in European
Portuguese by subagents in batches, each batch spot-read by a second agent:

| Bank        | File                    | Rows | Note                                                                                    |
| ----------- | ----------------------- | ---- | --------------------------------------------------------------------------------------- |
| Challenge   | `challenge-bank.json`   | 89   | `fillLetterSlot` (`core/challenge/letter-slot.ts`)                                      |
| Most likely | `most-likely-bank.json` | 127  | about a person at the table, never the moment                                           |
| Timeline    | `timeline-bank.json`    | 218  | the event, not the year                                                                 |
| Think alike | `think-alike-bank.json` | 187  | a prompt in one language per room — it must suit a Portuguese table, not only translate |

Then the two that are not a translation:

- **Capitals** (`capital-bank.json`, 194): rebuild through
  `scripts/build-capital-bank.ts` with Wikidata's `pt` labels and aliases,
  then read the diff (_Lisboa_, _Cidade do México_). The prompts are
  hand-written strings in `capital-questions.ts:48-50` — add the Portuguese.
- **Rebus** (`rebus-pt.json`, new, about 200): an emoji rebus is a _title_
  written in emojis, so it is **written for a Portuguese table**, not
  translated — films as released in Portugal, Portuguese songs, sayings
  (_quem tudo quer tudo perde_). Same shape as `rebus-fr.json`, emojis drawn
  from `rebus-emoji.json`. Mark `choiceOnly` where the French file would.

Black square (04) and the quantities (05) are their own sessions.

## Done when

Every row of the six banks holds `pt`, the bank tests check it is non-empty
(break one on purpose once), `pnpm validate` is green, this file is deleted
and its row struck from `handoffs/README.md`.

<!-- cspell:words Cidade Lisboa México portuguese quer tudo -->
