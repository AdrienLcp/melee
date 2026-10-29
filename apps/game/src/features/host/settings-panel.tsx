import type React from 'react'

import {
  type AtlasDirection,
  atlasDirectionSchema,
  atlasPlacesSchema
} from '@melee/protocol/atlas'
import {
  BLACK_SQUARE_CELL_COUNT,
  BLACK_SQUARE_MIN_ANSWER_COUNT
} from '@melee/protocol/black-square'
import type { QuizSettings } from '@melee/protocol/game'
import {
  type MatchsticksGoal,
  matchsticksGoals
} from '@melee/protocol/matchsticks'
import {
  type QuestionCategory,
  type QuestionLanguage,
  questionCategories,
  questionLanguages
} from '@melee/protocol/question'
import {
  type AnswerMode,
  answerModes,
  DEFAULT_MODE_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'
import { MAX_SLATE_ITEMS, MIN_SLATE_ITEMS } from '@melee/protocol/slate'
import {
  type TrackDifficulty,
  type TrackSource,
  trackDifficulties
} from '@melee/protocol/track'

import { hasAdultContent } from '@melee/core/quiz/adult-content'
import {
  answerModesFor,
  isPlayableWithTeams
} from '@melee/core/room/game-capabilities'
import { isJudgedByHost, modeOfferedBy } from '@melee/core/room/game-modes'

import { NumberField } from '@/presentation/components/number-field'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { Switch } from '@/presentation/components/switch'
import { ToggleGroup } from '@/presentation/components/toggle-group'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { LANGUAGE_NAMES } from '@/presentation/i18n/language-names'
import {
  answerModeLabelKey,
  type PlainTranslationKey,
  questionCategoryKey
} from '@/presentation/i18n/translation'

import { NO_LIMIT, NumberChoice, useDurationLabels } from './number-choice'
import { PetitBacSetup } from './petit-bac-setup'
import { SlateKeyEditor } from './slate-key-editor'
import { SlateLabelsEditor } from './slate-labels-editor'

import './settings-panel.sass'

const CLIP_DURATIONS_MS = [10_000, 20_000, 30_000] as const

/**
 * Longer than a clip at both ends: a question has to be read before it can be
 * answered, and a typed answer has to be spelled out where a pick is a press.
 */
const QUESTION_DURATIONS_MS = [15_000, 30_000, 60_000] as const

const PUZZLE_DURATIONS_MS = [30_000, 60_000, 120_000] as const

const TIMELINE_DURATIONS_MS = [30_000, 45_000, 90_000] as const

const BLACK_SQUARE_DURATIONS_MS = [45_000, 60_000, 90_000] as const

/** Three seconds is a glance, eight is nearly long enough to name the colour. */
const SWATCH_SHOW_MS = [3_000, 5_000, 8_000] as const

/** Fifteen seconds is a gut call, a minute is long enough to reason it out loud. */
const ESTIMATE_DURATIONS_MS = [15_000, 30_000, 60_000] as const

/** Six seconds a pair is a gut call, a minute and a half lets the table argue every one. */
const HIGHER_LOWER_DURATIONS_MS = [30_000, 45_000, 90_000] as const

const SWATCH_REBUILD_MS = [10_000, 20_000, 30_000] as const

/** Fifteen seconds is a table that knows itself, a minute one that argues first. */
const MOST_LIKELY_DURATIONS_MS = [15_000, 30_000, 60_000] as const

const MATCHSTICKS_GOAL_KEYS = {
  biggest: 'matchsticks.goals.biggest',
  equation: 'matchsticks.goals.equation',
  smallest: 'matchsticks.goals.smallest'
} as const satisfies Record<MatchsticksGoal, PlainTranslationKey>

const asMatchsticksGoal = (
  value: string | number
): MatchsticksGoal | undefined =>
  matchsticksGoals.find((goal) => goal === value)

const ANSWER_WINDOWS_MS = [5_000, 10_000, 20_000, NO_LIMIT] as const

/** The three questions the bank asks whoever is drawing from it. */
const QuestionBankSettings: React.FC<{
  game: QuizSettings
  isDisabled: boolean
  onChange: (game: QuizSettings) => void
}> = ({ game, isDisabled, onChange }) => {
  const translate = useTranslate()

  return (
    <>
      {/*
        The host's alone, and never the reader's: the interface locale is stored
        per device, so two players in one room can hold different ones and
        drawing from them would deal each player their own question. It opens on
        whatever the host was reading and moves independently after that — a
        room can play in French on an English console.
      */}
      <SegmentedControl
        isDisabled={isDisabled}
        label={translate('quiz.language')}
        onChange={(next) => {
          if (isQuestionLanguage(next)) {
            onChange({ ...game, language: next })
          }
        }}
        options={questionLanguages.map((language) => ({
          label: LANGUAGE_NAMES[language],
          value: language
        }))}
        value={game.language}
      />
      <ToggleGroup
        className='question-subjects'
        isDisabled={isDisabled}
        label={translate('quiz.category.label')}
        onSelectionChange={(keys) => {
          onChange({
            ...game,
            categories: [...keys]
              .map(asCategory)
              .filter((category) => category !== undefined)
          })
        }}
        options={questionCategories.map((category) => ({
          label: translate(questionCategoryKey(category)),
          value: category
        }))}
        selectedKeys={game.categories}
      />
      {game.categories.length === 0 && (
        <p className='hint'>{translate('quiz.category.none')}</p>
      )}
      <Switch
        description={translate('quiz.wellKnown.hint')}
        isDisabled={isDisabled}
        isSelected={game.wellKnownOnly}
        label={translate('quiz.wellKnown.label')}
        onChange={(wellKnownOnly) => {
          onChange({ ...game, wellKnownOnly })
        }}
      />
      {/*
        Hidden where the bank has nothing to rate, for the same reason the mode
        strip is hidden when a game offers one: this one would keep its promise
        and change nothing. The value is left alone rather than reset, so a host
        who turns it on in French still has it on when they come back.
      */}
      {hasAdultContent(game.language) && (
        <Switch
          isDisabled={isDisabled}
          isSelected={game.allowsAdultContent}
          label={translate('quiz.adult.label')}
          onChange={(allowsAdultContent) => {
            onChange({ ...game, allowsAdultContent })
          }}
        />
      )}
    </>
  )
}

/**
 * The literal return type is load-bearing: adding a difficulty to the protocol
 * without adding its label to both dictionaries stops compiling here.
 */
const difficultyLabelKey = (
  difficulty: TrackDifficulty
): `blindtest.difficulty.${TrackDifficulty}` =>
  `blindtest.difficulty.${difficulty}`

const isDifficulty = (value: string): value is TrackDifficulty =>
  trackDifficulties.some((difficulty) => difficulty === value)

const isAtlasDirection = (value: string): value is AtlasDirection =>
  atlasDirectionSchema.safeParse(value).success

const isAnswerMode = (value: string): value is AnswerMode =>
  answerModes.some((mode) => mode === value)

const asCategory = (value: string | number): QuestionCategory | undefined =>
  questionCategories.find((category) => category === value)

const isQuestionLanguage = (value: string): value is QuestionLanguage =>
  questionLanguages.some((language) => language === value)

type SettingsPanelProps = {
  /**
   * What the picker above is currently showing, which the room does not hold
   * yet — nothing there commits until a round opens. `null` while the chosen
   * kind is still missing the text it needs.
   */
  draftSource: TrackSource | null
  /** The socket is open. Every control here sends a frame, so none of them work without it. */
  isLive: boolean
  /**
   * A round is under way. Every number here still moves and lands on the next
   * round — the round on screen keeps the mode and the clock it opened with —
   * but the slate's sheet is what that round *is*, so its setup waits.
   */
  isRoundInPlay: boolean
  /** The lobby's stage carries the sheet's own setup, so the fold does not repeat it. */
  isSheetOnStage: boolean
  /** This console holds a seat, so a judged game is one it sits out rather than one somebody else judges. */
  isSeated: boolean
  /**
   * The entry being set is the one the next round opens on. The answer mode,
   * its window and the slate's key on this tab are the next round's rather
   * than an entry's, so they are offered only then.
   */
  isNextRound: boolean
  /** Applied to the room as it is pressed; nothing here waits for the launch. */
  onChange: (settings: RoomSettings) => void
  /** Files one key on this tab; the room hears of it only when the sheets open. */
  onPrepareSlateKey: (itemIndex: number, key: string) => void
  /** The slate's answer key as this host prepared it, by item index. */
  preparedSlateKeys: readonly (string | null)[]
  settings: RoomSettings
}

/**
 * What the game on the shelf asks of a round — how it is answered, what it is
 * drawn from, how long it runs — reachable for as long as the game does. Every
 * one lands on the round after the one on screen.
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  draftSource,
  isLive,
  isRoundInPlay,
  isSeated,
  isSheetOnStage,
  isNextRound,
  onChange,
  onPrepareSlateKey,
  preparedSlateKeys,
  settings
}) => {
  const translate = useTranslate()
  const isDisabled = !isLive
  const game = settings.game
  const mode = settings.mode
  const offeredModes = answerModesFor(game).filter((offered) =>
    isPlayableWithTeams({ mode: offered, teams: settings.teams })
  )
  // Read from the draft rather than from the room, or this strip goes on
  // claiming to work for a whole round after the composers were chosen.
  const chosenSource =
    draftSource ?? (game?.kind === 'blindtest' ? game.source : null)
  const pinsItsOwnDifficulty = chosenSource?.kind === 'film'

  const { openEnded: openEndedSecondsLabel, seconds: secondsLabel } =
    useDurationLabels()

  return (
    <section className='settings-panel'>
      {/*
        Hidden rather than disabled when the game offers one mode: a control
        with a single segment asks the host to choose something they have no
        choice about.
      */}
      {game !== null && isNextRound && offeredModes.length > 1 && (
        <SegmentedControl
          className='answer-mode'
          isDisabled={isDisabled}
          label={translate('host.answerMode.label')}
          onChange={(next) => {
            if (isAnswerMode(next)) {
              onChange({ ...settings, mode: DEFAULT_MODE_SETTINGS[next] })
            }
          }}
          options={offeredModes.map((offered) => ({
            label: translate(answerModeLabelKey(offered)),
            mark: isJudgedByHost({ game: game.kind, mode: offered })
              ? translate(
                  isSeated ? 'host.judgedMark.you' : 'host.judgedMark.host'
                )
              : undefined,
            value: offered
          }))}
          value={mode.kind}
        />
      )}

      {game?.kind === 'atlas' && (
        <>
          <SegmentedControl
            className='atlas-direction'
            isDisabled={isDisabled}
            label={translate('atlas.direction.label')}
            onChange={(next) => {
              if (isAtlasDirection(next)) {
                const moved = { ...game, direction: next }

                onChange({
                  ...settings,
                  game: moved,
                  mode: modeOfferedBy({
                    game: moved,
                    preferred: DEFAULT_MODE_SETTINGS.choice
                  })
                })
              }
            }}
            options={atlasDirectionSchema.options.map((direction) => ({
              label: translate(`atlas.direction.${direction}`),
              value: direction
            }))}
            value={game.direction}
          />
          <ToggleGroup
            className='atlas-places'
            isDisabled={isDisabled}
            label={translate(`atlas.places.label.${game.direction}`)}
            onSelectionChange={(keys) => {
              const ticked = atlasPlacesSchema.options.filter((places) =>
                keys.has(places)
              )

              // The server refuses a map with nothing to draw from, so the
              // last kind stays ticked rather than being sent and bounced.
              if (ticked.length > 0) {
                onChange({ ...settings, game: { ...game, places: ticked } })
              }
            }}
            options={atlasPlacesSchema.options.map((places) => ({
              label: translate(`atlas.places.${places}`),
              value: places
            }))}
            selectedKeys={game.places}
          />
        </>
      )}

      {game?.kind === 'blindtest' && (
        <SegmentedControl
          className='track-difficulty'
          isDisabled={isDisabled || pinsItsOwnDifficulty}
          label={translate('blindtest.difficulty.label')}
          onChange={(next) => {
            if (isDifficulty(next)) {
              onChange({ ...settings, game: { ...game, difficulty: next } })
            }
          }}
          options={trackDifficulties.map((difficulty) => ({
            label: translate(difficultyLabelKey(difficulty)),
            value: difficulty
          }))}
          value={game.difficulty}
        />
      )}

      {/*
        Said where the lie would otherwise be told. The composers pin their own
        floor, so this strip decides nothing while they are the source — and a
        control that quietly stopped working is worse than one that is ruled
        and says why.
      */}
      {game?.kind === 'blindtest' && pinsItsOwnDifficulty && (
        <p className='hint'>
          {translate('blindtest.difficulty.pinnedByFilms')}
        </p>
      )}

      {game?.kind === 'buzzer' && (
        <Switch
          isDisabled={isDisabled}
          isSelected={game.locksOutOnMiss}
          label={translate('buzzer.lockout')}
          onChange={(locksOutOnMiss) => {
            onChange({ ...settings, game: { ...game, locksOutOnMiss } })
          }}
        />
      )}

      {game?.kind === 'slate' && !isSheetOnStage && (
        <NumberField
          className='item-count'
          isDisabled={isDisabled}
          label={translate('slate.items.label')}
          maxValue={MAX_SLATE_ITEMS}
          minValue={MIN_SLATE_ITEMS}
          onChange={(itemCount) => {
            if (Number.isInteger(itemCount)) {
              onChange({ ...settings, game: { ...game, itemCount } })
            }
          }}
          value={game.itemCount}
        />
      )}

      {/*
        The lobby's copy of the editor. Once the sheets are open the console
        carries one beside the answer key, sized to the sheet as it has grown.
      */}
      {game?.kind === 'slate' && !isSheetOnStage && !isRoundInPlay && (
        <SlateLabelsEditor
          isDisabled={isDisabled}
          itemCount={game.itemCount}
          labels={game.labels}
          onChange={(labels) => {
            onChange({ ...settings, game: { ...game, labels } })
          }}
        />
      )}

      {game?.kind === 'slate' &&
        isNextRound &&
        !isSheetOnStage &&
        !isRoundInPlay && (
          <SlateKeyEditor
            hint={translate('slate.key.hint')}
            isDisabled={false}
            itemCount={game.itemCount}
            keys={preparedSlateKeys}
            labels={game.labels}
            onSetKey={onPrepareSlateKey}
          />
        )}

      {game?.kind === 'quiz' && (
        <QuestionBankSettings
          game={game}
          isDisabled={isDisabled}
          onChange={(next) => {
            onChange({ ...settings, game: next })
          }}
        />
      )}

      {game?.kind === 'blindtest' && (
        <NumberChoice
          isDisabled={isDisabled}
          label={translate('blindtest.clip')}
          onChange={(roundDurationMs) => {
            onChange({ ...settings, game: { ...game, roundDurationMs } })
          }}
          optionLabel={secondsLabel}
          options={CLIP_DURATIONS_MS}
          value={game.roundDurationMs}
        />
      )}

      {game?.kind === 'quiz' && (
        <NumberChoice
          isDisabled={isDisabled}
          label={translate('quiz.duration')}
          onChange={(roundDurationMs) => {
            onChange({ ...settings, game: { ...game, roundDurationMs } })
          }}
          optionLabel={secondsLabel}
          options={QUESTION_DURATIONS_MS}
          value={game.roundDurationMs}
        />
      )}

      {game?.kind === 'matchsticks' && (
        <ToggleGroup
          className='matchsticks-goals'
          isDisabled={isDisabled}
          label={translate('matchsticks.goals.label')}
          onSelectionChange={(keys) => {
            const goals = [...keys]
              .map(asMatchsticksGoal)
              .filter((goal) => goal !== undefined)

            // A room is dealt at least one kind: unticking the last is a press
            // the server would refuse, so it is not sent.
            if (goals.length > 0) {
              onChange({ ...settings, game: { ...game, goals } })
            }
          }}
          options={matchsticksGoals.map((goal) => ({
            label: translate(MATCHSTICKS_GOAL_KEYS[goal]),
            value: goal
          }))}
          selectedKeys={game.goals}
        />
      )}

      {game?.kind === 'matchsticks' && (
        <NumberChoice
          isDisabled={isDisabled}
          label={translate('matchsticks.duration')}
          onChange={(roundDurationMs) => {
            onChange({ ...settings, game: { ...game, roundDurationMs } })
          }}
          optionLabel={secondsLabel}
          options={PUZZLE_DURATIONS_MS}
          value={game.roundDurationMs}
        />
      )}

      {game?.kind === 'blacksquare' && (
        <NumberChoice
          isDisabled={isDisabled}
          label={translate('blacksquare.duration')}
          onChange={(roundDurationMs) => {
            onChange({ ...settings, game: { ...game, roundDurationMs } })
          }}
          optionLabel={secondsLabel}
          options={BLACK_SQUARE_DURATIONS_MS}
          value={game.roundDurationMs}
        />
      )}

      {game?.kind === 'blacksquare' && (
        <NumberField
          isDisabled={isDisabled}
          label={translate('blacksquare.answerCount.label')}
          maxValue={BLACK_SQUARE_CELL_COUNT}
          minValue={BLACK_SQUARE_MIN_ANSWER_COUNT}
          onChange={(answerCount) => {
            if (Number.isInteger(answerCount)) {
              onChange({ ...settings, game: { ...game, answerCount } })
            }
          }}
          value={game.answerCount}
        />
      )}

      {/* A spoken round has one team guessing, so every find there is its alone. */}
      {game?.kind === 'blacksquare' && mode.kind === 'typed' && (
        <Switch
          description={translate('blacksquare.lone.hint')}
          isDisabled={isDisabled}
          isSelected={game.doublesLoneFinds}
          label={translate('blacksquare.lone.label')}
          onChange={(doublesLoneFinds) => {
            onChange({ ...settings, game: { ...game, doublesLoneFinds } })
          }}
        />
      )}

      {game?.kind === 'petitbac' && (
        <PetitBacSetup
          game={game}
          isDisabled={isDisabled}
          onChange={(next) => {
            onChange({ ...settings, game: next })
          }}
        />
      )}

      {game?.kind === 'swatch' && (
        <>
          <NumberChoice
            isDisabled={isDisabled}
            label={translate('swatch.showDuration')}
            onChange={(showMs) => {
              onChange({ ...settings, game: { ...game, showMs } })
            }}
            optionLabel={secondsLabel}
            options={SWATCH_SHOW_MS}
            value={game.showMs}
          />
          <NumberChoice
            isDisabled={isDisabled}
            label={translate('swatch.rebuildDuration')}
            onChange={(roundDurationMs) => {
              onChange({ ...settings, game: { ...game, roundDurationMs } })
            }}
            optionLabel={secondsLabel}
            options={SWATCH_REBUILD_MS}
            value={game.roundDurationMs}
          />
        </>
      )}

      {game?.kind === 'estimate' && (
        <NumberChoice
          isDisabled={isDisabled}
          label={translate('estimate.roundDuration')}
          onChange={(roundDurationMs) => {
            onChange({ ...settings, game: { ...game, roundDurationMs } })
          }}
          optionLabel={secondsLabel}
          options={ESTIMATE_DURATIONS_MS}
          value={game.roundDurationMs}
        />
      )}

      {game?.kind === 'higherlower' && (
        <NumberChoice
          isDisabled={isDisabled}
          label={translate('higherlower.roundDuration')}
          onChange={(roundDurationMs) => {
            onChange({ ...settings, game: { ...game, roundDurationMs } })
          }}
          optionLabel={secondsLabel}
          options={HIGHER_LOWER_DURATIONS_MS}
          value={game.roundDurationMs}
        />
      )}

      {game?.kind === 'mostlikely' && (
        <NumberChoice
          isDisabled={isDisabled}
          label={translate('mostlikely.roundDuration')}
          onChange={(roundDurationMs) => {
            onChange({ ...settings, game: { ...game, roundDurationMs } })
          }}
          optionLabel={secondsLabel}
          options={MOST_LIKELY_DURATIONS_MS}
          value={game.roundDurationMs}
        />
      )}

      {game?.kind === 'timeline' && (
        <NumberChoice
          isDisabled={isDisabled}
          label={translate('timeline.duration')}
          onChange={(roundDurationMs) => {
            onChange({ ...settings, game: { ...game, roundDurationMs } })
          }}
          optionLabel={secondsLabel}
          options={TIMELINE_DURATIONS_MS}
          value={game.roundDurationMs}
        />
      )}

      {/*
        Buzzer-moded and still nothing to hold: a reflex press takes no floor
        and waits for no verdict, nor does a count stopping, and nobody buzzes a challenge at all, so how
        long a player has to answer is a setting about a moment neither has.
      */}
      {isNextRound &&
        mode.kind === 'buzzer' &&
        game?.kind !== 'reflex' &&
        game?.kind !== 'innerclock' &&
        game?.kind !== 'challenge' && (
          <NumberChoice
            className='answer-window'
            isDisabled={isDisabled}
            label={translate('host.answerWindow.label')}
            onChange={(chosen) => {
              onChange({
                ...settings,
                mode: {
                  ...mode,
                  answerWindowMs: chosen === NO_LIMIT ? null : chosen
                }
              })
            }}
            optionLabel={openEndedSecondsLabel}
            options={ANSWER_WINDOWS_MS}
            value={mode.answerWindowMs ?? NO_LIMIT}
          />
        )}
    </section>
  )
}
