import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'

/**
 * The reference dictionary: its keys are the type every other locale is checked
 * against, so a string added here does not compile until every locale has it.
 *
 * A count declares `plural` here the moment *any* locale inflects around it,
 * even where English does not — the shape of a key is the same in every
 * dictionary, so English writing only `other` is what lets French write `one`.
 *
 * `blindtest.*`, `buzzer.*` and `quiz.*` are the namespaces a single game owns.
 * Everything else — joining a room, the roster, the buzzer *mode*, the field a
 * simultaneous round is answered in, the round counter, the connection, the
 * errors — is the shell that the next game reuses unchanged. See
 * `docs/game-catalogue.md`.
 */
export const EN_DICTIONARY = defineDictionary({
  atlas: {
    answer: {
      cancel: 'Cancel',
      confirm: 'Put it here',
      sent: 'Your pawn is down. Waiting for the others.'
    },
    asks: {
      name: 'Name {places}',
      place: 'Find {places}',
      places: {
        countries: 'a country',
        frenchCities: 'a city in France',
        worldCapitals: 'a capital'
      }
    },
    country: COUNTRY_NAMES_EN,
    direction: {
      label: 'The round asks',
      name: 'Name what is shown',
      place: 'Place what is named'
    },
    home: {
      description:
        'A country, a capital or a French city comes up, and everyone puts a pawn down on a map they zoom with their fingers: on it scores in full, off it is paid by the kilometre. At the reveal, every pawn draws its line to the place. Or the other way round: the map lights a place up, and the table names it.'
    },
    map: {
      hint: 'Zoom in, then put your pawn down on it',
      label: 'World map',
      labelFrance: 'Map of France',
      loading: 'Unfolding the map…',
      moveHint: 'Tap somewhere else to move it',
      whole: 'Whole world',
      wholeFrance: 'Whole of France',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out'
    },
    name: 'Atlas',
    naming: {
      capital: 'Which capital is this?',
      city: 'Which city is this?',
      country: 'Which country is this?'
    },
    places: {
      countries: 'Countries of the world',
      frenchCities: 'Cities of France',
      label: { name: 'What to name', place: 'What to place' },
      worldCapitals: 'World capitals'
    },
    play: 'Play Atlas',
    prompt: 'Place {place}',
    reveal: {
      away: '{distance} km away',
      capitalOf: '{capital}, {country}',
      capitalTitle: 'The capital:',
      cityTitle: 'The city:',
      inside: 'Inside',
      km: '{distance} km',
      onTheSpot: 'Spot on',
      title: 'The country:'
    },
    scoring:
      'Everyone puts a pawn down at once. Inside the country it scores 30 points, within 500 km of its border 20, within 1,500 km 10 — and the earlier your pawn, the more the clock adds, up to double.',
    scoringCapitals:
      'Everyone puts a pawn down at once. Within 100 km of the capital it scores 30 points, within 300 km 20, within 1,000 km 10 — and the earlier your pawn, the more the clock adds, up to double.',
    scoringCities:
      'Everyone puts a pawn down at once on a map of France. Within 25 km of the city it scores 30 points, within 75 km 20, within 150 km 10 — and the earlier your pawn, the more the clock adds, up to double.',
    scoringMixed:
      'Everyone puts a pawn down at once — a country, a capital or a French city, round by round. The nearer your pawn, the more it scores, up to 30 points, and the earlier you put it down the more the clock adds, up to double.',
    scoringName: {
      choice:
        'The map shows a place and offers four names, everyone at once. The right one scores 10 points, and the earlier you find it the more the clock adds — up to double.',
      typed:
        'The map shows a place and everyone types its name at once. The right one scores 30 points, and the earlier you find it the more the clock adds — up to double.'
    },
    tagline: 'One place. Put your pawn on it, or name it.'
  },
  blacksquare: {
    answer: {
      hit: '“{line}” +{points:number}',
      label: 'An answer',
      miss: '“{line}”: nothing',
      retry: 'As many as you like. One of them is the black word.'
    },
    answerCount: {
      label: 'Answers to find',
      summary: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} answer', other: '{?} answers' } }
      })
    },
    blackWord: {
      ends: 'Your round stops here. It is worth nothing.',
      fell: '{nickname} lost the round on it',
      nobodyFell: 'Nobody fell for it',
      stamp: 'Black word'
    },
    duration: 'Time per round',
    found: defineTranslation('{count:plural}', {
      plural: { count: { other: '{?} of {total:number} found by the table' } }
    }),
    grid: 'The answers',
    home: {
      description:
        'A theme comes up — Quentin Tarantino’s films, the countries bordering France — and up to nine answers hide behind it, the less obvious paying more. Everyone fires answers from their own screen, as many as they like. Hidden with them is one black word: an answer that sounds right and is not, and whoever lands on it loses the round.'
    },
    lone: {
      doubled: '×2',
      hint: 'An answer only one player finds pays double.',
      label: 'Nobody else had it',
      said: 'Nobody else had it, so it paid double'
    },
    name: 'Black square',
    nobody: 'Nobody',
    othersLooking: 'The others are still looking.',
    play: 'Play Black square',
    scoring:
      'Up to nine answers are hidden: the best known third pay 10 points, the next third 20, the last third 30. Hit the black word and your round is worth nothing.',
    scoringLoneFinds:
      'Up to nine answers are hidden: the best known third pay 10 points, the next third 20, the last third 30, and double if nobody else finds it. Hit the black word and your round is worth nothing.',
    scoringSpoken:
      'One team says its answers out loud and somebody from another team ticks them off: the best known third pay 10 points, the next third 20, the last third 30. Say the black word and the team’s round is worth nothing.',
    spoken: {
      blackWord: {
        ask: 'Did they say it? Their round ends, worth nothing.',
        confirm: 'They said it',
        keep: 'Not said'
      },
      guessing: 'Out loud: {team}',
      hidden:
        'Hidden, so you can hold the screen up without giving anything away.',
      hide: 'Hide the list',
      keep: 'You keep the list for {team}. Tick each answer you hear.',
      keeper: '{nickname} keeps the list',
      show: 'Show the list',
      yourTeam: 'Say your answers out loud. {nickname} ticks them off.'
    },
    tagline: 'Hidden answers. One black word.',
    tier: defineTranslation('{points:plural}', {
      plural: { points: { one: '{?} point', other: '{?} points' } }
    }),
    yours: 'You found it'
  },
  blindtest: {
    answer: {
      anyOrder: 'The title, the artist, or both — as many goes as you like.',
      anyOrderFilm:
        'The film, the composer, or both — as many goes as you like.',
      artistFound: 'Artist ✓',
      bothFound: 'You have both. Sit back.',
      composerFound: 'Composer ✓',
      filmFound: 'Film ✓',
      titleFound: 'Title ✓'
    },
    /**
     * The one screen in the product that admits to being silent. A console that
     * reloaded mid-round never asked the browser for permission, and nothing on
     * the screen would otherwise say so.
     */
    audio: {
      /**
       * What the last press got. Without these the offer above repeats itself
       * for the whole evening and nothing on the screen ever says that every
       * press has already failed.
       *
       * `blocked` names the site's sound permission rather than saying "try
       * again", because the press behind it is always a real gesture — both
       * `unlock()` call sites are synchronous inside `onPress` — so a
       * `NotAllowedError` here is a setting rather than a mistimed press, and
       * pressing again answers it identically for the rest of the evening.
       *
       * All three end on the same way out, so a console that cannot be fixed
       * where it stands is told once what to do instead of three times what
       * went wrong.
       */
      pause: 'Pause',
      refused: {
        blocked:
          'The browser refused the sound. Allow it for this site, or run the room from another screen.',
        broken:
          'It broke on our side. Try again, or run the room from another screen.',
        unsupported:
          'This screen cannot play the clip. Run the room from another screen.'
      },
      replay: 'From the top',
      resume: 'Resume',
      silent: 'No sound is coming from here.',
      start: 'Start the music'
    },
    clip: 'Clip length',
    decade: {
      '1970s': '70s',
      '1980s': '80s',
      '1990s': '90s',
      '2000s': '2000s',
      '2010s': '2010s',
      '2020s': '2020s',
      label: 'Which years',
      none: 'Pick none and you get every decade.'
    },
    difficulty: {
      label: 'How well known',
      mixed: 'Deep cuts too',
      obscure: 'For the experts',
      pinnedByFilms:
        'Film scores set their own level — nothing here is a chart single.',
      wellKnown: 'Crowd-pleasers'
    },
    genre: {
      '52': 'French songs',
      '106': 'Electro',
      '113': 'Dance',
      '116': 'Rap and hip hop',
      '129': 'Jazz',
      '132': 'Pop',
      '144': 'Reggae',
      '152': 'Rock',
      '165': 'R&B',
      '169': 'Soul and funk',
      '197': 'Latin',
      '464': 'Metal',
      label: 'Which music',
      none: 'Pick none and you get every genre.'
    },
    home: {
      description:
        'Three notes are sometimes enough, and the whole table is already hunting. Title, artist, or both: the quickest to know takes the round.'
    },
    listening: 'Listening…',
    name: 'Blind test',
    play: 'Play Blind test',
    reveal: {
      title: 'It was'
    },
    scoring: {
      buzzer:
        'First to buzz answers out loud. The host judges the title and the artist, 10 points each — a wrong answer sits you out for the rest of the round.',
      choice:
        'Four answers over the same clip, everyone at once. The right one scores 10 points, and the earlier you find it the more the clock adds — up to double.',
      typed:
        'Everyone types, over the same clip. Title and artist score 10 points each and both together score 30, and the earlier you get it the more the clock adds — up to double.'
    },
    scoringFilm: {
      buzzer:
        'First to buzz answers out loud. The host judges the film and the composer, 10 points each — a wrong answer sits you out for the rest of the round.',
      typed:
        'Everyone types, over the same clip. Film and composer score 10 points each and both together score 30, and the earlier you get it the more the clock adds — up to double.'
    },
    source: {
      all: 'Every source',
      chart: 'Top charts',
      decade: 'A decade',
      film: 'Film scores',
      filmHint:
        'What a composer wrote for a film or a series — not the songs on its soundtrack.',
      label: 'Where the tracks come from',
      none: 'Pick none and you get them all mixed: charts, every decade and film scores.',
      noneInDecade: 'Nothing playable in those years. Try another decade.',
      noneInFilms:
        'Nothing playable came back from the composers. Try another source.',
      noneInPlaylist: 'Nothing playable in that playlist. Check the id.',
      noneInSearch: 'Nothing well-known enough matched. Try another search.',
      playlist: 'A Deezer playlist',
      playlistId: 'Playlist id',
      playlistIdHint: 'The number at the end of the playlist’s Deezer address.',
      preview: 'See what that finds',
      query: 'Search for',
      queryHint: 'Your search goes to Deezer, which finds the tracks.',
      ready: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} track ready', other: '{?} tracks ready' } }
      }),
      search: 'A search'
    },
    tagline: 'Name the track before anyone else.',
    verdict: {
      artistOnly: 'Artist only',
      both: 'Title + artist',
      bothFilm: 'Film + composer',
      composerOnly: 'Composer only',
      filmOnly: 'Film only',
      miss: 'Wrong',
      titleOnly: 'Title only'
    }
  },
  board: {
    at: 'Square {case:number}',
    back: 'Move {team} back a square',
    case: 'Square {case:number} of {length:number}',
    finish: 'Finish',
    fix: 'Fix the squares',
    forward: 'Move {team} forward a square',
    /** Under the whole track, on a screen in the hand when no wall draws the race. */
    lead: {
      ahead: defineTranslation('In front by {gap:plural}', {
        plural: { gap: { one: '{?} square', other: '{?} squares' } }
      }),
      behind: defineTranslation('{leader} in front, {gap:plural} ahead', {
        plural: { gap: { one: '{?} square', other: '{?} squares' } }
      }),
      level: 'Level at the front'
    },
    more: '+{count:number}',
    none: 'No board',
    recentre: 'Back to my square',
    setting: {
      catchUp: {
        hint: 'Whoever is alone in last place moves one square more on a round they score.',
        label: 'Help whoever is last'
      },
      hint: {
        off: 'Pawns racing round a track on the room’s screen.',
        seats: 'A pawn for every player, moving on after each round.',
        teams: 'A pawn for every team, moving on after each round.'
      },
      label: 'Board',
      length: '{length:number} squares',
      lengthLabel: 'Length',
      strategy: {
        hint: {
          onePointOneCase: 'One square for every 10 points the round paid.',
          rank: 'The round’s best moves 3 squares, the second 2, the third 1.'
        },
        label: 'Pawns move',
        onePointOneCase: 'By points',
        rank: 'By ranking'
      }
    },
    standing: '{team}: square {case:number} of {length:number}',
    start: 'Start',
    summary: 'a {length:number}-square board',
    walked: '+{count:number}'
  },
  buzz: {
    action: 'Buzz',
    blocked: {
      host_away: 'The host stepped away. Everything is on hold.',
      round_not_running: 'Waiting for the host',
      someone_else_buzzed: 'Someone got there first',
      you_already_missed: 'You are out for this round',
      your_answer_is_pending: 'Say your answer out loud'
    },
    ready: 'Hit it the moment you know',
    sendFailed: 'That buzz did not get through. Hit it again.',
    theyBuzzed: '{nickname} buzzed',
    won: 'You are in. Say it out loud'
  },
  buzzer: {
    clearLockouts: 'Let everyone back in',
    home: {
      description:
        'You bring the questions — a charade, a quiz off a sheet of paper, a lesson, whatever the table is up for. Only one thing gets settled here: who was in first. And that is never in doubt.'
    },
    lockout: 'A wrong answer sits you out',
    name: 'Buzzer',
    play: 'Play Buzzer',
    running: 'Ask away',
    scoring:
      'First in answers out loud, and the host says right or wrong. 10 points for right — and a wrong answer sits you out until they let you back in.',
    tagline: 'Your questions, and a race to the buzzer.'
  },
  challenge: {
    atTheTable: 'Played at the table — the host calls the placings.',
    hand: {
      aloud: 'I’ll say it aloud',
      own: 'Yours',
      spent: 'The bank is spent: write the line, or say it aloud.',
      write: 'Write my own',
      writePlaceholder: 'Or write your own…'
    },
    home: {
      description:
        'Cut a vegetable into two halves of the same weight, stack the most raclette potatoes: the challenge is played at the table, away from every screen. The host puts it up on the wall, says who came first, second and third, and the points land on the board like any round’s.'
    },
    line: {
      aloud: 'Left empty, you say it aloud.',
      description: 'Left empty, the line shown is played — or type your own.',
      label: 'The challenge',
      redeal: 'Deal another line'
    },
    name: 'Challenge',
    own: {
      add: 'Add',
      description:
        'Dealt first, in this order; the bank takes over once they run out. Kept on this device.',
      field: 'Line {index:number}',
      new: 'A new line',
      newPlaceholder: 'Write a line…',
      played: 'Played',
      remove: 'Remove line {index:number}',
      summary: '{count:number} to come',
      title: 'Your lines'
    },
    places: {
      confirm: 'Confirm the placings',
      first: '1st',
      label: 'Placings',
      nobody: 'Nobody wins',
      none: '—',
      second: '2nd',
      third: '3rd'
    },
    play: 'Play Challenge',
    scoring:
      'Played at the table. The host places the first three: 30 points for first, 20 for second, 10 for third — a tie shares its place.',
    tagline: 'Played at the table, counted on the board.',
    untitled: 'A challenge at the table'
  },
  connection: {
    closed: 'Reconnecting',
    connecting: 'Connecting',
    latency: '· {milliseconds:number} ms',
    open: 'Connected',
    refused: 'Disconnected'
  },
  /**
   * These three sentences are not blurb. CC BY-SA 4.0 §3(a)(1)(B) asks that a
   * modification be indicated, and it is the one item on that list owed
   * whatever the upstream supplied — so each has to stay true to what the
   * ingestion in `apps/server/scripts/` actually does to that bank.
   */
  credits: {
    flagIcons:
      'Each flag is drawn as it ships, renamed after its own drawing rather than its country, with the country code written inside each file replaced, so the file a screen is sent says nothing of the answer. Seven flags drawn exactly like another country’s were left out.',
    mintaka:
      'It supplies questions and no wrong answers at all, so the three candidates beside each right one were built here, out of entities Wikidata files under the same kind as the answer and that are read about roughly as much in French. Five of its eight rubrics were kept and mapped onto the subjects used here, along with four of its nine question shapes — the others name their own candidates in the question, accept more answers than they record, or ask in two hops. Questions that name the present were left behind, the corpus being fixed at October 2021. Of what remained, only the ones whose answer and whose subject have a French Wikipedia article people actually read were banked, and no answer comes up more than five times in one subject.',
    mmmlu:
      'A professional French translation of MMLU, a benchmark rather than a quiz, filtered to trivia: only the subjects a table can play were kept, and within them only the questions a reading judged a table could answer. Some questions were reworded or corrected and some wrong answers replaced.',
    openquizzdb:
      'Its rubrics were mapped onto the subjects used here, its anecdotes kept as the line shown once an answer is public, and its adult-rated questions marked so the host can leave them out. Questions that did not carry exactly three wrong answers were left behind, as were the ones whose wrong answers cannot be told from the right one once written down. One answer spelled against its own anecdote was corrected.',
    opentdb:
      'Its text arrives HTML-encoded and was decoded, its categories were mapped onto the subjects used here, and questions that did not carry exactly three wrong answers were left behind, as were the ones whose wrong answers cannot be told from the right one once written down.',
    polyfact:
      'It is built from Wikidata in fourteen question shapes, and seven of them were kept and mapped onto the subjects used here — the others ask about hamlets nobody has heard of, or give the answer away in the question. Of what remained, only the questions whose subject and whose four candidates all have a French Wikipedia article people actually read were banked. A wrong answer the source leaned on far too often was swapped for one it had barely used, and questions whose wrong answers cannot be told from the right one once written down were left behind.',
    shareAlike:
      'The assembled bank is shared under the same licence, and the code that assembles it is open.',
    title: 'Credits',
    vikidia:
      'Its quizzes are written in wikitext and were parsed line by line into a question, an answer and three wrong answers. Each of its pages was mapped by hand onto one of the subjects used here, the wiki having no rubrics to fold; the ones about the wiki itself were left out. Questions carrying fewer than four candidates, questions with several right answers, and questions whose whole point is a mathematical formula, a piece of code or a picture were left behind. Templates carrying a unit or a quotation were replaced by what they print. Every question kept was read once: the false ones were removed, the ones whose wording no longer named its own subject were completed, and the ones that can only be won by picking were marked.',
    whatChanged: 'What we changed'
  },
  error: {
    already_buzzed: 'Someone got there first.',
    api: {
      rate_limited: 'That is a lot of tables. Wait a minute and retry.',
      rejected: 'That did not go through. Try again.',
      unexpected_response: 'We did not know what to make of that. Try again.',
      unreachable: 'We cannot reach Mêlée. Try again in a moment.'
    },
    colour_still_shown: 'Wait for the colour to hide before sending yours.',
    false_start: 'Too soon. Wait for the change.',
    host_already_connected: 'Someone is already running this table.',
    host_away: 'The host stepped away. The round is waiting for them.',
    host_only_action: 'Only the host can do that.',
    host_reconnecting:
      'This table has just lost its host, and is waiting for them.',
    internal_error: 'Something broke on our side. Try again.',
    invalid_message: 'We did not understand that. Try again.',
    joined_mid_round: 'You are in from the next round.',
    judging_round: 'You are judging this round, and play again from the next.',
    music_source_unavailable:
      'The music has stopped answering. Try again in a moment.',
    nickname_taken: 'Someone already took that nickname.',
    no_content_available: 'Nothing left to play. Try other settings.',
    no_game_chosen: 'Pick a game first.',
    not_your_turn: 'This round is a duel between two other players.',
    pairing_not_found:
      'That screen code has expired. Open the screen again for a new one.',
    player_locked_out: 'You are out for this round.',
    protocol_version_mismatch: 'This page is out of date. Reload it.',
    rate_limited: 'That is a lot of tables. Wait a minute and retry.',
    removed_by_host: 'The host removed you from the table.',
    room_closed: 'The host closed the table.',
    room_full: 'That table is full.',
    room_not_found: 'No table under that code.',
    room_paused: 'The game is paused. Wait for the host.',
    room_plays_aloud: 'This table answers aloud, with no screen to join on.',
    screen: {
      description:
        'The game hit something it could not carry on from. Reloading almost always fixes it — and if the site updated while this tab was open, it always does.',
      reload: 'Reload the page',
      title: 'Something broke'
    },
    sheet_not_full:
      'Every line needs a word on the letter before calling stop.',
    spoken_needs_two_teams:
      'Team by team needs two teams with somebody in each.',
    stale_round: 'That round is already over.',
    teams_locked: 'The teams cannot change that way now.',
    wall_dismissed: 'The host let this screen go.',
    wall_not_paired:
      'This screen is not paired. Pair it from the device running the table.',
    wrong_phase: 'Too late, the game has moved on.'
  },
  estimate: {
    answer: {
      label: 'Your estimate',
      send: 'Send',
      sent: 'Your estimate is in. Waiting for the others.'
    },
    asks: {
      area: { country: 'How large is it?' },
      elevation: { mountain: 'How high is it?' },
      height: { building: 'How tall is it?' },
      length: { river: 'How long is it?' },
      population: {
        city: 'How many people live here?',
        country: 'How many people live here?'
      }
    },
    home: {
      description:
        'A question whose answer is a number — how many people live in Japan, how high is Mont Blanc, how long is the Loire — and everyone types an estimate. Nobody has to know: the three closest score, and the reveal lines every guess up against the truth.'
    },
    line: {
      divided: '÷{factor}',
      times: '×{factor}'
    },
    name: 'Close enough',
    play: 'Play Close enough',
    reveal: {
      over: 'Too high · ×{factor}',
      spotOn: 'Spot on',
      under: 'Too low · ÷{factor}',
      yours: 'You said {guess}'
    },
    roundDuration: 'Time to estimate',
    scoring:
      'A question whose answer is a number, and everyone types an estimate. The three closest score 30, 20 and 10 points; ten times off or more scores nothing. No bonus for speed.',
    tagline: 'Nobody knows. Who comes closest?',
    unitNames: {
      kilometres: 'km',
      metres: 'm',
      people: 'people',
      squareKilometres: 'km²'
    },
    units: {
      kilometres: '{value}\u00a0km',
      metres: '{value}\u00a0m',
      people: '{value} people',
      squareKilometres: '{value}\u00a0km²'
    }
  },
  higherlower: {
    answer: {
      counter: 'Pair {index:number} of {count:number}',
      sent: 'Your pick is in. Waiting for the others.'
    },
    asks: {
      area: { country: 'Which is larger?' },
      elevation: { mountain: 'Which is higher?' },
      height: { building: 'Which is taller?' },
      length: { river: 'Which is longer?' },
      population: {
        city: 'Which has more people?',
        country: 'Which has more people?'
      }
    },
    dealt: 'Two names. Which is bigger?',
    home: {
      description:
        'Two cities, two rivers, two mountains: which one has more people, which is longer, which is higher? One pair a round, one pick, and the reveal puts both numbers up.'
    },
    name: 'Higher or lower',
    play: 'Play Higher or lower',
    reveal: {
      higher: 'the bigger one',
      score: '{right:number} of {count:number} right',
      yourPick: 'your pick'
    },
    roundDuration: 'Time to pick',
    scoring:
      'Two things of the same kind — two cities, two rivers, two mountains — and you pick the bigger one. A right pick scores 10 points, plus a bonus for picking fast.',
    tagline: 'Two names. Which one is bigger?'
  },
  home: {
    opening: 'Opening the table…',
    resume: 'Back to table',
    shelf: 'The games',
    shelfHint: 'One press opens a table on that game.',
    title: 'Mêlée'
  },
  host: {
    answered: defineTranslation('{count:plural} of {total:number} in', {
      plural: { count: { other: '{?}' } }
    }),
    answerMode: {
      buzzer: 'First to buzz',
      choice: 'Four choices',
      colour: 'Rebuild the colour',
      label: 'How to answer',
      move: 'Move the match',
      number: 'Type a number',
      order: 'Put them in order',
      pairs: 'Pick the bigger one',
      point: 'Pin it on the map',
      spoken: 'Team by team',
      typed: 'Type it',
      vote: 'Vote for someone'
    },
    answerWindow: {
      label: 'Time to answer after a buzz'
    },
    /** A seat taken while a game runs, said for a few seconds and gone. */
    arrival: '{nickname} joins',
    autoAdvance: 'Time before the next round',
    backToRoom: 'Back to the table',
    closeRoom: {
      confirm: 'Yes, close it',
      label: 'Close the table',
      warning: 'Everyone is sent out, and the code stops working.'
    },
    countdown: 'Countdown',
    endGame: 'End the game',
    evening: {
      actions: 'Options for {name}',
      add: 'Add a game',
      addHint: 'Another game, or the same one set up differently',
      challengeLine:
        'Its line is picked when its round comes up, from three: your own lines first, then the bank.',
      chance: {
        among: 'among {games}',
        drawn: '{count:number} by chance',
        endless: 'Then by chance, until you stop',
        over: 'too many for {total:number} rounds',
        overHint: 'Every planned game is played once, so it needs more rounds.',
        raise: 'Make it {count:number}'
      },
      detail: {
        allSubjects: 'Every subject',
        oneGo: 'One go each',
        subjects: '{count:number} subjects'
      },
      drag: 'Move round {number:number}, {name}',
      draw: {
        add: 'Add a game to the draw',
        addHint: 'Drawn only, without a planned round',
        brought:
          'A game you bring the content for is played once, so it is never drawn.',
        empty: 'No game in the draw: any planned game can come up.',
        heading: 'Drawn by chance',
        inDraw: 'Drawn',
        inDrawNamed: '{name} in the draw',
        onlyDrawn: 'Drawn only',
        said: 'Every round past the planned ones is drawn among these games.',
        takeOut: 'Take {name} out of the draw'
      },
      duplicate: 'Duplicate',
      earlier: 'Earlier',
      fills: 'Fills the rest',
      fixed: 'Already played: it no longer changes.',
      later: 'Later',
      next: 'Still to come',
      once: 'Played once',
      pick: 'Add a game',
      pickHint:
        'A game you bring the content for is played once. The others fill the rounds you have not prepared.',
      planned: defineTranslation('{count:plural}', {
        plural: { count: { one: 'Planned', other: 'Planned {?}×' } }
      }),
      roundNamed: 'Round {number:number}: {name}',
      rounds: 'Planned games',
      settings: 'Set up',
      slateKeyLater: 'Its answers are typed once it is up next.',
      span: {
        all: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: '{?} round',
              other: '{?} rounds'
            }
          }
        }),
        endless: 'until you stop',
        from: 'from round {from:number}',
        last: 'round {number:number}',
        rest: 'rounds {from:number} to {to:number}'
      },
      stamp: {
        beyond: 'Past the end',
        count: '{count:number}×',
        first: 'First',
        next: 'Next',
        now: 'Now',
        once: 'Once',
        played: 'Played'
      },
      takenOut: '{name} taken out',
      undo: 'Undo'
    },
    final: {
      nobody: 'Nobody scored',
      tied: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'share first place on {?} point',
            other: 'share first place on {?} points'
          }
        }
      }),
      wins: defineTranslation('{points:plural}', {
        plural: {
          points: { one: 'wins with {?} point', other: 'wins with {?} points' }
        }
      })
    },
    game: {
      label: 'What we’re playing',
      prompt: 'Pick a game to plan it. You can add others to play in a row.'
    },
    hostDecides: 'You decide',
    inPlay: defineTranslation('{count:plural} of {total:number} in play', {
      plural: { count: { other: '{?}' } }
    }),
    /** On a judged answer mode and on the box of a game judged however it is answered. */
    judgedMark: {
      host: 'Host judges',
      you: 'You judge, sitting out'
    },
    lineUp: {
      takeOut: 'Take it out'
    },
    needsGame: 'Pick what the table is playing',
    needsPlayer: 'You need at least one at the table',
    /** Beside *Next round*: opens it as two seats of two teams head to head, the room watching. */
    nextDuel: 'As a duel',
    nextRound: 'Next round',
    /**
     * The console's own panel beside the stage, or its screens behind a tab bar
     * below the split. `stage` is the bar's first tab, the game itself.
     */
    panel: {
      fold: 'Fold the panel',
      label: 'Run the table',
      /** Past the lobby, in place of the teams and the board the server no longer lets change. */
      settled: 'Settled for this game',
      tabs: {
        game: 'Games',
        players: 'Players',
        room: 'Room',
        stage: 'Play',
        table: 'Table'
      },
      toLeft: 'Move the panel to the left',
      toRight: 'Move the panel to the right',
      unfold: 'Open the panel'
    },
    /** The reveal of a turn with another team still to play its round. */
    playAgain: 'Play again',
    players: {
      count: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} player', other: '{?} players' } }
      }),
      removeNamed: 'Remove {nickname}'
    },
    /** The console laid out in three zones while a wall shows the game. */
    podium: {
      /** Names the roster's row menu, whose trigger is a bare glyph. */
      actions: 'Options for {nickname}',
      close: 'Close the settings',
      empty:
        'Nobody yet. Read {code} aloud, or show the QR code on the room’s screen.',
      /** The roster's summary on a narrow screen, after its first three seats. */
      more: '+{count:number}',
      pointsHint:
        '− and +: {points:number} points a press, for an answer the game did not see.',
      roster: 'Players',
      settings: 'Settings',
      tied: 'tied'
    },
    recovery: {
      action: 'Run the table from here',
      description: 'It is in the host’s Room tab, under This screen.',
      field: 'Recovery code',
      hint: 'Type it elsewhere to run the table from there.',
      invalid: 'That is not a recovery code.',
      refused: 'That code does not match this table.',
      retry: 'Try again',
      reveal: 'Show the recovery code'
    },
    reveal: 'Give it away',
    /** The console's Room tab: the room drawn from above, each shape the button for what it does. */
    roomScene: {
      here: {
        mark: 'Here',
        name: 'This screen',
        playsToo: 'You play on it too.',
        runs: 'This screen runs the table.',
        showsGame: 'It shows the game and plays the sound.',
        state: 'you run it'
      },
      label: 'The room from above',
      seat: {
        betweenRounds: 'You can take a seat between two rounds.',
        free: 'free',
        launchSeats:
          'Nobody has sat down yet: starting the game gives you a seat.',
        lines:
          'You run the table without playing. Take a seat to answer from this screen, as everyone does from theirs.',
        name: 'Your seat',
        title: 'Play too',
        titleTaken: 'Your seat at the table'
      },
      table: {
        count: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: '{?} player',
              other: '{?} players'
            }
          }
        }),
        empty: 'Nobody at the table yet',
        emptyButYou: 'Nobody else at the table yet'
      },
      wall: {
        anotherLines:
          'It shows the game too, without the sound: one screen plays it. Open Mêlée on it, choose “Become the room’s screen”, then type the code it shows here.',
        anotherTitle: 'One more screen',
        dismiss: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: 'Let the room’s screen go',
              other: 'Let the room’s screens go'
            }
          }
        }),
        linesOff:
          'For now, this screen shows the game and plays the sound. Nothing else is needed: the table plays fine like this.',
        linesOn: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: 'It shows the game and plays the sound; this screen stays silent and keeps the controls.',
              other:
                'They show the game, one of them plays the sound; this screen stays silent and keeps the controls.'
            }
          }
        }),
        name: 'The room’s screen',
        off: 'none for now',
        on: defineTranslation('{count:plural}', {
          plural: { count: { one: 'connected', other: '{?} connected' } }
        }),
        pairLines:
          'Open Mêlée on it and choose “Become the room’s screen”, then type the code it shows here.',
        pairTitle: 'A screen nearby',
        tabTitle: 'Or a tab of this one',
        titleOff: 'Put the game on another screen',
        titleOn: 'The room’s screen'
      }
    },
    roundCount: {
      open: 'No end',
      openSummary: 'Until you stop',
      summary: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} round', other: '{?} rounds' } }
      })
    },
    rounds: 'Rounds',
    saved: {
      door: 'Saved line-ups',
      doorCount: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} kept', other: '{?} kept' } }
      }),
      doorEmpty: 'Keep this one to run it again another time',
      empty: 'No line-up kept yet. Name this one to run it again another time.',
      endless: 'No end',
      export: 'Export',
      exportFileName: 'melee-line-ups.json',
      forget: 'Forget {name}',
      heading: 'Saved line-ups',
      import: 'Import',
      imported: defineTranslation('{evenings:plural}, {lines:plural}.', {
        plural: {
          evenings: {
            one: '{?} line-up imported',
            other: '{?} line-ups imported',
            zero: 'No line-up imported'
          },
          lines: {
            one: '{?} new line added',
            other: '{?} new lines added',
            zero: 'no new line'
          }
        }
      }),
      importRefused: 'This file is not a Mêlée export.',
      inLobby: 'A saved line-up is run before the first round.',
      loaded: 'Running “{name}”',
      name: 'Name this line-up',
      replace: 'Replace',
      replaces:
        'A line-up is already kept under this name: this one takes its place.',
      rounds: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} round', other: '{?} rounds' } }
      }),
      run: 'Run {name}',
      save: 'Keep it',
      savedOver: '“{name}” is up to date',
      saveOver: 'Save over it',
      saveOverNamed: 'Save over “{name}”',
      transferHint:
        'Your line-ups and your lines fit in one file, to pick up on another machine.'
    },
    seat: {
      action: 'Take a seat',
      /**
       * What the seat costs, which is not the same thing in a game with no
       * answer to hold back: there the screen is the whole of it, and promising
       * a hidden answer would name something the round does not have.
       */
      cost: {
        hiddenAnswer: 'You stop seeing the answer before everyone else.',
        sharedScreen: 'You race on the screen the whole table is watching.'
      },
      label: 'Play from this screen, as',
      leave: 'Give up the seat',
      offer: 'Play from this screen',
      sittingOut: 'You judge this round, and play again from the next.',
      taken: 'You are playing as {nickname}.',
      /**
       * Why there is no seat here, one line per `SeatWithheldReason`. `mode`
       * names the way out rather than the rule, because the strip that undoes
       * it is on the same screen a few lines up.
       */
      withheld: {
        aloud:
          'The teams answer aloud and you judge them, so there is no seat here.'
      }
    },
    seconds: '{seconds:number}s',
    seeResults: 'See the results',
    setup: {
      group: {
        room: 'The room',
        table: 'The table'
      },
      roundInPlay: 'Changes apply from the next round',
      summary: {
        countdown: 'Countdown of {duration}',
        hold: 'Answer up for {duration}',
        holdOpen: 'Next round when you say'
      },
      volume: 'Volume on this screen'
    },
    skipRound: 'Skip this round',
    standings: 'Standings',
    startGame: 'Gather round',
    /** The room's own screen while the teams sit down: the evening's card and the trays under it. */
    table: {
      arrivals: {
        chosen: '{count:number} at the table, picking their teams',
        drawn: '{count:number} at the table, waiting for the draw',
        seats: '{count:number} at the table, each with a pawn on Start'
      },
      evening: 'Team games',
      eveningSeats: 'Party games',
      rules: {
        points: defineTranslation(
          '{rounds:plural}: the team that scores most wins.',
          {
            plural: { rounds: { one: '{?} round', other: '{?} rounds' } }
          }
        ),
        pointsOpen: 'The team that scores most wins.',
        seatTrack: defineTranslation(
          '{rounds:plural}, {length:number} squares: the first one home wins.',
          { plural: { rounds: { one: '{?} round', other: '{?} rounds' } } }
        ),
        seatTrackOpen: '{length:number} squares: the first one home wins.',
        track: defineTranslation(
          '{rounds:plural}, {length:number} squares: the first team home wins.',
          { plural: { rounds: { one: '{?} round', other: '{?} rounds' } } }
        ),
        trackOpen: '{length:number} squares: the first team home wins.'
      }
    },
    /** How the rounds from here are played, offered where a round can be one team's. */
    verdict: {
      right: 'Right',
      showAnswer: 'Show me the answer',
      wrong: 'Wrong'
    }
  },
  innerclock: {
    counted: defineTranslation('{seconds:number} s', {
      number: {
        seconds: { maximumFractionDigits: 1, minimumFractionDigits: 1 }
      }
    }),
    endCount: 'Stop the count',
    gap: defineTranslation('{seconds:number} s', {
      number: {
        seconds: {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
          signDisplay: 'exceptZero'
        }
      }
    }),
    go: 'Count.',
    hint: 'One press, when you think you are there. Nothing will move until the end.',
    home: {
      description:
        'The wall gives a number of seconds, then every screen goes still: no clock, nothing that moves. Count in your head and press once when you think you are there — the closer you stop, the more you score. The table is welcome to put you off out loud.'
    },
    name: 'Inner clock',
    nobody: 'Nobody pressed',
    play: 'Play Inner clock',
    press: 'Stop',
    pressed: 'Stopped. Somebody is still counting.',
    prompt: {
      after: 'seconds in your head',
      before: 'Count to'
    },
    scoring:
      'Count in your head and press once. 30 points on the dot, nothing a quarter of the count away — the closer, the more.',
    silent: 'never pressed',
    tagline: 'Count in your head. Stop on the dot.',
    target: {
      description: 'Seconds, from 10 to 180.',
      draw: 'Draw another',
      label: 'Count to'
    }
  },
  invite: {
    action: 'Invite',
    copied: 'Copied',
    copyCode: 'Copy the code',
    copyFailed: 'Could not copy',
    copyLink: 'Copy the link',
    documentTitle: 'Invitation — Mêlée',
    joinLate: 'Join any time',
    nextRound: 'Anyone who arrives during a round plays from the next one.',
    project: 'Show the QR code, big',
    share: 'Share',
    shareTitle: 'Join table {code} on Mêlée',
    title: 'Scan to play',
    typeIt: 'Type it to join',
    unknown: {
      description:
        'That code opens no table. It may have been closed, or read wrong.',
      title: 'No table here'
    }
  },
  join: {
    host: {
      action: 'Open a table'
    },
    player: {
      action: 'Join',
      title: 'Join a table'
    },
    /**
     * The door beside *open a table*: the table opens with whoever pressed it
     * already seated and the first round under way, and stays open to anyone
     * arriving after. Never *solo*, because the others can still come.
     */
    rightAway: {
      action: 'Play right away',
      as: 'As {nickname}',
      change: 'Change',
      name: 'What should we call you?',
      starting: 'Setting the table…'
    },
    roomCode: {
      label: 'Table code',
      unknown: 'No table under that code.',
      unsupportedCharacters: 'A table code never contains {characters}.',
      wrongLength: defineTranslation('{length:plural}', {
        plural: {
          length: {
            one: 'A table code is {?} character long.',
            other: 'A table code is {?} characters long.'
          }
        }
      })
    }
  },
  legal: {
    host: {
      body: 'Mêlée is hosted, and its tables are run, by:',
      heading: 'Host'
    },
    intro:
      'Who publishes Mêlée, what it keeps about the people who play and for how long, and how to change that.',
    measurement: {
      body: 'Visits are counted by a tool I built and run myself, at analytics.adrienlcp.com, without cookies. A page view records the page’s address, the site you came from, your browser’s language and theme, the width of its window and how fast the page loaded. It records no IP address, and nothing that tells one visitor from another.',
      counted: 'Your visits are counted, anonymously.',
      exemption:
        'This measurement needs no consent under the CNIL’s guidelines, and you can still refuse it for this browser.',
      heading: 'Audience measurement',
      refused: 'Your visits are not counted in this browser.',
      refusedByBrowser:
        'Your browser sends Global Privacy Control, so your visits are never counted.',
      retention: defineTranslation(
        'Each record is kept {months:plural} at most.',
        {
          plural: { months: { one: '{?} month', other: '{?} months' } }
        }
      ),
      saveFailed:
        'Your browser did not keep this choice. Try again, or turn on Global Privacy Control.',
      storageBlocked:
        'This browser blocks site storage, so a refusal cannot be kept here. Turning on Global Privacy Control in your browser refuses measurement on every site.',
      switch: 'Count my visits'
    },
    publisher: {
      address:
        'As a non-professional publisher, I give the host’s identity in place of a postal address (LCEN, article 6-III-2).',
      body: 'Mêlée is published by {name}, a private individual, not a business. You can write to me through <contact>this contact page</contact>.',
      heading: 'Publisher'
    },
    rights: {
      body: 'Under the GDPR, you may access, correct or erase what concerns you, or object to its use. Most of it lives in your browser, and clearing this site’s data erases it. For the rest, ask through <contact>the contact page</contact>; I answer within a month.',
      complaint:
        'If you believe your rights are not respected, you may lodge a complaint with the <authority>CNIL</authority>.',
      heading: 'Your rights'
    },
    storage: {
      analyticsOptOut:
        'Your refusal of audience measurement, if you turn it off below.',
      challengeLines:
        'The challenge lines the host wrote in advance, and which of them have been played.',
      device:
        'Mêlée sets no cookies. What it remembers stays in your browser, for this site only, until you clear it:',
      heading: 'What Mêlée keeps',
      hostSetup:
        'How you set up the last table you ran, game by game, so the next one opens the same way.',
      hostTokens:
        'The key to each table you opened, which lets you take it back from another screen. Forgotten after a day.',
      lineUpGames:
        'The games of the last table you ran, ticked again on the next table you open.',
      locale: 'The language you picked.',
      logs: 'Cloudflare keeps a log of each request for three days, to find what broke: it holds your IP address and your browser’s name beside the table’s code, and never a nickname or an answer.',
      nickname:
        'The name you last played under, so the next table fills it in for you.',
      panelFolded:
        'Whether you last folded the panel beside the table you run.',
      panelSide: 'Which side of the screen you put that panel on.',
      savedEvenings:
        'The line-ups you saved under a name, each game with its settings, to run them again.',
      seats:
        'The seat you hold at each table you joined, so a reload or a locked screen brings you back to it with your score. Forgotten after a day.',
      server:
        'While a table is played, Cloudflare’s servers hold it: the nicknames at it, the answers given, the scores and the settings. It is deleted when the host closes the table, or an hour after the last screen leaves it. There are no accounts, and nothing about you outlives the table.',
      session:
        'One more is kept for the open tab alone, and goes when it closes:',
      slateKeys:
        'The answers to a slate the host typed in advance, before the table opens.',
      theme: 'The theme you picked: light, dark or your system’s.',
      volume: 'The volume of the screen that plays the music.'
    },
    thirdParties: {
      cloudflare:
        'Cloudflare, the host, receives your IP address with every request, to deliver the page and protect the site from abuse. Opening a table counts against your IP address for one minute, so that nobody can open hundreds.',
      deezer:
        'The blind test takes its music from Deezer. What the host searches for, or the playlist they name, is sent to Deezer by Mêlée’s server, with nothing about you. The 30-second clips and the album covers, though, are loaded by your browser straight from Deezer’s servers, which therefore receive your IP address and your browser’s name. <policy>Deezer’s privacy policy</policy> applies to them.',
      heading: 'Who else receives your data',
      nobodyElse:
        'No other service is called. The typefaces are served by Mêlée itself, and the QR code is drawn in your browser.'
    },
    title: 'Legal notice and privacy'
  },
  /**
   * The app itself arriving, which is the one wait with nothing more specific
   * to say: at this point the route has not resolved and no room is known.
   */
  loading: 'Loading…',
  matchsticks: {
    duration: 'Time per puzzle',
    goal: {
      biggest: 'Move one match to make the biggest number',
      equation: 'Move one match to make it true',
      smallest: 'Move one match to make the smallest number'
    },
    goals: {
      biggest: 'Biggest number',
      equation: 'Equations',
      label: 'Puzzles',
      smallest: 'Smallest number'
    },
    home: {
      description:
        'A false equation drawn in matches — or a number to make as big, or as small, as one match allows. Everyone picks a match up on their own screen and lays it somewhere else: the answer pays most, the next best numbers a little less, and the clock adds to it. Or play it aloud: first to buzz says which match moves and where, and the host says right or wrong. Every puzzle is dealt fresh, so the game never runs out, and every one has an answer.'
    },
    move: {
      groove:
        'Empty place {slot}, in the {glyph} at position {position:number}',
      label: 'The matches',
      layDown: 'Now lay it on an empty place.',
      pickUp: 'Pick up a match and lay it somewhere else.',
      placed: 'Send this move, or move a match again.',
      send: 'Send',
      sent: 'Your move is in. Waiting for the others.',
      slot: {
        a: 'at the top',
        b: 'top right',
        c: 'bottom right',
        d: 'at the bottom',
        e: 'bottom left',
        f: 'top left',
        g: 'in the middle',
        h: 'across',
        v: 'upright'
      },
      stick: 'Match {slot}, in the {glyph} at position {position:number}',
      undo: 'Put it back',
      unreadable: 'Matches that read as no digits or signs'
    },
    name: 'Matchsticks',
    play: 'Play Matchsticks',
    reveal: {
      right: 'right',
      second: 'second best',
      short: 'better, not by enough',
      third: 'third best',
      title: 'The move:',
      wrong: 'not it',
      yours: 'Your move:'
    },
    scoring:
      'One stick to move. First in says the move out loud, and the host says right or wrong — 10 points for right.',
    scoringMove:
      'One match to move, everyone at once. The answer is 30 points — on a number, the next best 20 and the one after 10 — and the clock adds to it.',
    tagline: 'One match moves. Find which.'
  },
  menu: {
    build: 'Build {build}',
    fullscreen: {
      enter: 'Full screen',
      exit: 'Leave full screen'
    },
    home: 'Home',
    install: {
      action: 'Install Mêlée',
      /** Safari's own words for the two steps, which is what the visitor will look for. */
      apple: 'To install it: Share, then “Add to Home Screen”.'
    },
    label: 'Menu',
    leaveRoom: 'Leave the table',
    /**
     * `label` names the row and its summary is the name itself, which is the
     * only place a screen that skipped the join form ever shows it. `field` is
     * what the empty box below asks for, and it says *new* because the row
     * above is already carrying the old one.
     */
    nickname: {
      action: 'Change',
      field: 'New nickname',
      label: 'Nickname'
    },
    /**
     * Points by hand, for a bonus nobody planned or a challenge played at the
     * table. `give` and `take` name a row's + and − for whoever cannot see the
     * name they sit beside.
     */
    points: {
      give: '{points:number} points more for {name}',
      label: 'Points',
      take: '{points:number} points less for {name}',
      teams: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} team', other: '{?} teams' } }
      })
    },
    /** Said by the host, about the machine rather than the table: it outlives the room. */
    thisDevice: {
      qrCode: {
        action: 'Show it',
        description: 'For a screen by the door, without joining the game.',
        label: 'Show a table’s QR code'
      },
      title: 'This device',
      wall: {
        label: 'Become the room’s screen'
      }
    }
  },
  mostlikely: {
    ballot: {
      label: 'Who is it?',
      sent: 'Your vote is in. Waiting for the others.',
      you: 'You'
    },
    home: {
      description:
        'A line goes up — who is most likely to talk to their plants? — and everyone votes for one of the people at the table, themselves included. Nobody sees who voted for whom: the reveal counts the votes, and everyone who voted with the table scores.'
    },
    name: 'Most likely',
    play: 'Play Most likely',
    reveal: {
      chose: 'The table chose',
      nobody: 'Nobody: the votes went every which way.',
      votes: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} vote', other: '{?} votes' } }
      }),
      yourVote: 'Your vote'
    },
    roundDuration: 'Time to vote',
    scoring:
      'A line about one of you goes up and everyone votes for a seat, their own included. Vote with the room and you score 10 points. No bonus for speed.',
    tagline: 'One line, one of you. Who is it?'
  },
  /**
   * The way back to the front door, from any page that is a dead end without
   * one. Three screens show it — nothing here, a refused socket, the credits —
   * and one destination is named one way or the product has three fronts.
   */
  navigation: {
    back: 'Back to the games',
    skipToContent: 'Skip to content'
  },
  notFound: {
    description: 'That game is over, or the code was mistyped.',
    documentTitle: 'Nobody here — Mêlée',
    title: 'Nobody here'
  },
  petitbac: {
    category: {
      animal: 'Animal',
      bodyPart: 'Body part',
      brand: 'Brand',
      cartoonCharacter: 'Cartoon character',
      cheese: 'Cheese',
      city: 'City',
      clothing: 'Clothing',
      colour: 'Colour',
      country: 'Country',
      dish: 'Dish',
      drink: 'Drink',
      famousPerson: 'Famous person',
      fictionalCharacter: 'Fictional character',
      film: 'Film',
      firstName: 'First name',
      fruitOrVegetable: 'Fruit or vegetable',
      gift: 'Gift',
      hobby: 'Hobby',
      instrument: 'Musical instrument',
      job: 'Job',
      kitchenThing: 'Something in a kitchen',
      lateExcuse: 'Excuse for being late',
      plant: 'Plant',
      series: 'TV series',
      singer: 'Singer',
      sport: 'Sport',
      thingInABag: 'Something in a bag',
      tool: 'Tool',
      toy: 'Toy',
      vehicle: 'Vehicle'
    },
    home: {
      description:
        'A letter comes up and every screen gets the same sheet — a country, an animal, a first name — to fill with words starting with it. The first to fill theirs can call stop. Then the room votes on each category, and a word nobody else wrote pays double.'
    },
    host: {
      cancelStop: 'Cancel the stop',
      nextCategory: 'Next category',
      toScores: 'Show the scores'
    },
    letter: 'Letter {letter}',
    name: 'Categories',
    play: 'Play Categories',
    reveal: {
      outcome: {
        empty: 'Blank',
        offLetter: 'Not a {letter}',
        refused: 'Doesn’t count',
        shared: 'Shared',
        unique: 'Nobody else'
      },
      strike: 'Strike out: {answer}',
      strikeHint: 'Pick a word to strike it out or put it back',
      title: 'Your sheet'
    },
    scoring:
      'One letter, a word for each category. The table votes on every answer: one nobody else wrote scores 20 points, one you shared scores 10.',
    setup: {
      add: 'Add',
      bank: 'Ready-made',
      categories: 'Categories',
      count: 'Categories per round',
      drawn: 'New each round',
      duration: 'Time to write',
      fixed: 'Same every round',
      letters: 'Letters that can come up',
      new: 'A category of your own',
      newPlaceholder: 'Something green',
      own: 'Your own categories',
      remove: 'Remove {label}',
      stop: 'A full sheet can call stop',
      summary: defineTranslation(
        '{count:plural} · between {min:number} and {max:number}',
        { plural: { count: { one: '{?} category', other: '{?} categories' } } }
      )
    },
    sheet: {
      field: '{category}, starting with {letter}',
      label: 'Your sheet'
    },
    stop: {
      barred: 'Your stop was taken back: the others finish the round.',
      called: '{name} said stop',
      calledByYou: 'You said stop',
      filling: 'Stop · {filled:number}/{count:number}',
      offLetter: 'To stop, every line needs a word starting with {letter}.',
      press: 'Stop!'
    },
    tagline: 'One letter. Fill every line.',
    vote: {
      done: 'Done',
      doneCount: defineTranslation(
        '{done:plural} · the vote moves on once everyone is done',
        { plural: { done: { other: '{?} done' } } }
      ),
      moveOn: 'The vote moves on once everyone is done.',
      of: '{index:number} of {count:number}',
      refuse: 'Doesn’t count',
      refuseRow: 'Doesn’t count: {answer}',
      yours: 'Yours'
    },
    wall: {
      against: '{refusals:number} against',
      grid: 'Every sheet of the round, letter {letter}',
      legendNothing: 'Doesn’t count, not a {letter} or blank · nothing',
      lines: 'The categories',
      progress: '{filled:number}/{count:number}',
      roundTotal: 'Round',
      sheets: 'Lines filled'
    }
  },
  player: {
    /** A seat whose screen has gone quiet — beside that name, on every board. */
    away: 'away',
    /** A seat that pressed *ready* between two rounds, said to a screen reader beside its name. */
    back: 'back at the table',
    choosingGame: 'The host is choosing a game',
    final: {
      placing: 'You finished',
      rank: defineTranslation('{rank:plural}', {
        plural: {
          rank: {
            few: '{?}rd',
            one: '{?}st',
            other: '{?}th',
            two: '{?}nd',
            type: 'ordinal'
          }
        }
      })
    },
    lineUp: {
      ready: 'Ready'
    },
    midRound: {
      detail: 'Your seat is safe — this\u00a0round started without you.',
      title: 'Next round'
    },
    nickname: {
      action: 'Join',
      label: 'Nickname',
      title: 'What should we call you?'
    },
    points: defineTranslation('{points:plural}', {
      plural: { points: { one: 'point', other: 'points' } }
    }),
    room: 'Table {code}',
    roomSize: '{count:number} at the table',
    score: '{points:number}',
    seating: 'Taking your seat…',
    standing: {
      /** The room's board, reduced to the two facts a screen held in a hand needs. */
      ofRoom: defineTranslation('{rank:plural} of {count:number}', {
        plural: {
          rank: {
            few: '{?}rd',
            one: '{?}st',
            other: '{?}th',
            two: '{?}nd',
            type: 'ordinal'
          }
        }
      })
    },
    /** Names the lobby roster for a reader who cannot see whose names those are. */
    table: 'At the table',
    upNext: 'You are about to play',
    you: 'You'
  },
  preferences: {
    language: 'Language',
    theme: {
      dark: 'Dark',
      label: 'Theme',
      light: 'Light',
      system: 'System'
    },
    volume: 'Volume'
  },
  quiz: {
    adult: {
      label: 'Include adult questions'
    },
    category: {
      arts: 'Arts and culture',
      capitals: 'Capitals',
      cinema: 'Cinema',
      everyday: 'Everyday',
      flags: 'Flags',
      geography: 'Geography',
      history: 'History',
      label: 'Which subjects',
      none: 'Pick none and you get every subject.',
      quotes: 'Quotes',
      rebus: 'Rebus',
      science: 'Science',
      silhouettes: 'Silhouettes',
      sport: 'Sport',
      videogames: 'Video games'
    },
    duration: 'Time per question',
    flag: {
      alt: 'The flag to name'
    },
    home: {
      description:
        'History, science, sport, and questions nobody sees coming. Everyone answers at once, and the fastest right answer takes the round.'
    },
    language: 'Question language',
    name: 'Quiz',
    play: 'Play Quiz',
    rebus: {
      alt: 'The rebus to read:'
    },
    reveal: {
      title: 'The answer was'
    },
    scoring: {
      buzzer:
        'First to buzz answers out loud, and the host says right or wrong. 10 points for right — and a wrong answer sits you out for the rest of the round.',
      choice:
        'Four answers, everyone at once. The right one scores 10 points, and the earlier you find it the more the clock adds — up to double.',
      typed:
        'Everyone types their answer at once. The right one scores 30 points, and the earlier you find it the more the clock adds — up to double.'
    },
    silhouette: {
      alt: 'The country outline to name'
    },
    tagline: 'A question, and the first one who knows it.',
    variant: {
      wellKnown: 'Crowd-pleasers'
    },
    wellKnown: {
      hint: 'Fewer to draw from, but nobody is left stuck.',
      label: 'Stay on the crowd-pleasers'
    }
  },
  reflex: {
    falseStart: {
      detail: 'You watch this one from the bench.',
      title: 'Gone before the screen changed.'
    },
    flip: 'GO',
    hold: 'Press before it changes and you sit the round out.',
    home: {
      description:
        'Nothing to know and nothing to say. The screen holds still, then it changes — and the first in takes the round. Go before it changes and you watch that one from the bench.'
    },
    landed: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} player in', other: '{?} players in' } }
    }),
    name: 'Reflex',
    nobody: 'Nobody moved',
    play: 'Play Reflex',
    pressed: 'In.',
    reaction: '{milliseconds:number} ms',
    scoring:
      'The screen changes, and the first in takes the 10 points. Go before it changes and you sit the round out.',
    tagline: 'The screen changes. First in wins.',
    tooEarly: 'too early',
    waiting: 'Watch the screen.'
  },
  room: {
    documentTitle: '{game} — Mêlée',
    documentTitleLobby: 'Mêlée',
    pause: {
      detail: 'The round picks up where it stopped.',
      press: 'Pause',
      resume: 'Resume the game',
      title: 'Paused'
    }
  },
  round: {
    answer: {
      correct: 'You got it. Sit back.',
      label: 'Your answer',
      /**
       * Read together with `retry` under the field: this half says what the
       * guess did, that half says the way out. It is proof of delivery as much
       * as a grade — without it a wrong guess and a dropped frame look alike.
       */
      missed: 'Not that one.',
      retry: 'As many goes as you like.',
      submit: 'Send it',
      waiting: defineTranslation('{count:plural}', {
        plural: { count: { other: '{?} in so far' } }
      })
    },
    /**
     * What the round paid, on the screen the whole room is watching. The clock's
     * share is split off rather than folded in, in the `+N` the product uses
     * everywhere else, because a lone `+4` beside a `+2` says only that two
     * players differ — the split is the rule saying itself, and it is how the
     * table learns that answering early pays without anybody explaining it.
     */
    award: '{points:number}',
    awardWithSpeed: '{answer:number} +{speed:number}',
    /** One entry of an evening's line-up nothing else tells from another of its game. */
    entryNumbered: '{name} {number:number}',
    index: 'Round {index:number} of {total:number}',
    indexOpen: 'Round {index:number}',
    /** The word printed before the round's figures, which alone read as a score. */
    label: 'Round',
    /**
     * The zero arm of `scored`, and the reason the reveal draws a block on
     * every player's screen rather than only on the ones that gained: a round
     * that paid you nothing is a result, and a screen that says nothing about
     * it leaves its owner to work out from an absence whether it was even
     * scored.
     */
    missed: 'Nothing this time.',
    nobody: 'Nobody got it',
    scored: '+{points:number}',
    /**
     * Why two players who both got it right did not get the same. The clock
     * replaced a rank the room could count, so what it paid has to be said.
     */
    speedBonus: '{points:number} of that for being early',
    speedHalf: '+{points:number}'
  },
  slate: {
    board: {
      close: 'Collect',
      closeItem: 'Collect {item} and mark it now',
      markItem: 'Mark {item}',
      sheets: 'The sheets',
      show: 'Mark',
      state: {
        closed: 'To mark',
        marked: 'Marked',
        open: '{filled:number}/{count:number} written'
      }
    },
    correct: {
      blanks: 'Left blank: {names}',
      finish: 'Show the scores',
      judge: 'Right',
      key: {
        reveal: 'Reveal the answer',
        title: 'The answer'
      },
      next: 'Next',
      nobody: 'Nobody wrote anything for this one.',
      previous: 'Previous'
    },
    home: {
      description:
        'Numbered things to guess — cups to taste, photos, prices — and everyone writes on a sheet nobody else can see, in any order they like. Then the host marks the papers one number at a time, and every answer they accept is worth 10 points.'
    },
    item: 'No. {index:number}',
    itemOf: 'No. {index:number} of {count:number}',
    items: {
      add: 'One more',
      label: 'Things to guess',
      summary: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} thing to guess', other: '{?} things to guess' }
        }
      })
    },
    key: {
      field: 'Answer for {item}',
      hint: 'Kept on this screen, and sent when the sheets open.',
      label: 'Answer key',
      summary: defineTranslation('{count:plural}', {
        plural: { count: { other: 'Hidden · {?} noted' } }
      })
    },
    labels: {
      duplicate: 'Another item already shows this.',
      hint: 'Leave a box empty to keep its number.',
      label: 'Names on the items',
      none: 'Numbered 1, 2, 3…',
      some: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} named', other: '{?} named' } }
      })
    },
    marking: {
      now: 'Being marked'
    },
    name: 'Slate',
    play: 'Play Slate',
    prepare: {
      keys: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} answer noted', other: '{?} answers noted' }
        }
      }),
      title: 'Prepare the sheet'
    },
    progress: '{filled:number}/{count:number}',
    scoring:
      'Everyone fills in their own sheet in private, then the host marks it: 10 points per answer they accept.',
    sheet: {
      blank: 'Left blank',
      closedBeforeYou: 'Collected before you arrived',
      field: 'Your answer for {item}',
      grid: 'Your sheet',
      key: 'Answer: {key}',
      next: 'Next',
      previous: 'Previous',
      saved: 'You can change an answer until the host collects it.',
      tile: {
        empty: '{item}, empty',
        filled: '{item}: {answer}',
        locked: '{item}, collected'
      }
    },
    tagline: 'Everyone writes. Nobody peeks.',
    verdict: {
      pending: 'Waiting for the host…',
      right: 'Accepted',
      wrong: 'Not this time'
    },
    wall: {
      allCollected: 'Every sheet is in.',
      collect: 'Collect the sheets',
      collectRest: 'Collect the rest',
      filling: 'Sheets are open. Write what you think each one is.',
      toList: 'Back to the list',
      toSheets: 'Back to the sheets',
      toWall: 'Back to marking'
    },
    yourAnswer: 'You wrote',
    yourSheet: 'Your whole sheet'
  },
  swatch: {
    answer: {
      hue: 'Hue',
      label: 'Your colour',
      send: 'Send my colour',
      sent: 'Your colour is in. Waiting for the others.',
      tone: 'Shade and brightness'
    },
    hidden: 'Gone. Rebuild it from memory.',
    home: {
      description:
        'A colour comes up on every screen — a dusty teal, a warm ochre — for a few seconds, then hides. Everyone rebuilds it on their own screen, and the reveal lays every guess beside the real one, nearest first. Spot on pays the most, and close still scores.'
    },
    name: 'Shades',
    play: 'Play Shades',
    rebuildDuration: 'Time to rebuild it',
    remember: 'Remember this colour',
    reveal: {
      title: 'The colour',
      yours: 'Yours'
    },
    scoring:
      'A colour shows, hides, and you rebuild it. Spot on is 30 points, falling to nothing the further off it is. No bonus for speed.',
    showDuration: 'Colour shown for',
    tagline: 'One colour, a few seconds. Rebuild it.'
  },
  team: {
    aloud: {
      artist: 'Artist',
      composer: 'Composer',
      confirm: 'Score it',
      film: 'Film',
      hadIt: 'Got it',
      label: 'Who got it?',
      needsScreens: 'Needs a screen in every hand.',
      nobody: 'Nobody got it',
      title: 'Title'
    },
    /**
     * What a team is called until the host renames it, by its pawn's colour.
     * Plural nouns standing alone, so they read as a heading, beside a score
     * and after "Move to" alike.
     */
    colour: {
      pawn1: 'Reds',
      pawn2: 'Blues',
      pawn3: 'Yellows',
      pawn4: 'Greens',
      pawn5: 'Purples',
      pawn6: 'Oranges',
      pawn7: 'Pinks',
      pawn8: 'Teals'
    },
    count: 'How many teams',
    draw: 'Draw the teams',
    drawNeeds:
      'At least {count:number} players to make {count:number} teams — or pick fewer teams.',
    /** Two seats head to head, each named beside its team's pawn. */
    duel: {
      title: '{first} vs {second}'
    },
    empty: 'Nobody yet',
    final: {
      podium: 'Individual podium',
      wins: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'victory with {?} point',
            other: 'victory with {?} points'
          }
        }
      })
    },
    join: 'Join',
    move: {
      label: 'Move {nickname} to another team',
      short: 'Team',
      to: 'To the {team}'
    },
    needsSeats:
      'Teams start at {count:number} players — until then, everyone plays for themselves.',
    pick: 'Pick your team',
    redraw: 'Draw again',
    rename: {
      action: 'Rename the {team}',
      label: 'Team name',
      submit: 'Rename'
    },
    scoring: {
      balanced: 'Balanced',
      balancedHint:
        'Each team scores its average per player, so a bigger team does not win on numbers alone.',
      label: 'Team score',
      sum: 'Added up',
      sumHint: 'Each team scores every point its players make.'
    },
    setting: {
      aloud: 'Aloud',
      aloudHint:
        'Nobody joins: the wall asks, the teams shout, and you tap who got it.',
      aloudNeedsNoPhone:
        'Answering aloud takes a table nobody has joined: ask everyone to leave first.',
      chosen: 'Players choose',
      drawn: 'Drawn',
      label: 'Teams',
      off: 'Every player for themselves'
    },
    summary: {
      aloud: '{count:number} teams answering aloud',
      chosen: '{count:number} teams, players choose',
      drawn: '{count:number} drawn teams',
      off: 'No teams'
    },
    title: 'The teams',
    unassigned: {
      chosen: 'No team yet',
      drawn: 'Waiting for the draw'
    },
    yours: 'Your team'
  },
  timeline: {
    answer: {
      earliest: 'Earliest',
      hint: 'Drag a card, or use its arrows. 1 is the earliest.',
      label: 'Your order, earliest first',
      latest: 'Latest',
      moveDown: 'Move “{event}” later',
      moveUp: 'Move “{event}” earlier',
      send: 'Send my order',
      sent: 'Your order is in. Waiting for the others.'
    },
    dealt: 'Which came first? Put them in order, earliest first.',
    duration: 'Time per round',
    home: {
      description:
        'Five events come up at once — the first steps on the Moon, the fall of the Berlin Wall, the first iPhone, a World Cup final. Everyone puts them in order, earliest first, and the years come out at the reveal. All five right pays the most, and one pair the wrong way round still scores.'
    },
    name: 'Timeline',
    play: 'Play Timeline',
    reveal: {
      perfect: 'In order',
      swapped: defineTranslation('{pairs:plural}', {
        plural: {
          pairs: { one: '{?} pair swapped', other: '{?} pairs swapped' }
        }
      }),
      title: 'The order:',
      unsent: 'The order',
      yours: 'Your order'
    },
    scoring:
      'Five events to put in order, earliest first. All of them right is 30 points, one pair the wrong way round 20, two pairs 10 — and the clock adds to it.',
    tagline: 'Five events. Which came first?'
  },
  wall: {
    arriving: 'The table is on its way…',
    hostAway: {
      takeOver: 'Run the table from here',
      title: 'The host stepped away. The game is waiting for them.'
    },
    menu: {
      description:
        'Open the table on another screen, then type the code it shows.',
      failed: 'That code shows nothing. The screen may have a new one.',
      handOver: {
        hint: 'Scan it from the screen that will run the table. It hands the table to whoever opens it, so keep it to yourself.',
        label: 'Run the table from another screen',
        summary: 'This screen then becomes the room’s.'
      },
      label: 'Screen code',
      openHere: 'Show the game in a new tab',
      pair: 'Show the table there',
      paired: 'Code accepted: the table is on its way to that screen…'
    },
    pair: {
      backToTable: 'Back to my table',
      description:
        'The screen showing {code} will display your table, with no answers and nothing to press.',
      documentTitle: 'Show a table — Mêlée',
      done: 'Your table is on that screen.',
      failed:
        'That did not go through. The code may have expired — the screen shows a new one.',
      nothingHeld: {
        description:
          'Only the screen running a table can show it somewhere else. Scan the square from that one.',
        title: 'No table to show'
      },
      show: 'Show table {room}',
      title: 'Show your table on that screen?'
    },
    pairAgain: 'Pair this screen',
    pairing: {
      caption: 'Scan from the screen running the table',
      codeCaption: 'Or type this code in its menu',
      documentTitle: 'Waiting for a table — Mêlée',
      failed: 'We cannot reach Mêlée for a code.',
      retry: 'Try again',
      title: 'This screen is waiting for its table'
    },
    sound: 'Turn the sound on'
  }
})
