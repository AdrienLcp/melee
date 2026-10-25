import type { ShelvedGame } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'

/**
 * A page served as its own document, one per language. Rooms are not here and
 * never will be: both are served `noindex`, they last one evening, and
 * there is no copy to write for a URL nobody reaches from outside the room.
 */
export type IndexedPage = 'credits' | 'home' | 'legal' | ShelvedGame

export type PageHead = {
  /** The search snippet, and the line a link unfurls with in a group chat. */
  description: string
  /** The browser tab, the search result, the unfurl. */
  title: string
}

/**
 * The one place a user-visible string lives outside the dictionary, and the
 * exception `.claude/rules/i18n.md` already carved for the document head: this
 * copy is read by somebody with no room in front of them, so it says what the
 * product is where the screen says what to do next. On the home page the screen
 * says `Mêlée` and `A shelf of games for the whole evening.`, and neither is a search result.
 *
 * Read twice. Each page renders its title as `<title>`, which the build-time
 * prerender lifts into the head of every document beside the description it
 * writes itself, and React keeps in the tab after an in-app navigation. Typed over
 * `ShelvedGame`, so putting a game on the shelf stops compiling here until both
 * languages can introduce it to a stranger.
 */
export const PAGE_HEADS: Record<Locale, Record<IndexedPage, PageHead>> = {
  en: {
    blindtest: {
      description:
        'One screen plays the track and everyone else buzzes from whatever screen they have to hand. First to name the title and the artist takes the points. Scan the QR code and play — no install, no account.',
      title: 'Blind test — Mêlée'
    },
    buzzer: {
      description:
        'A buzzer for the whole room and nothing else: you bring the charade, the quiz on paper or the lesson, and the screen settles who was first. Every buzz is stamped by the server, so the race cannot be argued with.',
      title: 'Buzzer — Mêlée'
    },
    challenge: {
      description:
        'A challenge played at the table, away from every screen: the wall shows what it is, the host says who came first, second and third, and the points land on the board with every other round of the evening.',
      title: 'Challenge — Mêlée'
    },
    credits: {
      description:
        "Where Mêlée's question banks come from, what was changed to bundle them, and the licence the assembled bank is shared under.",
      title: 'Credits — Mêlée'
    },
    guessnine: {
      description:
        'A theme comes up and nine answers hide behind it, the less obvious paying more. Everyone fires answers from their own screen, as many as they like — and one answer that sounds right is the black word that costs the round. Scan the QR code and play — no install, no account.',
      title: 'Guess nine — Mêlée'
    },
    home: {
      description:
        'One screen runs the game, everyone joins by scanning a QR code or typing the room code — no install, no account. Blind test, Buzzer, Quiz, Reflex, Slate, World map, Challenge, Inner clock, Matchsticks, Timeline, Guess nine and Categories.',
      title: 'Mêlée — party games for one screen and the whole room'
    },
    innerclock: {
      description:
        'The wall gives a number of seconds, then every screen goes still: no clock, nothing that moves. Everyone counts in their head and presses once, and the closest to the count takes the most points.',
      title: 'Inner clock — Mêlée'
    },
    legal: {
      description:
        'Who publishes Mêlée, what it keeps about the people who play and for how long, which services receive what, and how to refuse audience measurement.',
      title: 'Legal notice and privacy — Mêlée'
    },
    matchsticks: {
      description:
        'A false equation drawn in matches, or a number to make as big or as small as it can be: one match moves. Everyone moves it on their own screen and the best move pays most, or the first to buzz says which and the host says right or wrong. Every puzzle is dealt fresh and every one has an answer.',
      title: 'Matchsticks — Mêlée'
    },
    petitbac: {
      description:
        'A letter comes up and everyone fills the same sheet on their own screen — a country, an animal, a first name, all starting with it. The first to finish calls stop, the room votes on what counts, and a word nobody else wrote pays double. Scan the QR code and play — no install, no account.',
      title: 'Categories — Mêlée'
    },
    quiz: {
      description:
        'Thousands of questions across nine subjects, in French and in English, answered by the whole room at once on their own screens. Scan the QR code and play — no install, no account.',
      title: 'Quiz — Mêlée'
    },
    reflex: {
      description:
        "The screen changes colour and the first in wins. Every device times the flip on its own clock, so the race measures a reflex and not the room's Wi-Fi. Going early costs the round.",
      title: 'Reflex — Mêlée'
    },
    slate: {
      description:
        'Numbered things to guess and a private answer sheet on every screen. Nobody copies the loudest voice; the host marks the papers one number at a time on the big screen.',
      title: 'Slate — Mêlée'
    },
    timeline: {
      description:
        'Five events come up at once — the Moon landing, the fall of the Berlin Wall, the first iPhone — and the whole room puts them in order on their own screens, earliest first. The years come out at the reveal. Scan the QR code and play — no install, no account.',
      title: 'Timeline — Mêlée'
    },
    worldmap: {
      description:
        'A country comes up and everyone puts a pawn on a world map, from their own screen. Inside scores in full, outside is paid by the kilometre to the border, and the reveal draws every pawn its line. Scan the QR code and play — no install, no account.',
      title: 'World map — Mêlée'
    }
  },
  fr: {
    blindtest: {
      description:
        "Un écran joue le morceau, tout le monde buzze depuis l'écran qu'il a sous la main. Le premier à donner le titre et l'artiste marque. Scannez le QR code et jouez — sans installation, sans compte.",
      title: 'Blind test — Mêlée'
    },
    buzzer: {
      description:
        "Un buzzer pour toute la salle et rien d'autre : vous apportez la charade, le quiz sur papier ou la leçon, l'écran tranche qui a été le premier. Chaque buzz est horodaté par le serveur, la course ne se discute pas.",
      title: 'Buzzer — Mêlée'
    },
    challenge: {
      description:
        "Un défi qui se joue à table, loin des écrans : le mur affiche ce qu'il faut faire, l'hôte dit qui finit premier, deuxième et troisième, et les points arrivent au tableau avec toutes les autres manches de la soirée.",
      title: 'Défi — Mêlée'
    },
    credits: {
      description:
        "D'où viennent les banques de questions de Mêlée, ce qui a été modifié pour les embarquer, et sous quelle licence la banque assemblée est partagée.",
      title: 'Crédits — Mêlée'
    },
    guessnine: {
      description:
        'Un thème tombe et neuf réponses se cachent derrière, les moins évidentes rapportant le plus. Chacun tire ses réponses depuis son écran, autant qu’il veut — et une réponse qui sonne juste est le mot noir qui coûte la manche. Scannez le QR code et jouez — sans installation, sans compte.',
      title: 'Devineuf — Mêlée'
    },
    home: {
      description:
        'Un écran fait tourner le jeu, tout le monde rejoint en scannant un QR code ou en tapant le code de la salle — sans installation, sans compte. Blind test, Buzzer, Quiz, Réflexe, L’Ardoise, Carte du monde, Défi, Horloge interne, Allumettes, Frise chronologique, Devineuf et Petit Bac.',
      title: 'Mêlée — des jeux de soirée pour un écran et toute la salle'
    },
    innerclock: {
      description:
        "Le mur annonce un nombre de secondes, puis tous les écrans se figent : pas d'horloge, rien qui bouge. Chacun compte dans sa tête et appuie une fois, et le plus proche du compte prend le plus de points.",
      title: 'Horloge interne — Mêlée'
    },
    legal: {
      description:
        'Qui publie Mêlée, ce qui est gardé sur les joueurs et pour combien de temps, quels services reçoivent quoi, et comment refuser la mesure d’audience.',
      title: 'Mentions légales et confidentialité — Mêlée'
    },
    matchsticks: {
      description:
        'Une égalité fausse dessinée en allumettes, ou un nombre à rendre le plus grand ou le plus petit possible : une seule allumette bouge. Chacun la déplace sur son écran et le meilleur coup rapporte le plus, ou le premier à buzzer dit laquelle et l’hôte tranche. Chaque énigme est tirée à neuf et toutes ont une réponse.',
      title: 'Allumettes — Mêlée'
    },
    petitbac: {
      description:
        'Une lettre tombe et chacun remplit la même grille sur son écran — un pays, un animal, un prénom, tous commençant par elle. Le premier qui a fini crie stop, la salle vote sur ce qui compte, et un mot que personne d’autre n’a écrit rapporte double. Scannez le QR code et jouez — sans installation, sans compte.',
      title: 'Petit Bac — Mêlée'
    },
    quiz: {
      description:
        'Des milliers de questions sur neuf thèmes, en français et en anglais, auxquelles toute la salle répond en même temps depuis son écran. Scannez le QR code et jouez — sans installation, sans compte.',
      title: 'Quiz — Mêlée'
    },
    reflex: {
      description:
        "L'écran change de couleur, le plus rapide gagne. Chaque appareil programme le basculement sur sa propre horloge : la course mesure un réflexe, pas le Wi-Fi de la salle. Partir trop tôt coûte la manche.",
      title: 'Réflexe — Mêlée'
    },
    slate: {
      description:
        "Des choses numérotées à deviner et une feuille de réponses privée sur chaque écran. Personne ne copie la voix la plus forte ; l'hôte corrige les copies numéro par numéro sur le grand écran.",
      title: "L'Ardoise — Mêlée"
    },
    timeline: {
      description:
        'Cinq événements tombent d’un coup — les premiers pas sur la Lune, la chute du mur de Berlin, le premier iPhone — et toute la salle les remet dans l’ordre depuis son écran, du plus ancien au plus récent. Les années tombent au dévoilement. Scannez le QR code et jouez — sans installation, sans compte.',
      title: 'Frise chronologique — Mêlée'
    },
    worldmap: {
      description:
        "Un pays s'affiche et chacun pose son pion sur la carte du monde, depuis son propre écran. Dedans, c'est le plein de points ; à côté, ça se paie au kilomètre près de la frontière, et le dévoilement trace le trait de chaque pion. Scannez le QR code et jouez — sans installation, sans compte.",
      title: 'Carte du monde — Mêlée'
    }
  }
}

/**
 * The share image is the same on every page, so its alt text belongs to the site
 * rather than to a page — but read out on a French unfurl it is the last English
 * string this stage would have left behind.
 */
export const IMAGE_ALTS: Record<Locale, string> = {
  en: "The Mêlée wordmark on the lobby's burnt-orange field.",
  fr: 'Le nom Mêlée sur un fond orange brûlé.'
}

/**
 * `og:locale` is specified as a POSIX-style tag with an underscore, not the
 * BCP-47 one `I18nProvider` hands react-aria. A crawler reading `en-US` here
 * treats the property as absent.
 */
export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  fr: 'fr_FR'
}
