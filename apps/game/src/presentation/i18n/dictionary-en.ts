import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

import { COUNTRY_NAMES_EN } from './country-names-en'

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
      refused: {
        blocked:
          'The browser refused the sound. Allow it for this site, or run the room from another screen.',
        broken:
          'It broke on our side. Try again, or run the room from another screen.',
        unsupported:
          'This screen cannot play the clip. Run the room from another screen.'
      },
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
    reveal: {
      title: 'It was'
    },
    scoring: {
      buzzer:
        'First to buzz answers out loud. The host judges the title and the artist, a point each — a wrong answer sits you out for the rest of the round.',
      choice:
        'Four answers over the same clip, everyone at once. The right one scores a point, and the earlier you find it the more the clock adds — up to double.',
      typed:
        'Everyone types, over the same clip. Title and artist score a point each and both together score three, and the earlier you get it the more the clock adds — up to double.'
    },
    scoringFilm: {
      buzzer:
        'First to buzz answers out loud. The host judges the film and the composer, a point each — a wrong answer sits you out for the rest of the round.',
      typed:
        'Everyone types, over the same clip. Film and composer score a point each and both together score three, and the earlier you get it the more the clock adds — up to double.'
    },
    source: {
      chart: 'Top charts',
      decade: 'A decade',
      film: 'Film scores',
      filmHint:
        'What a composer wrote for a film or a series — not the songs on its soundtrack.',
      label: 'Where the tracks come from',
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
    back: 'Move {team} back a square',
    case: 'Square {case:number} of {length:number}',
    finish: 'Finish',
    fix: 'Fix the squares',
    forward: 'Move {team} forward a square',
    setting: {
      label: 'Board',
      length: '{length:number} squares',
      off: 'None'
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
    running: 'Ask away',
    scoring:
      'First in answers out loud, and the host says right or wrong. A point for right — and a wrong answer sits you out until they let you back in.',
    tagline: 'Your questions, and a race to the buzzer.'
  },
  connection: {
    clock: '· clock ±{milliseconds:number} ms',
    closed: 'Reconnecting',
    connecting: 'Connecting',
    open: 'Live',
    refused: 'Disconnected'
  },
  /**
   * These three sentences are not blurb. CC BY-SA 4.0 §3(a)(1)(B) asks that a
   * modification be indicated, and it is the one item on that list owed
   * whatever the upstream supplied — so each has to stay true to what the
   * ingestion in `apps/server/scripts/` actually does to that bank.
   */
  credits: {
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
    false_start: 'Too soon. Wait for the change.',
    host_already_connected: 'Someone is already running this table.',
    host_away: 'The host stepped away. The round is waiting for them.',
    host_only_action: 'Only the host can do that.',
    host_reconnecting:
      'This table has just lost its host, and is waiting for them.',
    internal_error: 'Something broke on our side. Try again.',
    invalid_message: 'We did not understand that. Try again.',
    joined_mid_round: 'You are in from the next round.',
    music_source_unavailable:
      'The music has stopped answering. Try again in a moment.',
    nickname_taken: 'Someone already took that nickname.',
    no_content_available: 'Nothing left to play. Try other settings.',
    no_game_chosen: 'Pick a game first.',
    not_your_turn: 'Another team is playing this round. Yours is coming.',
    pairing_not_found:
      'That screen code has expired. Open the screen again for a new one.',
    player_locked_out: 'You are out for this round.',
    protocol_version_mismatch: 'This page is out of date. Reload it.',
    rate_limited: 'That is a lot of tables. Wait a minute and retry.',
    removed_by_host: 'The host removed you from the table.',
    room_closed: 'The host closed the table.',
    room_full: 'That table is full.',
    room_not_found: 'No table under that code.',
    screen: {
      description:
        'The game hit something it could not carry on from. Reloading almost always fixes it — and if the site updated while this tab was open, it always does.',
      reload: 'Reload the page',
      title: 'Something broke'
    },
    stale_round: 'That round is already over.',
    teams_locked: 'The teams cannot change that way now.',
    wall_cannot_answer: 'This screen cannot answer this round.',
    wall_not_paired:
      'This screen is not paired. Pair it from the device running the table.',
    wrong_phase: 'Too late, the game has moved on.'
  },
  home: {
    games: 'The games',
    heldRooms: {
      host: 'Your table',
      player: 'Your seat',
      title: 'Where you were'
    },
    oneRoom:
      'One table for all of them: switch games without anyone joining twice.',
    pitch: {
      lead: 'Playing in seconds.',
      rest: 'Nothing to install, no accounts: one code, one QR code, and the whole table is seated.'
    },
    presets: {
      christmas: {
        name: 'Christmas party',
        tagline: 'Quiz, blind test, buzzer and world map, played in teams'
      },
      how: '{rounds:number} rounds, the game drawn before each · {teams:number} teams drawn at random',
      open: 'Open the evening'
    },
    promise: 'A shelf of games for the whole evening.',
    title: 'Mêlée'
  },
  host: {
    answered: defineTranslation('{count:plural} of {total:number} in', {
      plural: { count: { other: '{?}' } }
    }),
    answerMode: {
      buzzer: 'First to buzz',
      choice: 'Four choices',
      label: 'How to answer',
      point: 'Pin it on the map',
      typed: 'Type it'
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
      label: 'Which game',
      labelSeveral: 'Tonight’s games',
      prompt: 'Pick one and the table is set. You can change your mind later.',
      several: 'Several games'
    },
    hostDecides: 'You decide',
    lineUp: {
      first: 'First up',
      next: 'Next up',
      ready: defineTranslation('{count:plural} of {total:number} ready', {
        plural: { count: { other: '{?}' } }
      })
    },
    needsGame: 'Pick what the table is playing',
    needsPlayer: 'You need at least one at the table',
    nextRound: 'Next round',
    /** The reveal of a turn with another team still to play its round. */
    nextTurn: 'Next team',
    playAgain: 'Play again',
    players: {
      empty: 'Nobody yet. That will not last.',
      removeNamed: 'Remove {nickname}',
      title: 'The players'
    },
    recovery: {
      action: 'Run the table from here',
      description: 'It is in the host’s own menu.',
      field: 'Recovery code',
      hint: 'Type it elsewhere to run the table from there.',
      invalid: 'That is not a recovery code.',
      refused: 'That code does not match this table.',
      retry: 'Try again',
      reveal: 'Show the recovery code'
    },
    reveal: 'Give it away',
    roundCount: {
      open: 'No end',
      openSummary: 'Until you stop',
      summary: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} round', other: '{?} rounds' } }
      })
    },
    rounds: 'Rounds',
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
      /**
       * Why there is no seat here, where the room could have one. It names the
       * way out rather than the rule, because the strip that undoes it is on
       * the same screen a few lines up.
       */
      judged:
        'You judge the buzzes, so there is no seat here. Any other way to answer gives you one.',
      label: 'Play too, as',
      leave: 'Give up the seat',
      taken: 'You are playing as {nickname}.'
    },
    seconds: '{seconds:number}s',
    seeResults: 'See the results',
    setup: {
      group: {
        evening: 'The evening',
        room: 'The room',
        round: 'The round'
      },
      label: 'Settings',
      roundInPlay: 'Changes apply from the next round',
      summary: {
        countdown: 'Countdown of {duration}',
        hold: 'Answer up for {duration}',
        holdOpen: 'Next round when you say'
      },
      volume: 'Volume on this screen'
    },
    standings: 'Standings',
    startGame: 'Gather round',
    /** How the rounds from here are played, offered where a round can be one team's. */
    turns: {
      byTeam: 'Team by team',
      label: 'How to play',
      together: 'Everyone at once'
    },
    verdict: {
      right: 'Right',
      showAnswer: 'Show me the answer',
      wrong: 'Wrong'
    }
  },
  invite: {
    action: 'Invite',
    copied: 'Copied',
    copyCode: 'Copy the code',
    copyFailed: 'Could not copy',
    copyLink: 'Copy the link',
    documentTitle: 'Invitation — Mêlée',
    door: {
      action: 'Show it',
      description:
        'It grants nothing: no seat, no game, and no way to run the table. It draws what the table is already showing.',
      label: 'Show the code to join',
      summary: 'The code and the square, on a screen of their own'
    },
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
    divider: 'or',
    host: {
      action: 'Open a table',
      description: 'You run the table. The others just have to join.'
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
      joinLater: 'The others can join you along the way.',
      judged:
        'Here the host judges every answer, so the table waits for its players.',
      name: 'What should we call you?',
      starting: 'Setting the table…'
    },
    roomCode: {
      description: 'The host has it in front of them.',
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
      device:
        'Mêlée sets no cookies. What it remembers stays in your browser, for this site only, until you clear it:',
      heading: 'What Mêlée keeps',
      hostSetup:
        'How you set up the last table you ran, game by game, so the next one opens the same way.',
      hostTokens:
        'The key to each table you opened, which lets you take it back from another screen. Forgotten after a day.',
      locale: 'The language you picked.',
      logs: 'Cloudflare keeps a log of each request for three days, to find what broke: it holds your IP address and your browser’s name beside the table’s code, and never a nickname or an answer.',
      nickname:
        'The name you last played under, so the next table fills it in for you.',
      seats:
        'The seat you hold at each table you joined, so a reload or a locked screen brings you back to it with your score. Forgotten after a day.',
      server:
        'While a table is played, Cloudflare’s servers hold it: the nicknames at it, the answers given, the scores and the settings. It is deleted when the host closes the table, or ten minutes after the last screen leaves it. There are no accounts, and nothing about you outlives the table.',
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
  menu: {
    build: 'Build {build}',
    home: 'Home',
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
    }
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
  player: {
    /** A seat whose screen has gone quiet — beside that name, on every board. */
    away: 'away',
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
      getReady: 'I’m back at the table',
      next: 'Next up: {game}',
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
      hint: 'You are the only one who knows who is at the table.',
      label: 'Include adult questions'
    },
    category: {
      arts: 'Arts and culture',
      cinema: 'Cinema',
      everyday: 'Everyday',
      geography: 'Geography',
      history: 'History',
      label: 'Which subjects',
      none: 'Pick none and you get every subject.',
      quotes: 'Quotes',
      science: 'Science',
      sport: 'Sport',
      videogames: 'Video games'
    },
    duration: 'Time per question',
    home: {
      description:
        'History, science, sport, and questions nobody sees coming. Everyone answers at once, and the fastest right answer takes the round.'
    },
    language: 'Question language',
    name: 'Quiz',
    reveal: {
      title: 'The answer was'
    },
    scoring: {
      buzzer:
        'First to buzz answers out loud, and the host says right or wrong. A point for right — and a wrong answer sits you out for the rest of the round.',
      choice:
        'Four answers, everyone at once. The right one scores a point, and the earlier you find it the more the clock adds — up to double.',
      typed:
        'Everyone types their answer at once. The right one scores three, and the earlier you find it the more the clock adds — up to double.'
    },
    tagline: 'A question, and the first one who knows it.',
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
    pressed: 'In.',
    reaction: '{milliseconds:number} ms',
    scoring:
      'The screen changes, and the first in takes the point. Go before it changes and you sit the round out.',
    tagline: 'The screen changes. First in wins.',
    tooEarly: 'too early',
    waiting: 'Watch the screen.'
  },
  room: {
    documentTitle: '{game} — Mêlée',
    documentTitleLobby: 'Mêlée'
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
    index: 'Round {index:number} of {total:number}',
    indexOpen: 'Round {index:number}',
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
    speedBonus: '{points:number} of that for being early'
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
        'Numbered things to guess — cups to taste, photos, prices — and everyone writes on a sheet nobody else can see, in any order they like. Then the host marks the papers one number at a time, and every answer they accept is worth a point.'
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
      hint: 'Kept on this screen and sent when the sheets open. Players only see an answer once you reveal it.',
      label: 'Answer key',
      summary: defineTranslation('{count:plural}', {
        plural: { count: { other: 'Hidden · {?} noted' } }
      })
    },
    labels: {
      duplicate: 'Another item already shows this.',
      hint: 'Leave a box empty to keep its number. A letter, an emoji or a short word all work.',
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
      'Everyone fills in their own sheet in private, then the host marks it: one point per answer they accept.',
    sheet: {
      blank: 'Left blank',
      closedBeforeYou: 'Collected before you arrived',
      field: 'Your answer for {item}',
      grid: 'Your sheet',
      key: 'Answer: {key}',
      next: 'Next',
      previous: 'Previous',
      saved:
        'Saved as you write. You can change an answer until the host collects it.',
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
  team: {
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
    empty: 'Nobody yet',
    final: {
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
      label: 'Move {nickname}',
      to: 'To the {team}'
    },
    pick: 'Pick your team',
    redraw: 'Draw again',
    rename: {
      action: 'Rename the {team}',
      label: 'Team name',
      submit: 'Rename'
    },
    setting: {
      chosen: 'Players choose',
      drawn: 'Drawn',
      label: 'Teams',
      locked: 'Teams are settled before the first round.',
      off: 'None',
      teamsOnly: 'A screen per team',
      teamsOnlyHint: 'Each team joins on one screen, under the team’s name.'
    },
    summary: {
      chosen: '{count:number} teams, players choose',
      drawn: '{count:number} drawn teams',
      off: 'No teams',
      teamsOnly: 'A screen per team'
    },
    title: 'The teams',
    turn: {
      /** How far a set has come: the turn on screen, of how many teams. */
      of: '{index:number} of {of:number}',
      plays: '{team} play',
      /** A seat watching another team's round. */
      watch: {
        detail:
          'Your team plays its own round in this set — this one is theirs.',
        title: '{team} play this one'
      },
      yours: 'Your turn'
    },
    unassigned: {
      chosen: 'No team yet',
      drawn: 'Waiting for the draw'
    },
    yours: 'Your team'
  },
  wall: {
    door: {
      action: 'Show the game here',
      description:
        'For the screen the whole table can see. It shows a code, the host confirms it, and the game appears here — with no answers and nothing to press.',
      label: 'Show the game on this screen',
      summary: 'The game, big, with nothing to run'
    },
    hostAway: {
      takeOver: 'Run the table from here',
      title: 'The host stepped away. The game is waiting for them.'
    },
    menu: {
      description:
        'Open the table on another screen, then type the code it shows.',
      failed: 'That code shows nothing. The screen may have a new one.',
      label: 'Screen code',
      openHere: 'Show the game in a new tab',
      pair: 'Show the table there',
      paired: 'Done: the table is on that screen.'
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
  },
  worldmap: {
    answer: {
      cancel: 'Cancel',
      confirm: 'Put it here',
      sent: 'Your pawn is down. Waiting for the others.'
    },
    country: COUNTRY_NAMES_EN,
    home: {
      description:
        'A country comes up, and everyone puts a pawn down on a world map they zoom with their fingers. Inside it scores in full; outside, it is paid by the kilometre to the border. At the reveal, every pawn draws its line to the country.'
    },
    map: {
      hint: 'Zoom in, then put your pawn down on it',
      label: 'World map',
      loading: 'Unfolding the map…',
      moveHint: 'Tap somewhere else to move it',
      whole: 'Whole world',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out'
    },
    name: 'World map',
    prompt: 'Place {country}',
    reveal: {
      away: '{distance} km away',
      inside: 'Inside',
      km: '{distance} km',
      title: 'The country:'
    },
    scoring:
      'Everyone puts a pawn down at once. Inside the country it scores three, within 500 km of its border two, within 1,500 km one — and the earlier your pawn, the more the clock adds, up to double.',
    tagline: 'One country. Put your pawn on it.'
  }
})
