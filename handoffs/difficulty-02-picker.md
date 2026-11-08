# Difficulty, part 2 — the picker, per game and for the whole evening

Wave 2, after `difficulty-01-setting.md` (its shape and Adrien's words are
there). Runs beside part 3: this part touches `apps/game`, part 3 the server's
banks.

## What to build

1. **`impeccable` first** — this is a screen change. Then reuse what exists:
   the blind test already draws a three-way picker
   (`apps/game/src/features/host/settings-panel.tsx:369-384`, labels
   `blindtest.difficulty.*`, "Grand public / Un peu pointu / Pour les
   experts"). Make it the shell's — one component in the setup, labels moved
   from `blindtest.*` to a shell key since every game shows it unchanged
   (`.claude/rules/i18n.md`).
2. **One picker per game** in `settings-panel.tsx`, mounted by
   `evening-entry-page.tsx:156`: quiz and Le Fake in `QuestionBankSettings`
   (`:108-169`, where the `wellKnownOnly` switch at `:160-167` goes away),
   Atlas (`:309-355`), estimate (`:595`), higherlower (`:608`), timeline
   (`:634`), blind test. Labels: Facile / Mélangé / Difficile — the level
   names, plus one line saying what `easy` is for (a table with children).
3. **One picker for the whole evening**, in the lobby setup beside the
   line-up. Adrien: "un bouton unique où si on choisit facile, ça passe tous
   les jeux en facile, mais aussi pouvoir gérer chaque difficulté de chaque
   jeu". Recommended shape — confirm against `docs/game-catalogue.md`:
   **derived, not stored**. Setting it writes `difficulty` into every entry of
   `settings.lineUp` that takes one, in one `host.updateSettings`; it reads
   back as that level when every entry agrees, and as "Sur mesure" (custom)
   when they differ. No precedence rule between a room value and a game value
   then exists to get wrong. An entry added to the line-up afterwards takes
   the level the evening shows, unless it shows "Sur mesure".
4. **Variant labels** — `apps/game/src/presentation/i18n/line-up-entry-names.ts:221,312`
   names the quiz's well-known variant; name a variant by its level instead,
   so two entries of one game at two levels are told apart.
5. **Browser check, muted** (`docs/browser-driving.md`): set every game to
   each level, the evening picker to Facile then one game back to Difficile
   (reads "Sur mesure"), reload the console mid-lobby. Film the picker's state
   change (CLAUDE.md rule 0), and check the setup at phone width.

## Done when

Each game's level and the evening's level are set from the console, survive a
reload, and a round dealt after picking Facile is visibly an easy one.
