import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'

/**
 * French typography puts a non-breaking space before `?`, `!` and `:`. Writing
 * it as \u00a0 keeps it visible to whoever edits this file, and survives an
 * editor that strips invisible characters.
 *
 * French counts 0 as singular. Every `one` form below therefore covers both 0
 * and 1, which is the whole reason these keys carry plural forms rather than a
 * word chosen at the call site.
 */
export const FR_DICTIONARY = defineDictionary({
  assistant: {
    address: {
      copy: 'Copier l’adresse',
      heading: 'Copie l’adresse',
      note: 'Ni compte ni clé : l’adresse suffit.'
    },
    ask: {
      copy: 'Copier l’exemple',
      example:
        'Prépare deux heures de jeux pour une famille avec de jeunes enfants, sans rien que l’hôte doive arbitrer.',
      heading: 'Demande avec tes mots',
      note: 'Dis qui est à table, pour combien de temps, et ce qu’il faut laisser de côté.'
    },
    connect: {
      claude: {
        name: 'Claude',
        steps:
          'Paramètres → Connecteurs → Ajouter un connecteur personnalisé, puis colle l’adresse.'
      },
      claudeCode: {
        command: 'claude mcp add --transport http melee {url}',
        copy: 'Copier la commande',
        name: 'Claude Code'
      },
      heading: 'Ajoute-la à ton assistant',
      other: {
        name: 'Un autre assistant',
        steps:
          'Tout assistant qui accepte un serveur MCP distant : donne-lui l’adresse, en Streamable HTTP.'
      }
    },
    intro:
      'Un assistant IA comme Claude peut composer la partie pour toi : il connaît tous les jeux de l’étagère, et te rend un lien qui l’ouvre prête à jouer.',
    outcome:
      'Il répond par un lien. Ouvre-le sur l’écran qui tiendra la table : la partie y est posée, prête à ouvrir une table ou à garder parmi les tiennes.',
    title: 'Préparer avec un assistant'
  },
  atlas: {
    answer: {
      cancel: 'Annuler',
      confirm: 'Je le pose ici',
      sent: 'Ton pion est posé. On attend les autres.'
    },
    asks: {
      name: 'Nommer {places} sur la carte',
      place: 'Trouver {places}',
      places: {
        countries: 'un pays',
        frenchCities: 'une ville de France',
        worldCapitals: 'une capitale'
      }
    },
    country: COUNTRY_NAMES_FR,
    direction: {
      label: 'La manche demande',
      name: 'Nommer le lieu allumé sur la carte',
      place: 'Placer sur la carte le lieu nommé'
    },
    home: {
      description:
        'Un pays, une capitale ou une ville de France s’affiche, et chacun pose son pion sur la carte, zoomée du bout des doigts : dessus, c’est le plein de points ; à côté, ça se paie au kilomètre. Au dévoilement, chaque pion tire son trait jusqu’au lieu. Ou dans l’autre sens : la carte allume un lieu, et la table le nomme.'
    },
    map: {
      hint: 'Zoome, puis pose ton pion dessus',
      label: 'Carte du monde',
      labelFrance: 'Carte de France',
      loading: 'On déplie la carte…',
      moveHint: 'Touche ailleurs pour le déplacer',
      whole: 'Le monde entier',
      wholeFrance: 'Toute la France',
      zoomIn: 'Zoomer',
      zoomOut: 'Dézoomer'
    },
    name: 'Atlas',
    naming: {
      capital: 'Quelle est cette capitale ?',
      city: 'Quelle est cette ville ?',
      country: 'Quel est ce pays ?'
    },
    places: {
      countries: 'Pays du monde',
      frenchCities: 'Villes de France',
      label: { name: 'À nommer', place: 'À placer' },
      worldCapitals: 'Capitales du monde'
    },
    play: 'Jouer à Atlas',
    prompt: 'Place {place}',
    reveal: {
      away: 'à {distance} km',
      capitalOf: '{capital}, {country}',
      capitalTitle: 'La capitale :',
      cityTitle: 'La ville :',
      inside: 'Dedans',
      km: '{distance} km',
      onTheSpot: 'Dans le mille',
      title: 'Le pays :'
    },
    roundDuration: 'Temps par manche',
    scoring:
      'Tout le monde pose son pion en même temps. Dans le pays, ça rapporte 100 points, puis de moins en moins jusqu’à rien à 1 500 km de sa frontière — plus c’est près, plus ça paie.',
    scoringCapitals:
      'Tout le monde pose son pion en même temps. À moins de 100 km de la capitale, ça rapporte 100 points, puis de moins en moins jusqu’à rien à 1 000 km.',
    scoringCities:
      'Tout le monde pose son pion en même temps, sur la carte de France. À moins de 25 km de la ville, ça rapporte 100 points, puis de moins en moins jusqu’à rien à 150 km.',
    scoringMixed:
      'Tout le monde pose son pion en même temps — un pays, une capitale ou une ville de France, selon la manche. Plus ton pion est près, plus il rapporte, jusqu’à 100 points.',
    scoringName: {
      choice:
        'La carte montre un lieu et propose quatre noms, à tout le monde en même temps. Le bon rapporte 100 points.',
      typed:
        'La carte montre un lieu et chacun tape son nom en même temps. Le bon nom rapporte 100 points.'
    },
    tagline: 'Un lieu. Pose ton pion dessus, ou nomme-le.'
  },
  blacksquare: {
    answer: {
      found: '« {line} » : trouvée',
      hit: '« {line} » +{points:number}',
      label: 'Une réponse',
      miss: '« {line} » : rien',
      retry: 'Autant que tu veux. L’une d’elles est le mot noir.'
    },
    answerCount: {
      label: 'Réponses à trouver',
      summary: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} réponse', other: '{?} réponses' } }
      })
    },
    blackWord: {
      ends: 'Ta manche s’arrête là. Elle ne rapporte rien.',
      fell: '{nickname} y a laissé sa manche',
      nobodyFell: 'Personne n’est tombé dedans',
      stamp: 'Mot noir'
    },
    duration: 'Temps par manche',
    found: defineTranslation('{count:plural}', {
      plural: {
        count: {
          one: '{?} sur {total:number} trouvée par la table',
          other: '{?} sur {total:number} trouvées par la table'
        }
      }
    }),
    grid: 'Les réponses',
    home: {
      description:
        'Un thème tombe — les films de Quentin Tarantino, les pays qui bordent la France — et quatre réponses se cachent derrière — jusqu’à neuf si tu veux —, les moins évidentes rapportant le plus. Chacun tire ses réponses depuis son écran, autant qu’il veut. Caché parmi elles, un mot noir : une réponse qui sonne juste et ne l’est pas, et qui tombe dessus perd sa manche.'
    },
    lone: {
      doubled: '×2',
      hint: 'Une réponse trouvée par un seul joueur rapporte double.',
      label: 'Personne d’autre ne l’a trouvée',
      said: 'Personne d’autre ne l’a trouvée : points doublés'
    },
    name: 'Case noire',
    nobody: 'Personne',
    othersLooking: 'Les autres cherchent encore.',
    play: 'Jouer à Case noire',
    scoring:
      'Des réponses sont cachées, et la grille vaut 100 points partagés entre elles : une évidente compte une part, une moins connue deux, une rare trois. Tombe sur le mot noir et ta manche ne vaut plus rien.',
    scoringLoneFinds:
      'Des réponses sont cachées, et la grille vaut 100 points partagés entre elles : une évidente compte une part, une moins connue deux, une rare trois, et une réponse que personne d’autre ne trouve compte double — la grille plafonne toujours à 100. Tombe sur le mot noir et ta manche ne vaut plus rien.',
    scoringSpoken:
      'Une équipe dit ses réponses à voix haute et quelqu’un d’une autre équipe les coche. La grille vaut 100 points partagés entre ses réponses : une évidente compte une part, une moins connue deux, une rare trois. Le mot noir prononcé, la manche de l’équipe ne vaut plus rien.',
    spoken: {
      blackWord: {
        ask: 'Ils l’ont dit ? Leur manche s’arrête et ne vaut plus rien.',
        confirm: 'Ils l’ont dit',
        keep: 'Pas dit'
      },
      guessing: 'À voix haute : {team}',
      hidden: 'Cachée : tu peux montrer l’écran sans rien dévoiler.',
      hide: 'Cacher la liste',
      keep: 'Tu tiens la liste pour {team}. Coche chaque réponse entendue.',
      keeper: '{nickname} tient la liste',
      show: 'Voir la liste',
      yourTeam: 'Dites vos réponses à voix haute. {nickname} les coche.'
    },
    tagline: 'Des réponses cachées. Un mot noir.',
    tier: defineTranslation('{points:plural}', {
      plural: { points: { one: '{?} point', other: '{?} points' } }
    }),
    tierOf: 'Palier {tier:number} sur {most:number}',
    yours: 'Trouvée par toi'
  },
  blindtest: {
    answer: {
      anyOrder:
        'Le titre, l’artiste, ou les deux — autant d’essais que tu veux.',
      anyOrderFilm:
        'Le film, le compositeur, ou les deux — autant d’essais que tu veux.',
      artistFound: 'Artiste ✓',
      bothFound: 'Tu as les deux. Tranquille.',
      composerFound: 'Compositeur ✓',
      filmFound: 'Film ✓',
      titleFound: 'Titre ✓'
    },
    audio: {
      fault: {
        stalled:
          'La musique reste bloquée au chargement ici. Vérifie la connexion de cet écran.',
        unreachable:
          'La musique de ce morceau ne charge pas. C’est le fichier ou la connexion, pas les enceintes.'
      },
      onWall: {
        blocked:
          'L’écran de la salle reste muet tant que personne n’y appuie sur Lancer le son.',
        stalled:
          'La musique reste bloquée au chargement sur l’écran de la salle. Révèle ce morceau et passe au suivant, ou vérifie la connexion de cet écran.',
        unreachable:
          'L’écran de la salle n’arrive pas à charger la musique de ce morceau. Révèle-le et passe au suivant.'
      },
      pause: 'Pause',
      refused: {
        blocked:
          'Le navigateur a refusé le son. Autorise-le pour ce site, ou tiens la table depuis un autre écran.',
        broken:
          'Ça a cassé de notre côté. Réessaie, ou tiens la table depuis un autre écran.',
        unsupported:
          'Cet écran ne sait pas lire l’extrait. Tiens la table depuis un autre écran.'
      },
      replay: 'Depuis le début',
      resume: 'Reprendre',
      silent: 'Le son ne sort pas d’ici.',
      start: 'Lancer le son'
    },
    clip: 'Durée de l’extrait',
    decade: {
      '1970s': 'Années 70',
      '1980s': 'Années 80',
      '1990s': 'Années 90',
      '2000s': 'Années 2000',
      '2010s': 'Années 2010',
      '2020s': 'Années 2020',
      label: 'Quelles années',
      none: 'N’en choisis aucune et tu as toutes les décennies.'
    },
    genre: {
      '52': 'Chanson française',
      '106': 'Électro',
      '113': 'Dance',
      '116': 'Rap et hip-hop',
      '129': 'Jazz',
      '132': 'Pop',
      '144': 'Reggae',
      '152': 'Rock',
      '165': 'R&B',
      '169': 'Soul et funk',
      '197': 'Latino',
      '464': 'Metal',
      label: 'Quelle musique',
      none: 'N’en choisis aucun et tu as tous les genres.'
    },
    home: {
      description:
        'Trois notes suffisent parfois, et toute la table cherche déjà. Titre, artiste, ou les deux : le plus rapide à savoir rafle la manche.'
    },
    listening: 'À l’écoute…',
    name: 'Blind test',
    play: 'Jouer au Blind test',
    reveal: {
      title: 'C’était'
    },
    scoring: {
      buzzer:
        'Le premier qui buzze répond à voix haute. L’hôte juge le titre et l’artiste, 40 points chacun et 100 pour les deux — une mauvaise réponse te met hors-jeu pour le reste de la manche.',
      choice:
        'Quatre propositions sur le même extrait, et tout le monde répond. La bonne rapporte 100 points.',
      typed:
        'Tout le monde tape, sur le même extrait. Titre ou artiste seul rapporte 40 points, les deux ensemble 100.'
    },
    scoringFilm: {
      buzzer:
        'Le premier qui buzze répond à voix haute. L’hôte juge le film et le compositeur, 40 points chacun et 100 pour les deux — une mauvaise réponse te met hors-jeu pour le reste de la manche.',
      typed:
        'Tout le monde tape, sur le même extrait. Film ou compositeur seul rapporte 40 points, les deux ensemble 100.'
    },
    scoringMixed: {
      buzzer:
        'Le premier qui buzze répond à voix haute : le titre et l’artiste, ou le film et le compositeur quand c’est une musique de film. L’hôte juge chacun, 40 points pièce et 100 pour les deux — une mauvaise réponse te met hors-jeu pour le reste de la manche.',
      typed:
        'Tout le monde tape, sur le même extrait : le titre et l’artiste, ou le film et le compositeur quand c’est une musique de film. L’un des deux seul rapporte 40 points, les deux ensemble 100.'
    },
    source: {
      catalogue: 'Le catalogue',
      chart: 'Le top du moment',
      decades: 'Les décennies',
      film: 'Musiques de films',
      filmHint:
        'Ce qu’un compositeur a écrit pour un film ou une série — pas les chansons de la bande originale.',
      label: 'D’où viennent les titres',
      noneInPlaylist:
        'Rien de jouable dans cette playlist. Vérifie l’identifiant.',
      noneInSearch:
        'Rien d’assez connu ne correspond. Essaie une autre recherche.',
      playlist: 'Une playlist Deezer',
      playlistId: 'Identifiant de playlist',
      playlistIdHint: 'Le nombre à la fin de l’adresse Deezer de la playlist.',
      preview: 'Voir ce que ça donne',
      query: 'Rechercher',
      queryHint: 'Ta recherche part chez Deezer, qui trouve les morceaux.',
      ready: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} titre prêt', other: '{?} titres prêts' } }
      }),
      search: 'Une recherche',
      strands: 'Ce qu’on y pioche',
      wholeCatalogue: 'Tout le catalogue'
    },
    tagline: 'Trouve le titre avant tout le monde.',
    verdict: {
      artistOnly: 'Artiste seulement',
      both: 'Titre + artiste',
      bothFilm: 'Film + compositeur',
      composerOnly: 'Compositeur seulement',
      filmOnly: 'Film seulement',
      miss: 'Raté',
      titleOnly: 'Titre seulement'
    }
  },
  board: {
    at: 'Case {case:number}',
    atColumn: 'Case <figure>{case:number}</figure>',
    back: 'Reculer {team} d’une case',
    case: 'Case {case:number} sur {length:number}',
    finish: 'Arrivée',
    fix: 'Corriger les cases',
    forward: 'Avancer {team} d’une case',
    lead: {
      ahead: defineTranslation('En tête de {gap:plural}', {
        plural: { gap: { one: '{?} case', other: '{?} cases' } }
      }),
      behind: defineTranslation('{leader} en tête, {gap:plural} devant', {
        plural: { gap: { one: '{?} case', other: '{?} cases' } }
      }),
      level: 'À égalité en tête'
    },
    more: '+{count:number}',
    points: 'Aux points',
    recentre: 'Recentrer',
    setting: {
      catchUp: {
        hint: 'Seul à la dernière place, on avance d’une case de plus sur une manche où l’on marque.',
        label: 'Coup de pouce au dernier'
      },
      hint: {
        points: 'Des points sur chaque écran : le plus gros total gagne.',
        seats:
          'Pas de points : un pion par joueur sur un parcours, qui avance à chaque manche.',
        teams:
          'Pas de points : un pion par équipe sur un parcours, qui avance à chaque manche.'
      },
      label: 'On joue',
      points: 'Aux points',
      strategy: {
        hint: {
          onePointOneCase:
            'Une bonne réponse avance de 3 cases, une réponse en partie de moins. La vitesse ne compte jamais.',
          rank: 'Le premier de la manche avance de 3 cases, le deuxième de 2, le troisième de 1.'
        },
        label: 'Les pions avancent',
        onePointOneCase: 'À la réponse',
        rank: 'Au classement'
      },
      unit: 'cases'
    },
    standing: '{team} : case {case:number} sur {length:number}',
    start: 'Départ',
    summary: 'plateau de {length:number} cases',
    walked: '+{count:number}',
    walkedSquares: defineTranslation('{count:plural}', {
      plural: { count: { one: '+{?} case', other: '+{?} cases' } }
    }),
    walkedUnit: defineTranslation('{count:plural}', {
      plural: { count: { one: 'case', other: 'cases' } }
    })
  },
  buzz: {
    action: 'Buzz',
    blocked: {
      host_away: 'L’hôte a décroché. Tout est en pause.',
      round_not_running: 'En attente de l’hôte',
      someone_else_buzzed: 'Quelqu’un a été plus rapide',
      you_already_missed: 'Tu es hors-jeu pour cette manche',
      your_answer_is_pending: 'Donne ta réponse à voix haute'
    },
    ready: 'Appuie dès que tu sais',
    sendFailed: 'Ce buzz n’est pas parti. Réappuie.',
    theyBuzzed: '{nickname} a buzzé',
    won: 'C’est à toi. Annonce\u00a0!'
  },
  buzzer: {
    clearLockouts: 'Remettre tout le monde en jeu',
    home: {
      description:
        'Les questions, c’est toi qui les apportes — une charade, un quiz sur une feuille, une leçon, ce que la table veut. Ici on ne tranche qu’une chose : qui a été le plus rapide. Et là-dessus, jamais de discussion.'
    },
    lockout: 'Une mauvaise réponse met hors-jeu',
    name: 'Buzzer',
    play: 'Jouer au Buzzer',
    running: 'Pose ta question',
    scoring:
      'Le plus rapide répond à voix haute, et l’hôte dit si c’est bon. 100 points si c’est juste — et une mauvaise réponse te met hors-jeu jusqu’à ce qu’il te remette en jeu.',
    tagline: 'Tes questions, et une course au buzz.'
  },
  challenge: {
    atTheTable: 'Ça se joue à table — l’hôte annonce le classement.',
    hand: {
      aloud: 'Je l’annonce à voix haute',
      own: 'Ton défi',
      spent: 'La banque est épuisée : écris le défi, ou annonce-le.',
      write: 'Écrire le mien',
      writePlaceholder: 'Ou écris le tien…'
    },
    home: {
      description:
        'Couper un légume en deux moitiés du même poids, empiler le plus de pommes de terre à raclette : le défi se joue à table, loin des écrans. L’hôte l’affiche au mur, dit qui finit premier, deuxième et troisième, et les points arrivent au tableau comme ceux de n’importe quelle manche.'
    },
    line: {
      aloud: 'Vide, tu l’annonces à voix haute.',
      description:
        'Vide, c’est le défi affiché qui se joue — ou écris le tien.',
      label: 'Le défi',
      redeal: 'Tirer un autre défi'
    },
    name: 'Défi',
    own: {
      add: 'Ajouter',
      description:
        'Joués en premier, dans cet ordre ; la banque prend le relais quand il n’y en a plus. Gardés sur cet appareil.',
      field: 'Défi {index:number}',
      new: 'Un nouveau défi',
      newPlaceholder: 'Écris un défi…',
      played: 'Joué',
      remove: 'Retirer le défi {index:number}',
      summary: '{count:number} à venir',
      title: 'Tes défis'
    },
    places: {
      confirm: 'Valider le classement',
      first: '1er',
      label: 'Classement',
      nobody: 'Personne ne gagne',
      none: '—',
      second: '2e',
      third: '3e'
    },
    play: 'Jouer au Défi',
    scoring:
      'Ça se joue à table. L’hôte classe les trois premiers : 100 points au premier, 67 au deuxième, 33 au troisième — une égalité partage la place.',
    tagline: 'Joué à table, compté au tableau.',
    untitled: 'Défi à table'
  },
  connection: {
    closed: 'Reconnexion…',
    connecting: 'Connexion…',
    latency: '· {milliseconds:number} ms',
    open: 'Connecté',
    refused: 'Déconnecté'
  },
  credits: {
    enable:
      'Ses mots de deux à neuf lettres ont été gardés, écrits en capitales : ce sont tous les mots qu’un joueur peut proposer en anglais.',
    flagIcons:
      'Chaque drapeau est dessiné tel qu’il est livré, renommé d’après son propre dessin plutôt que son pays, et le code du pays écrit dans chaque fichier a été remplacé, pour que le fichier envoyé à un écran ne dise rien de la réponse. Sept drapeaux dessinés exactement comme celui d’un autre pays ont été écartés.',
    lexique:
      'Chaque forme a été écrite dans les capitales de A à Z — accents retirés, Œ et Æ écrits en deux lettres — et celles qui portaient un trait d’union, une apostrophe ou une espace ont été écartées, comme celles de moins de deux lettres ou de plus de neuf. Les mots à trouver sont tirés de ses noms, adjectifs et infinitifs de cinq à huit lettres, classés selon la fréquence à laquelle les films les disent, sans les mots grossiers ni quelques autres qu’une relecture a jugés déplacés.',
    licences: {
      publicDomain: 'Domaine public',
      scowl: 'Licence SCOWL'
    },
    mintaka:
      'Elle fournit des questions et aucune mauvaise réponse : les trois propositions posées à côté de la bonne ont été construites ici, à partir d’entités que Wikidata range dans la même famille que la réponse et qu’on lit à peu près autant en français. Cinq de ses huit rubriques ont été retenues et rattachées aux sujets utilisés ici, ainsi que quatre de ses neuf formes de question — les autres nomment leurs propres propositions dans l’énoncé, acceptent plus de réponses qu’elles n’en enregistrent, ou demandent deux détours. Les questions qui nomment le présent ont été écartées, le corpus étant arrêté à octobre 2021. Parmi ce qui restait, seules celles dont la réponse et le sujet ont un article de Wikipédia en français réellement lu ont été gardées, et aucune réponse ne revient plus de cinq fois dans un même sujet.',
    mmmlu:
      'Une traduction professionnelle en français de MMLU, un banc d’essai plutôt qu’un quiz, filtrée pour n’en garder que la culture générale : seuls les sujets qu’une tablée peut jouer ont été retenus, et parmi eux seules les questions qu’une relecture a jugées à sa portée. Certaines questions ont été reformulées ou corrigées, et certaines mauvaises réponses remplacées.',
    openquizzdb:
      'Ses rubriques ont été rattachées aux sujets utilisés ici, ses anecdotes conservées comme la ligne affichée une fois la réponse dévoilée, et ses questions classées adulte signalées pour que l’hôte puisse les laisser de côté. Les questions qui ne portaient pas exactement trois mauvaises réponses ont été écartées, comme celles dont une mauvaise réponse ne se distingue plus de la bonne une fois écrite. Une réponse mal orthographiée par rapport à sa propre anecdote a été corrigée.',
    opentdb:
      'Son texte arrive encodé en HTML et a été décodé, ses catégories ont été rattachées aux sujets utilisés ici, et les questions qui ne portaient pas exactement trois mauvaises réponses ont été écartées, comme celles dont une mauvaise réponse ne se distingue plus de la bonne une fois écrite.',
    polyfact:
      'Elle est bâtie sur Wikidata en quatorze formes de question, dont sept ont été retenues et rattachées aux sujets utilisés ici — les autres portent sur des hameaux dont personne n’a entendu parler, ou donnent la réponse dans l’énoncé. Parmi ce qui restait, seules les questions dont le sujet et les quatre propositions ont tous un article de Wikipédia en français réellement lu ont été gardées. Une mauvaise réponse sur laquelle la source revenait bien trop souvent a été remplacée par une qu’elle n’utilisait presque pas, et les questions dont une mauvaise réponse ne se distingue plus de la bonne une fois écrite ont été écartées.',
    scowl:
      'Ses trois plus petites tailles donnent les mots à trouver en anglais : ceux de cinq à huit lettres, en minuscules et présents dans ENABLE, jamais une forme fléchie, sans ses propres listes d’insultes et de grossièretés ni quelques autres qu’une relecture a jugés déplacés. La taille d’où vient un mot dit sa difficulté.',
    shareAlike:
      'La banque assemblée est diffusée sous la même licence, et le code qui l’assemble est ouvert.',
    title: 'Crédits',
    vikidia:
      'Ses quiz sont écrits en wikitexte et ont été relus ligne à ligne pour en tirer un énoncé, une réponse et trois mauvaises réponses. Chacune de ses pages a été rattachée à la main à l’un des sujets utilisés ici, puisqu’elle n’a pas de rubriques ; celles qui parlent du wiki lui-même ont été laissées de côté. Les questions qui ne portaient pas au moins quatre propositions, celles à plusieurs bonnes réponses et celles dont l’énoncé tient dans une formule mathématique, du code ou une image ont été écartées. Les modèles qui portaient une unité ou une citation ont été remplacés par ce qu’ils affichent. Chaque question retenue a été relue : les fausses ont été retirées, celles dont l’énoncé ne nommait plus son sujet ont été complétées, et celles qu’on ne peut gagner qu’en choisissant ont été signalées.',
    whatChanged: 'Ce qu’on a changé'
  },
  error: {
    already_buzzed: 'Quelqu’un a été plus rapide.',
    api: {
      rate_limited:
        'Ça fait beaucoup de tables. Attends une minute et réessaie.',
      rejected: 'Ça n’est pas passé. Réessaie.',
      unexpected_response: 'On n’a pas su quoi en faire. Réessaie.',
      unreachable: 'On n’arrive pas à joindre Mêlée. Réessaie dans un instant.'
    },
    colour_still_shown:
      'Attends que la couleur disparaisse avant d’envoyer la tienne.',
    colour_taken:
      'Quelqu’un vient de prendre cette pièce — choisis-en une autre.',
    false_start: 'Trop tôt. Attends que ça change.',
    host_already_connected: 'Quelqu’un tient déjà cette table.',
    host_away: 'L’hôte a décroché. La manche attend son retour.',
    host_only_action: 'Seul l’hôte peut faire ça.',
    host_reconnecting:
      'Cette table vient de perdre son hôte, et l’attend encore.',
    internal_error: 'Ça a cassé de notre côté. Réessaie.',
    invalid_message: 'On n’a pas compris. Réessaie.',
    joined_mid_round: 'Tu joues à partir de la prochaine manche.',
    judging_round: 'Tu juges cette manche, tu rejoues à la suivante.',
    letter_not_in_draw:
      'Ce mot prend une lettre absente du tirage, ou plus de fois qu’elle n’y est.',
    music_source_unavailable:
      'Deezer, d’où vient la musique, ne répond plus. Ce ne sont pas tes enceintes : réessaie dans un instant.',
    nickname_taken: 'Ce pseudo est déjà pris.',
    no_content_available: 'Il ne reste rien à jouer. Change les réglages.',
    no_game_chosen: 'Choisis d’abord un jeu.',
    not_in_dictionary:
      'Ce mot n’est pas dans le dictionnaire. Ça ne t’a pas coûté d’essai.',
    not_one_word: 'Un seul mot, que des lettres. Ça ne t’a pas coûté d’essai.',
    not_your_turn: 'Cette manche est un duel entre deux autres joueurs.',
    pairing_not_found:
      'Ce code d’écran a expiré. Rouvre l’écran pour en avoir un nouveau.',
    player_locked_out: 'Tu es hors-jeu pour cette manche.',
    protocol_version_mismatch: 'Cette page n’est plus à jour. Recharge-la.',
    rate_limited: 'Ça fait beaucoup de tables. Attends une minute et réessaie.',
    removed_by_host: 'L’hôte t’a retiré de la table.',
    room_closed: 'L’hôte a fermé la table.',
    room_full: 'Cette table est complète.',
    room_not_found: 'Aucune table sous ce code.',
    room_paused: 'La partie est en pause. Attendez l’hôte.',
    room_plays_aloud:
      'Cette table joue à voix haute, sans écran pour rejoindre.',
    screen: {
      description:
        'Le jeu est tombé sur quelque chose dont il ne sait pas repartir. Recharger suffit presque toujours — et si le site a été mis à jour pendant que cet onglet était ouvert, toujours.',
      reload: 'Recharger la page',
      title: 'Quelque chose a cassé'
    },
    sheet_not_full:
      'Il faut un mot sur la lettre à chaque ligne avant de crier stop.',
    spoken_needs_two_teams:
      'Équipe par équipe, il faut deux équipes avec quelqu’un dans chacune.',
    stale_round: 'Cette manche est déjà terminée.',
    teams_locked: 'Les équipes ne peuvent plus changer comme ça.',
    wall_dismissed: 'L’hôte a libéré cet écran.',
    wall_not_paired:
      'Cet écran n’est pas appairé. Appaire-le depuis l’appareil qui tient la table.',
    wrong_first_letter:
      'Le mot commence par la lettre affichée. Ça ne t’a pas coûté d’essai.',
    wrong_length: 'Pas le bon nombre de lettres. Ça ne t’a pas coûté d’essai.',
    wrong_phase: 'Trop tard, la partie est passée à autre chose.'
  },
  estimate: {
    answer: {
      label: 'Ton estimation',
      send: 'Envoyer',
      sent: 'Estimation envoyée. On attend les autres.'
    },
    asks: {
      area: {
        city: 'Quelle superficie pour cette commune ?',
        country: 'Quelle superficie pour ce pays ?',
        department: 'Quelle superficie pour ce département ?',
        region: 'Quelle superficie pour cette région ?'
      },
      elevation: { mountain: 'Quelle altitude pour ce sommet ?' },
      height: { building: 'Quelle hauteur pour cet édifice ?' },
      length: { river: 'Quelle longueur pour ce cours d’eau ?' },
      population: {
        city: 'Combien d’habitants dans cette ville ?',
        country: 'Combien d’habitants dans ce pays ?',
        department: 'Combien d’habitants dans ce département ?',
        region: 'Combien d’habitants dans cette région ?'
      }
    },
    home: {
      description:
        'Une question dont la réponse est un nombre — combien d’habitants au Japon, quelle altitude pour le mont Blanc, quelle longueur pour la Loire — et chacun tape son estimation. Personne n’a besoin de savoir : les trois plus proches marquent, et le dévoilement aligne chaque essai face à la vraie valeur.'
    },
    line: {
      divided: '÷{factor}',
      times: '×{factor}'
    },
    name: 'Le juste chiffre',
    play: 'Jouer au Juste chiffre',
    reveal: {
      over: 'Trop haut · ×{factor}',
      spotOn: 'Dans le mille',
      under: 'Trop bas · ÷{factor}',
      yours: 'Tu as dit {guess}'
    },
    roundDuration: 'Temps pour estimer',
    scoring:
      'Une question dont la réponse est un nombre, et chacun tape son estimation. Pile juste, ça rapporte 100 points, puis de moins en moins jusqu’à rien à trois fois d’écart, dans un sens comme dans l’autre — plus c’est près, plus ça paie. Pas de bonus de vitesse.',
    tagline: 'Personne ne sait. Qui tombe le plus près ?',
    unitNames: {
      kilometres: 'km',
      metres: 'm',
      people: 'habitants',
      squareKilometres: 'km²'
    },
    units: {
      kilometres: '{value}\u00a0km',
      metres: '{value}\u00a0m',
      people: '{value} habitants',
      squareKilometres: '{value}\u00a0km²'
    }
  },
  eveningLink: {
    documentTitle: '{name} — Mêlée',
    open: 'Ouvrir une table',
    save: 'Enregistrer',
    saved: 'Enregistrée',
    savedWhere: 'Elle t’attend sur l’accueil, dans « Tes parties ».',
    unreadable: {
      description:
        'Le lien a sans doute été coupé en route. Redemande-le en entier.',
      documentTitle: 'Lien coupé — Mêlée',
      title: 'Cette partie ne s’ouvre pas'
    }
  },
  higherlower: {
    answer: {
      counter: 'Paire {index:number} sur {count:number}',
      sent: 'Ton choix est parti. On attend les autres.'
    },
    asks: {
      area: {
        city: 'Quelle commune est la plus étendue ?',
        country: 'Quel pays est le plus vaste ?',
        department: 'Quel département est le plus vaste ?',
        region: 'Quelle région est la plus vaste ?'
      },
      elevation: { mountain: 'Quel sommet est le plus haut ?' },
      height: { building: 'Quel édifice est le plus haut ?' },
      length: { river: 'Quel cours d’eau est le plus long ?' },
      population: {
        city: 'Quelle ville a le plus d’habitants ?',
        country: 'Quel pays a le plus d’habitants ?',
        department: 'Quel département a le plus d’habitants ?',
        region: 'Quelle région a le plus d’habitants ?'
      }
    },
    dealt: 'Deux noms. Lequel est le plus grand ?',
    home: {
      description:
        'Deux villes, deux fleuves, deux sommets : lequel compte le plus d’habitants, lequel est le plus long, lequel est le plus haut ? Une paire par manche, un choix, et le dévoilement affiche les deux chiffres.'
    },
    name: 'Plus ou moins',
    play: 'Jouer à Plus ou moins',
    reveal: {
      higher: 'le plus grand',
      score: '{right:number} sur {count:number}',
      yourPick: 'ton choix'
    },
    roundDuration: 'Temps pour choisir',
    scoring:
      'Deux choses du même genre — deux villes, deux fleuves, deux sommets — et tu choisis la plus grande. Le bon choix rapporte 100 points.',
    tagline: 'Deux noms. Lequel est le plus grand ?'
  },
  home: {
    judgedGames: 'Jugés par l’hôte',
    opening: 'Ouverture de la table…',
    openWith: defineTranslation('Ouvrir une table · {count:plural}', {
      plural: { count: { one: '{?} jeu', other: '{?} jeux' } }
    }),
    played: {
      days: defineTranslation('Jouée {when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'day' } }
      }),
      months: defineTranslation('Jouée {when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'month' } }
      }),
      weeks: defineTranslation('Jouée {when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'week' } }
      })
    },
    resume: 'Reprendre la table',
    saveLineUp: 'Enregistrer « {name} »',
    shelf: 'Ou tes jeux à toi',
    shelfHint:
      'Coche ce que « Ouvrir une table » lance. Tes coches sont gardées pour la prochaine fois.',
    tickUnjudged: 'Tout cocher sauf ceux que l’hôte juge',
    title: 'Mêlée',
    untickAll: 'Tout décocher',
    yourLineUps: {
      hint: 'Tes parties enregistrées d’abord, puis celles que tu as jouées, la plus récente en premier.',
      putBack: 'La remettre',
      remove: 'Retirer « {name} »',
      removed: '« {name} » retirée',
      starHint:
        'Mets une étoile sur une partie pour l’enregistrer : à ta prochaine visite, elle passera en tête de cette rangée.',
      fewer: 'Moins',
      title: 'Tes parties'
      more: defineTranslation('et {count:plural}', {
        plural: { count: { one: '{?} autre', other: '{?} autres' } }
      }),
    }
  },
  host: {
    answered: defineTranslation('{count:plural} sur {total:number}', {
      plural: { count: { one: '{?} réponse', other: '{?} réponses' } }
    }),
    answerMode: {
      buzzer: 'Le premier qui buzze',
      choice: 'Quatre propositions',
      colour: 'On refait la couleur',
      label: 'Comment on répond',
      letters: 'On fait le mot le plus long',
      move: 'On déplace l’allumette',
      number: 'On tape un nombre',
      order: 'Dans l’ordre',
      pairs: 'On choisit le plus grand',
      point: 'On pointe sur la carte',
      spoken: 'Équipe par équipe',
      typed: 'On tape',
      vote: 'On vote pour quelqu’un',
      word: 'On trouve le mot'
    },
    answerWindow: {
      label: 'Temps pour répondre après un buzz'
    },
    arrival: '{nickname} arrive',
    autoAdvance: 'Temps avant la manche suivante',
    backToRoom: 'Retour à la table',
    closeRoom: {
      confirm: 'Oui, on ferme',
      label: 'Fermer la table',
      warning: 'Tout le monde sort, et le code cesse de fonctionner.'
    },
    countdown: 'Décompte',
    difficulty: {
      easy: 'Facile',
      evening: 'Niveau de tous les jeux',
      hard: 'Difficile',
      hint: {
        easy: 'Rien que du très connu : de quoi jouer avec des enfants.',
        hard: 'Moins d’évidences, pour une table qui connaît son sujet.',
        mixed: 'Du très connu au plus pointu.'
      },
      label: 'Niveau',
      mixed: 'Mélangé'
    },
    endGame: 'Terminer la partie',
    evening: {
      actions: 'Options de {name}',
      add: 'Ajouter un jeu',
      addHint: 'Un autre jeu, ou le même réglé autrement',
      challengeLine:
        'Son défi se choisit quand sa manche arrive, parmi trois : tes défis d’abord, puis la banque.',
      chance: {
        among: 'parmi {games}',
        drawn: '{count:number} au hasard',
        endless: 'Puis au hasard, jusqu’à ce que tu arrêtes',
        over: 'de trop pour {total:number} manches',
        overHint:
          'Chaque jeu prévu se joue une fois : la partie doit s’allonger.',
        race: 'Puis au hasard, jusqu’au premier arrivé',
        raise: 'Passer à {count:number}'
      },
      detail: {
        allSubjects: 'Tous les sujets',
        drawnCategories: '{count:number} catégories tirées',
        everyDecade: 'Toutes les décennies',
        loneFinds: 'Une réponse unique compte double',
        oneGo: 'Un essai chacun',
        openField: 'Essais illimités',
        playlist: 'Playlist Deezer {id}',
        search: '«\u00a0{query}\u00a0»',
        swatch:
          'Montrée {shown:number}\u00a0s, {rebuild:number}\u00a0s pour la refaire',
        without: 'Sans {letters}'
      },
      drag: 'Déplacer la manche {number:number}, {name}',
      draw: {
        add: 'Ajouter un jeu au tirage',
        addHint: 'Tiré au sort seulement, sans manche prévue',
        brought:
          'Un jeu dont tu apportes le contenu se joue une fois : il n’est jamais tiré.',
        empty: 'Aucun jeu au tirage : n’importe quel jeu prévu peut sortir.',
        heading: 'Au hasard',
        inDraw: 'Au tirage',
        inDrawNamed: '{name} au tirage',
        onlyDrawn: 'Tirage seulement',
        said: 'Chaque manche après les jeux prévus est tirée parmi ces jeux.',
        takeOut: 'Retirer {name} du tirage'
      },
      duplicate: 'Dupliquer',
      earlier: 'Plus tôt',
      fills: 'Remplit la partie',
      fixed: 'Déjà jouée : elle ne change plus.',
      later: 'Plus tard',
      next: 'La suite',
      once: 'Se joue une fois',
      pastThePlan: {
        draw: 'Au hasard',
        label: 'Ensuite',
        repeat: 'On recommence'
      },
      pick: 'Ajouter un jeu',
      pickHint:
        'Un jeu dont tu apportes le contenu se joue une fois. Les autres remplissent les manches que tu n’as pas préparées.',
      planned: defineTranslation('{count:plural}', {
        plural: { count: { one: 'Prévu', other: 'Prévu {?}×' } }
      }),
      roundNamed: 'Manche {number:number} : {name}',
      rounds: 'Les jeux prévus',
      settings: 'Régler',
      slateKeyLater: 'Ses réponses se tapent quand elle passe en prochaine.',
      span: {
        all: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: '{?} manche',
              other: '{?} manches'
            }
          }
        }),
        endless: 'jusqu’à ce que tu arrêtes',
        from: 'dès la manche {from:number}',
        last: 'manche {number:number}',
        race: 'jusqu’au premier arrivé',
        rest: 'manches {from:number} à {to:number}'
      },
      stamp: {
        beyond: 'Hors programme',
        count: '{count:number}×',
        first: 'En premier',
        next: 'Ensuite',
        now: 'En cours',
        once: 'Une fois',
        played: 'Jouée'
      },
      takenOut: 'Retiré de la partie : {name}',
      undo: 'Annuler'
    },
    eveningEnd: {
      finish: 'Arrivée',
      finishSummary: 'Premier arrivé',
      hint: {
        countOnTrack:
          'Arriver au bout ne l’arrête pas : on y attend la dernière manche.',
        finish: 'La partie s’arrête dès que quelqu’un atteint la dernière case.'
      },
      label: 'Fin de partie'
    },
    familyFriendly: {
      hint: {
        off: 'Le quiz peut tomber sur des questions réservées aux adultes.',
        on: 'Aucune question réservée aux adultes.'
      },
      label: 'Tout public',
      summaryOff: 'questions pour adultes comprises'
    },
    final: {
      nobody: 'Personne n’a marqué',
      tied: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'à égalité avec {?} point',
            other: 'à égalité avec {?} points'
          }
        }
      }),
      tiedOnCase: 'à égalité case {case:number}',
      wins: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'gagne avec {?} point',
            other: 'gagne avec {?} points'
          }
        }
      }),
      winsOnCase: 'gagne case {case:number}'
    },
    game: {
      label: 'À quoi on joue',
      prompt:
        'Touche un jeu pour le prévoir. Tu pourras en ajouter d’autres pour les enchaîner.'
    },
    holdReveal: 'Attendre',
    hostDecides: 'Tu décides',
    inPlay: defineTranslation('{count:plural} sur {total:number} en jeu', {
      plural: { count: { other: '{?}' } }
    }),
    judgedMark: {
      host: 'L’hôte juge',
      you: 'Tu juges sans jouer'
    },
    lineUp: {
      takeOut: 'Retirer'
    },
    needsGame: 'Choisis à quoi la table joue',
    needsPlayer: 'Il faut au moins quelqu’un à table',
    nextDuel: 'En duel',
    nextRound: 'Manche suivante',
    panel: {
      fold: 'Replier le panneau',
      label: 'Animer la table',
      settled: 'Fixé pour la partie',
      tabs: {
        game: 'Jeu',
        players: 'Joueurs',
        room: 'Salle',
        stage: 'Partie',
        table: 'Table'
      },
      toLeft: 'Mettre le panneau à gauche',
      toRight: 'Mettre le panneau à droite',
      unfold: 'Déplier le panneau'
    },
    playAgain: 'Rejouer',
    players: {
      count: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} joueur', other: '{?} joueurs' } }
      }),
      removeNamed: 'Retirer {nickname}'
    },
    podium: {
      actions: 'Options pour {nickname}',
      casesHint:
        '– et + : une case d’un coup, pour une réponse que le jeu n’a pas vue.',
      empty:
        'Personne pour l’instant. Lis {code} à voix haute, ou montre le QR de l’écran de la salle.',
      more: '+{count:number}',
      pointsHint:
        '– et + : {points:number} points d’un coup, pour une réponse que le jeu n’a pas vue.',
      roster: 'Joueurs',
      settings: 'Réglages',
      tied: 'à égalité'
    },
    points: {
      give: '{points:number} points de plus pour {name}',
      label: 'Points',
      take: '{points:number} points de moins pour {name}'
    },
    ready: {
      everyone: 'Tout le monde est prêt'
    },
    recovery: {
      action: 'Tenir la table d’ici',
      description: 'Il est dans l’onglet Salle de l’hôte, sous Cet écran.',
      field: 'Code de reprise',
      hint: 'À saisir ailleurs pour reprendre la table depuis là-bas.',
      invalid: 'Ce n’est pas un code de reprise.',
      refused: 'Ce code ne va pas avec cette table.',
      retry: 'Réessayer',
      reveal: 'Afficher le code de reprise'
    },
    reveal: 'Donner la réponse',
    roomScene: {
      here: {
        mark: 'Ici',
        name: 'Cet écran',
        playsToo: 'Et tu y joues.',
        runs: 'C’est cet écran qui tient la table.',
        showsGame: 'Il montre la partie et joue le son.',
        state: 'tu mènes'
      },
      label: 'La salle vue de dessus',
      seat: {
        betweenRounds: 'Tu pourras prendre une place entre deux manches.',
        free: 'libre',
        launchSeats:
          'Personne ne s’est encore assis : lancer la partie te donne une place.',
        lines:
          'Tu mènes sans jouer. Prends une place pour répondre depuis cet écran, comme les autres depuis le leur.',
        name: 'Ta place',
        title: 'Jouer aussi',
        titleTaken: 'Ta place à table'
      },
      sound: {
        here: 'Ici',
        playsOn: 'Joué sur',
        title: 'Le son',
        wall: 'L’écran de la salle',
        wallNumbered: 'Écran {number:number}'
      },
      table: {
        count: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: '{?} joueur',
              other: '{?} joueurs'
            }
          }
        }),
        empty: 'Personne à table pour l’instant',
        emptyButYou: 'Personne d’autre à table pour l’instant'
      },
      wall: {
        anotherLines:
          'Il montre la partie aussi, sans le son : un seul écran le joue. Ouvre Mêlée dessus, choisis « Devenir l’écran de la pièce », puis tape ici le code qu’il affiche.',
        anotherTitle: 'Un écran de plus',
        dismiss: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: 'Libérer l’écran de la salle',
              other: 'Libérer les écrans de la salle'
            }
          }
        }),
        linesOff:
          'Pour l’instant, cet écran montre la partie et joue le son. Rien d’autre n’est nécessaire : on joue très bien comme ça.',
        linesOn: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: 'Il montre la partie et joue le son, sauf si tu gardes le son ici. Cet écran-ci garde les commandes.',
              other:
                'Ils montrent la partie ; le son se joue sur celui que tu choisis, ou ici. Cet écran-ci garde les commandes.'
            }
          }
        }),
        name: 'L’écran de la salle',
        off: 'aucun pour l’instant',
        on: defineTranslation('{count:plural}', {
          plural: { count: { one: 'branché', other: '{?} branchés' } }
        }),
        pairLines:
          'Ouvre Mêlée dessus et choisis « Devenir l’écran de la pièce », puis tape ici le code qu’il affiche.',
        pairTitle: 'Un écran à côté',
        tabTitle: 'Ou un onglet de celui-ci',
        titleOff: 'Mettre la partie sur un autre écran',
        titleOn: 'L’écran de la salle'
      }
    },
    roundCount: {
      open: 'Sans fin',
      openSummary: 'Jusqu’à ce que tu arrêtes',
      summary: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} manche', other: '{?} manches' } }
      })
    },
    rounds: 'Manches',
    saved: {
      door: 'Parties enregistrées',
      doorCount: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} enregistrée', other: '{?} enregistrées' }
        }
      }),
      doorEmpty: 'Enregistre celle-ci pour la relancer une autre fois',
      empty:
        'Aucune partie enregistrée pour l’instant. Donne un nom à celle-ci pour la relancer une autre fois.',
      endless: 'Sans fin',
      export: 'Exporter',
      exportFileName: 'melee-parties.json',
      forget: 'Oublier {name}',
      heading: 'Parties enregistrées',
      import: 'Importer',
      imported: defineTranslation('{evenings:plural} et {lines:plural}.', {
        plural: {
          evenings: {
            one: '{?} partie importée',
            other: '{?} parties importées',
            zero: 'Aucune partie importée'
          },
          lines: {
            one: '{?} défi ajouté',
            other: '{?} défis ajoutés',
            zero: 'aucun nouveau défi'
          }
        }
      }),
      importRefused: 'Ce fichier n’est pas un export de Mêlée.',
      inLobby: 'Une partie enregistrée se lance avant la première manche.',
      loaded: 'Partie chargée : « {name} »',
      name: 'Nom de la partie',
      replace: 'Remplacer',
      replaces:
        'Une partie est déjà enregistrée sous ce nom : celle-ci prend sa place.',
      rounds: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} manche', other: '{?} manches' } }
      }),
      run: 'Lancer {name}',
      save: 'L’enregistrer',
      savedOver: '« {name} » est à jour',
      saveOver: 'Enregistrer par-dessus',
      saveOverNamed: 'Enregistrer par-dessus « {name} »',
      transferHint:
        'Tes parties et tes défis tiennent dans un fichier, pour les retrouver sur une autre machine.'
    },
    seat: {
      action: 'Prendre place',
      cost: {
        hiddenAnswer: 'Tu ne verras plus la réponse avant les autres.',
        sharedScreen: 'Tu cours sur l’écran que toute la table regarde.'
      },
      label: 'Jouer depuis cet écran, sous le nom de',
      leave: 'Rendre sa place',
      offer: 'Jouer depuis cet écran',
      sittingOut: 'Tu juges cette manche, tu rejoues à la suivante.',
      taken: 'Tu joues sous le nom de {nickname}.',
      withheld: {
        aloud:
          'Les équipes répondent à voix haute et tu les juges, donc pas de place ici.'
      }
    },
    seconds: '{seconds:number} s',
    seeResults: 'Voir les résultats',
    setup: {
      group: {
        room: 'La salle',
        table: 'La table'
      },
      roundInPlay: 'Les changements s’appliquent à la manche suivante',
      summary: {
        countdown: 'Décompte de {duration}',
        hold: 'Réponse affichée {duration}',
        holdOpen: 'La suite quand tu veux'
      }
    },
    skipRound: 'Passer cette manche',
    speedBonus: {
      hint: {
        off: 'Seule la bonne réponse compte : elle rapporte les 100 points.',
        on: 'Une réponse parfaite rapporte 90, et la donner tôt ajoute jusqu’à 10.'
      },
      label: 'Bonus de vitesse',
      summaryOff: 'sans bonus de vitesse'
    },
    standings: 'Classement',
    startGame: 'À table\u00a0!',
    table: {
      arrivals: {
        chosen: '{count:number} à table, chacun choisit son équipe',
        drawn: '{count:number} à table, en attente du tirage',
        seats: '{count:number} à table, chacun son pion sur Départ'
      },
      evening: 'Partie en équipes',
      eveningSeats: 'Partie de jeux',
      more: '+{count:number}',
      rules: {
        points: defineTranslation(
          '{rounds:plural}\u00a0: l’équipe qui marque le plus gagne.',
          { plural: { rounds: { one: '{?} manche', other: '{?} manches' } } }
        ),
        pointsOpen: 'L’équipe qui marque le plus gagne.',
        seatTrack: defineTranslation(
          '{rounds:plural}, {length:number} cases : le plus avancé gagne.',
          { plural: { rounds: { one: '{?} manche', other: '{?} manches' } } }
        ),
        seatTrackOpen:
          '{length:number} cases, sans fin : le plus avancé à la fin gagne.',
        seatTrackRace: '{length:number} cases : le premier à l’arrivée gagne.',
        track: defineTranslation(
          '{rounds:plural}, {length:number} cases : l’équipe la plus avancée gagne.',
          { plural: { rounds: { one: '{?} manche', other: '{?} manches' } } }
        ),
        trackOpen:
          '{length:number} cases, sans fin : l’équipe la plus avancée à la fin gagne.',
        trackRace:
          '{length:number} cases : la première équipe à l’arrivée gagne.'
      }
    },
    verdict: {
      right: 'Bonne réponse',
      showAnswer: 'Voir la réponse',
      wrong: 'Raté'
    }
  },
  innerclock: {
    counted: defineTranslation('{seconds:number} s', {
      number: {
        seconds: { maximumFractionDigits: 1, minimumFractionDigits: 1 }
      }
    }),
    endCount: 'Arrêter le compte',
    gap: defineTranslation('{seconds:number} s', {
      number: {
        seconds: {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
          signDisplay: 'exceptZero'
        }
      }
    }),
    go: 'Compte.',
    hint: 'Une seule pression, quand tu penses y être. Rien ne bougera avant la fin.',
    home: {
      description:
        'Le mur annonce un nombre de secondes, puis tous les écrans se figent : pas d’horloge, rien qui bouge. Compte dans ta tête et appuie une seule fois quand tu penses y être — plus tu tombes près, plus tu marques. La table a le droit de te déconcentrer à voix haute.'
    },
    name: 'Horloge interne',
    nobody: 'Personne n’a appuyé',
    play: 'Jouer à l’Horloge interne',
    press: 'Stop',
    pressed: 'C’est noté. Quelqu’un compte encore.',
    prompt: {
      after: 'secondes dans ta tête',
      before: 'Compte jusqu’à'
    },
    scoring:
      'Compte dans ta tête et appuie une fois. 100 points pile à l’heure, rien à un quart du compte d’écart — plus c’est près, plus ça paie.',
    silent: 'n’a pas appuyé',
    tagline: 'Compte dans ta tête. Arrête-toi pile.',
    target: {
      description: 'En secondes, de 10 à 180.',
      draw: 'Tirer au sort',
      label: 'Compter jusqu’à'
    }
  },
  invite: {
    action: 'Inviter',
    copied: 'Copié',
    copyCode: 'Copier le code',
    copyFailed: 'Copie impossible',
    copyLink: 'Copier le lien',
    documentTitle: 'Invitation — Mêlée',
    joinLate: 'Rejoins quand tu veux',
    nextRound: 'Qui arrive pendant une manche joue dès la suivante.',
    project: 'Afficher le QR code en grand',
    share: 'Partager',
    shareTitle: 'Rejoins la table {code} sur Mêlée',
    title: 'Scanne pour jouer',
    typeIt: 'Tape-le pour rejoindre',
    unknown: {
      description:
        'Ce code n’ouvre aucune table. Elle a peut-être été fermée, ou le code mal lu.',
      title: 'Aucune table ici'
    }
  },
  join: {
    host: {
      action: 'Ouvrir une table'
    },
    player: {
      action: 'Rejoindre',
      title: 'Rejoindre une table'
    },
    rightAway: {
      action: 'Jouer tout de suite',
      as: 'Sous le nom de {nickname}',
      change: 'Changer',
      name: 'On t’appelle comment ?',
      starting: 'On installe la table…'
    },
    roomCode: {
      label: 'Code de la table',
      unknown: 'Aucune table sous ce code.',
      unsupportedCharacters:
        'Un code de table ne contient jamais {characters}.',
      wrongLength: defineTranslation('{length:plural}', {
        plural: {
          length: {
            one: 'Un code de table fait {?} caractère.',
            other: 'Un code de table fait {?} caractères.'
          }
        }
      })
    }
  },
  legal: {
    host: {
      body: 'Mêlée est hébergée, et ses tables tenues, par :',
      heading: 'Hébergeur'
    },
    intro:
      'Qui publie Mêlée, ce qu’elle garde sur les gens qui jouent et pour combien de temps, et comment y changer quelque chose.',
    measurement: {
      body: 'Les visites sont comptées par un outil que j’ai construit et que je fais tourner moi-même, sur analytics.adrienlcp.com, sans cookie. Une page vue enregistre l’adresse de la page, le site d’où tu viens, la langue et le thème de ton navigateur, la largeur de sa fenêtre et la vitesse à laquelle la page s’est chargée. Elle n’enregistre aucune adresse IP, ni rien qui distingue un visiteur d’un autre.',
      counted: 'Tes visites sont comptées, anonymement.',
      exemption:
        'Cette mesure ne demande pas de consentement selon les lignes directrices de la CNIL, et tu peux quand même la refuser pour ce navigateur.',
      heading: 'Mesure d’audience',
      refused: 'Tes visites ne sont pas comptées dans ce navigateur.',
      refusedByBrowser:
        'Ton navigateur envoie Global Privacy Control, tes visites ne sont donc jamais comptées.',
      retention: defineTranslation(
        'Chaque enregistrement est gardé {months:plural} au plus.',
        {
          plural: { months: { one: '{?} mois', other: '{?} mois' } }
        }
      ),
      saveFailed:
        'Ton navigateur n’a pas gardé ce choix. Réessaie, ou active Global Privacy Control.',
      storageBlocked:
        'Ce navigateur bloque le stockage des sites, un refus ne peut donc pas être gardé ici. Activer Global Privacy Control dans ton navigateur refuse la mesure sur tous les sites.',
      switch: 'Compter mes visites'
    },
    publisher: {
      address:
        'En tant qu’éditeur non professionnel, je donne l’identité de l’hébergeur à la place d’une adresse postale (LCEN, article 6-III-2).',
      body: 'Mêlée est publiée par {name}, un particulier, pas une entreprise. Tu peux m’écrire depuis <contact>cette page de contact</contact>.',
      heading: 'Éditeur'
    },
    rights: {
      body: 'Le RGPD te permet d’accéder à ce qui te concerne, de le rectifier, de l’effacer ou de t’opposer à son usage. L’essentiel vit dans ton navigateur, et effacer les données de ce site l’efface. Pour le reste, demande-le depuis <contact>la page de contact</contact> ; je réponds sous un mois.',
      complaint:
        'Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la <authority>CNIL</authority>.',
      heading: 'Tes droits'
    },
    storage: {
      analyticsOptOut:
        'Ton refus de la mesure d’audience, si tu la coupes plus bas.',
      challengeLines:
        'Les défis que l’hôte a écrits à l’avance, et lesquels ont déjà été joués.',
      device:
        'Mêlée ne dépose aucun cookie. Ce qu’elle retient reste dans ton navigateur, pour ce site seulement, jusqu’à ce que tu l’effaces :',
      heading: 'Ce que Mêlée garde',
      hostSetup:
        'Comment tu as réglé la dernière table que tu as tenue, jeu par jeu, pour que la suivante s’ouvre pareil.',
      hostTokens:
        'La clé de chaque table que tu as ouverte, qui te permet de la reprendre depuis un autre écran. Oubliée au bout d’un jour.',
      lineUpGames:
        'Les jeux de la dernière partie que tu as tenue, cochés à nouveau sur la prochaine table que tu ouvres.',
      locale: 'La langue que tu as choisie.',
      logs: 'Cloudflare garde un journal de chaque requête pendant trois jours, pour trouver ce qui a cassé : il contient ton adresse IP et le nom de ton navigateur à côté du code de la table, jamais un pseudo ni une réponse.',
      nickname:
        'Le nom sous lequel tu as joué la dernière fois, pour que la table suivante le remplisse pour toi.',
      panelFolded:
        'Si tu as replié le panneau à côté de la table que tu animes.',
      panelSide: 'De quel côté de l’écran tu as mis ce panneau.',
      pawn: 'Le pion que tu as choisi la dernière fois — sa couleur et sa tête —, que la table suivante te donne si personne ne l’a déjà.',
      recentTables:
        'Les parties des dernières tables que tu as tenues, avec le code de chacune, quand elle a été jouée et combien de manches elle a duré, pour en relancer une.',
      ownLineUpsHeight:
        'La hauteur de tes parties sur la page d’accueil, et la largeur de fenêtre où elle a été mesurée, pour que la visite suivante leur garde la place avant qu’elles ne s’affichent.',
      savedEvenings:
        'Les parties que tu as enregistrées sous un nom, chaque jeu avec ses réglages, pour les relancer.',
      seats:
        'La place que tu occupes à chaque table rejointe, pour qu’un rechargement ou un écran verrouillé t’y ramène avec ton score. Oubliée au bout d’un jour.',
      server:
        'Tant qu’une table est jouée, les serveurs de Cloudflare la gardent : les pseudos autour, les réponses données, les scores, les réglages et les questions que la partie a apportées. Tout est supprimé quand l’hôte ferme la table, ou une heure après que le dernier écran l’a quittée. Il n’y a pas de compte, et rien de ce qui te concerne ne survit à la table.',
      session:
        'Deux autres sont gardées pour l’onglet ouvert seulement, et partent quand il se ferme :',
      slateKeys:
        'Les réponses d’une ardoise que l’hôte a tapées à l’avance, avant d’ouvrir la table.',
      theme:
        'Le thème que tu as choisi : clair, sombre ou celui de ton système.',
      volume:
        'Le dernier volume de salle réglé depuis cet écran, celui où démarre la prochaine table qu’il ouvre.',
      wallSessions:
        'Quel écran de la salle est cet onglet, pour qu’un rechargement le garde et qu’un deuxième onglet soit un autre écran.'
    },
    thirdParties: {
      assistant:
        'Si tu prépares la partie avec un assistant, son éditeur envoie à Mêlée la partie qu’il a composée et reçoit un lien en retour : rien sur toi, et Mêlée n’en garde rien. Ce que tu dis à l’assistant relève des conditions de son propre éditeur.',
      cloudflare:
        'Cloudflare, l’hébergeur, reçoit ton adresse IP à chaque requête, pour livrer la page et protéger le site des abus. Ouvrir une table est compté sur ton adresse IP pendant une minute, pour que personne ne puisse en ouvrir des centaines.',
      deezer:
        'Le blind test prend sa musique chez Deezer. Ce que l’hôte recherche, ou la playlist qu’il donne, est envoyé à Deezer par le serveur de Mêlée, sans rien sur toi. Les extraits de 30 secondes et les pochettes d’album, eux, sont chargés par ton navigateur directement depuis les serveurs de Deezer, qui reçoivent donc ton adresse IP et le nom de ton navigateur. <policy>La politique de confidentialité de Deezer</policy> s’y applique.',
      heading: 'Qui d’autre reçoit tes données',
      nobodyElse:
        'Aucun autre service n’est appelé. Les polices sont servies par Mêlée elle-même, et le QR code est dessiné dans ton navigateur.'
    },
    title: 'Mentions légales et confidentialité'
  },
  loading: 'Chargement…',
  longestword: {
    home: {
      description:
        'Neuf lettres s’affichent sur tous les écrans. Chacun tape le mot le plus long qu’il peut en tirer, chaque lettre une fois, autant de mots qu’il veut : seul le plus long compte. La pièce voit la longueur du mot de chacun, jamais le mot, jusqu’à ce que la révélation donne le plus long que cachait le tirage.'
    },
    name: 'Mot le plus long',
    play: 'Jouer à Mot le plus long',
    scoring:
      'Ton mot le plus long est payé selon sa longueur face au plus long du tirage : aussi long, il rapporte 100 points, plus court, moins, et trois lettres ou moins ne rapportent rien.',
    tagline: 'Neuf lettres, un mot, le plus long possible.'
  },
  matchsticks: {
    duration: 'Temps par énigme',
    goal: {
      biggest: 'Déplace une allumette pour faire le plus grand nombre',
      equation: 'Déplace une allumette pour que l’égalité soit juste',
      smallest: 'Déplace une allumette pour faire le plus petit nombre'
    },
    goals: {
      biggest: 'Plus grand nombre',
      equation: 'Égalités',
      label: 'Énigmes',
      smallest: 'Plus petit nombre'
    },
    home: {
      description:
        'Une égalité fausse dessinée en allumettes — ou un nombre à rendre le plus grand, ou le plus petit, possible. Chacun prend une allumette sur son écran et la pose ailleurs : la bonne réponse rapporte le plus, les nombres suivants un peu moins. Ou à voix haute : le premier à buzzer dit quelle allumette bouge et où, et l’hôte tranche. Chaque énigme est tirée à neuf, la partie ne s’épuise jamais, et toutes ont une réponse.'
    },
    move: {
      groove:
        'Place vide {slot}, dans le {glyph} en position {position:number}',
      label: 'Les allumettes',
      layDown: 'Pose-la maintenant sur une place vide.',
      pickUp: 'Prends une allumette et pose-la ailleurs.',
      placed: 'Valide ce coup, ou déplace encore une allumette.',
      send: 'Valider',
      sent: 'Ton coup est parti. On attend les autres.',
      slot: {
        a: 'en haut',
        b: 'en haut à droite',
        c: 'en bas à droite',
        d: 'en bas',
        e: 'en bas à gauche',
        f: 'en haut à gauche',
        g: 'au milieu',
        h: 'à plat',
        v: 'debout'
      },
      stick: 'Allumette {slot}, dans le {glyph} en position {position:number}',
      undo: 'La remettre',
      unreadable: 'Des allumettes qui ne forment ni chiffres ni signes'
    },
    name: 'Allumettes',
    numberRule: {
      buzzer:
        'Seul le meilleur nombre compte. Un nombre ne commence jamais par 0.',
      move: 'Un nombre ne commence jamais par 0.'
    },
    play: 'Jouer aux Allumettes',
    reveal: {
      right: 'juste',
      second: 'deuxième meilleur',
      short: 'mieux, mais pas assez',
      third: 'troisième meilleur',
      title: 'Le déplacement :',
      wrong: 'raté',
      yours: 'Ton coup :'
    },
    scoring:
      'Une allumette à déplacer. Le premier à buzzer dit son coup à voix haute, et l’hôte tranche — 100 points s’il a raison.',
    scoringMove:
      'Une allumette à déplacer, tout le monde en même temps. La bonne réponse vaut 100 points — sur un nombre, la suivante 67 et la troisième 33.',
    tagline: 'Une allumette bouge. Trouve laquelle.'
  },
  menu: {
    build: 'Version {build}',
    buildDated: 'Version du {date} · {build}',
    credit: 'Réalisé par <author>{name}</author>',
    fullscreen: {
      enter: 'Plein écran',
      exit: 'Quitter le plein écran'
    },
    home: 'Accueil',
    install: {
      action: 'Installer Mêlée',
      apple: 'Pour l’installer : Partager, puis « Sur l’écran d’accueil ».'
    },
    label: 'Menu',
    leaveRoom: 'Quitter la table',
    nickname: {
      action: 'Changer',
      field: 'Nouveau pseudo',
      label: 'Pseudo'
    },
    reload: 'Recharger',
    source: 'Code source',
    thisDevice: {
      qrCode: {
        action: 'Afficher',
        description: 'Pour un écran à l’entrée, sans rejoindre la partie.',
        label: 'Afficher le QR code d’une table'
      },
      wall: {
        label: 'Devenir l’écran de la pièce'
      }
    }
  },
  mostlikely: {
    ballot: {
      label: 'C’est qui ?',
      sent: 'Ton vote est parti. On attend les autres.',
      you: 'Toi'
    },
    home: {
      description:
        'Une phrase s’affiche — qui a le plus de chances de parler à ses plantes ? — et chacun vote pour quelqu’un de la table, soi-même compris. Personne ne voit qui a voté pour qui : le dévoilement compte les voix, et tous ceux qui ont voté comme la table marquent.'
    },
    name: 'Qui de nous ?',
    play: 'Jouer à Qui de nous ?',
    reveal: {
      chose: 'La table a choisi',
      nobody: 'Personne : les voix sont parties dans tous les sens.',
      votes: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} voix', other: '{?} voix' } }
      }),
      yourVote: 'Ton vote'
    },
    roundDuration: 'Temps pour voter',
    scoring:
      'Une phrase sur l’un de vous s’affiche et chacun vote pour quelqu’un, soi-même compris. Vote comme la table et tu marques 100 points. Pas de bonus de vitesse.',
    tagline: 'Une phrase, l’un de vous. C’est qui ?'
  },
  mysteryword: {
    home: {
      description:
        'Un mot est caché, sa première lettre et sa longueur sur tous les écrans. Six essais chacun pour le trouver, chaque lettre colorée : bien placée, ailleurs dans le mot, ou absente. La pièce voit toutes les grilles en couleurs, jamais les lettres.'
    },
    length: '{count:number} lettres',
    name: 'Mot mystère',
    play: 'Jouer à Mot mystère',
    scoring:
      'Un mot trouvé au premier ou au deuxième essai rapporte 100 points, puis 85, 70, 55 et 40 aux essais suivants ; un mot pas trouvé ne rapporte rien.',
    tagline: 'Six essais pour trouver le mot caché.'
  },
  navigation: {
    back: 'Retour aux jeux',
    skipToContent: 'Aller au contenu'
  },
  notFound: {
    description: 'La partie est finie, ou le code a été mal tapé.',
    documentTitle: 'Personne ici — Mêlée',
    title: 'Personne ici'
  },
  pawn: {
    betweenRounds: 'Il se change entre deux manches, pas pendant.',
    colour: {
      pawn1: 'Rouge',
      pawn2: 'Bleu',
      pawn3: 'Jaune',
      pawn4: 'Vert',
      pawn5: 'Violet',
      pawn6: 'Orange',
      pawn7: 'Rose',
      pawn8: 'Turquoise',
      pawn9: 'Anis',
      pawn10: 'Marron',
      pawn11: 'Fuchsia',
      pawn12: 'Ciel'
    },
    head: {
      point: 'tête pointue',
      round: 'tête ronde',
      square: 'tête carrée'
    },
    label: {
      seat: 'Mon pion',
      team: 'Le pion de mon équipe'
    },
    piece: '{colour}, {head}',
    press: {
      label: 'Couleur',
      seat: 'Couleur de mon pion, {piece}'
    },
    taken: '{pawn}, déjà pris',
    takenBy: '{pawn}, pris par {holder}',
    teamHint: 'Toute ton équipe change de couleur avec lui.'
  },
  petitbac: {
    category: {
      animal: 'Animal',
      bodyPart: 'Partie du corps',
      brand: 'Marque',
      cartoonCharacter: 'Personnage de dessin animé',
      cheese: 'Fromage',
      city: 'Ville',
      clothing: 'Vêtement',
      colour: 'Couleur',
      country: 'Pays',
      dish: 'Plat',
      drink: 'Boisson',
      famousPerson: 'Personne célèbre',
      fictionalCharacter: 'Personnage de fiction',
      film: 'Film',
      firstName: 'Prénom',
      fruitOrVegetable: 'Fruit ou légume',
      gift: 'Cadeau',
      hobby: 'Loisir',
      instrument: 'Instrument de musique',
      job: 'Métier',
      kitchenThing: 'Dans une cuisine',
      lateExcuse: 'Excuse pour un retard',
      personalityTrait: 'Trait de caractère',
      plant: 'Plante',
      series: 'Série',
      singer: 'Chanteur ou chanteuse',
      sport: 'Sport',
      thingInABag: 'Dans un sac',
      tool: 'Outil',
      toy: 'Jouet',
      vehicle: 'Véhicule'
    },
    home: {
      description:
        'Une lettre tombe et chaque écran reçoit la même grille — un pays, un animal, un prénom — à remplir de mots qui commencent par elle. Le premier qui a tout rempli peut crier stop. Puis la salle vote catégorie par catégorie, et un mot que personne d’autre n’a écrit rapporte double.'
    },
    host: {
      cancelStop: 'Annuler le stop',
      nextCategory: 'Catégorie suivante',
      toScores: 'Voir les scores'
    },
    letter: 'Lettre {letter}',
    name: 'Petit Bac',
    play: 'Jouer au Petit Bac',
    reveal: {
      outcome: {
        empty: 'Vide',
        offLetter: 'Pas un {letter}',
        refused: 'Ne compte pas',
        shared: 'Partagée',
        unique: 'Personne d’autre'
      },
      strike: 'Rayer : {answer}',
      strikeHint: 'Choisis un mot pour le rayer ou le remettre',
      title: 'Ta feuille'
    },
    scoring:
      'Une lettre, un mot par catégorie. La grille vaut 100 points, partagés à parts égales entre ses catégories, et la table vote sur chaque réponse : celle que personne d’autre n’a écrite rapporte toute sa part, une réponse partagée la moitié.',
    setup: {
      add: 'Ajouter',
      bank: 'Toutes prêtes',
      categories: 'Catégories',
      count: 'Catégories par manche',
      drawn: 'Nouvelles à chaque manche',
      duration: 'Temps pour écrire',
      fixed: 'Les mêmes à chaque manche',
      letters: 'Lettres qui peuvent tomber',
      new: 'Une catégorie à toi',
      newPlaceholder: 'Un truc vert',
      own: 'Tes catégories',
      remove: 'Retirer {label}',
      stop: 'Une feuille pleine peut dire stop',
      summary: defineTranslation(
        '{count:plural} · entre {min:number} et {max:number}',
        {
          plural: { count: { one: '{?} catégorie', other: '{?} catégories' } }
        }
      )
    },
    sheet: {
      field: '{category}, en {letter}',
      label: 'Ta feuille'
    },
    stop: {
      barred: 'Ton stop a été annulé : les autres finissent la manche.',
      called: '{name} a dit stop',
      calledByYou: 'Tu as dit stop',
      filling: 'Stop · {filled:number}/{count:number}',
      offLetter: 'Pour dire stop, chaque ligne doit commencer par {letter}.',
      press: 'Stop !'
    },
    tagline: 'Une lettre. Remplis chaque ligne.',
    vote: {
      done: 'J’ai fini',
      doneCount: defineTranslation(
        '{done:plural} · le vote passe à la suite quand tout le monde a fini',
        { plural: { done: { one: '{?} a fini', other: '{?} ont fini' } } }
      ),
      moveOn: 'Le vote passe à la suite quand tout le monde a fini.',
      of: '{index:number} sur {count:number}',
      refuse: 'Ne compte pas',
      refuseRow: 'Ne compte pas : {answer}',
      yours: 'La tienne'
    },
    wall: {
      against: '{refusals:number} contre',
      grid: 'Les feuilles de la manche, lettre {letter}',
      legendNothing: 'Ne compte pas, pas un {letter} ou vide · rien',
      lines: 'Les catégories',
      progress: '{filled:number}/{count:number}',
      roundTotal: 'Manche',
      sheets: 'Lignes remplies'
    }
  },
  player: {
    away: 'hors ligne',
    back: 'de retour à table',
    choosingGame: 'L’hôte choisit un jeu',
    final: {
      placing: 'Tu finis',
      rank: defineTranslation('{rank:plural}', {
        plural: {
          rank: {
            one: '{?}er',
            other: '{?}e',
            type: 'ordinal'
          }
        }
      })
    },
    gameOver: {
      detail: 'En attente des résultats',
      title: 'Fin de la partie'
    },
    lineUp: {
      ready: 'Prêt'
    },
    midRound: {
      detail: 'Ta place est gardée — cette\u00a0manche a commencé sans toi.',
      title: 'À la prochaine manche'
    },
    nickname: {
      action: 'Rejoindre',
      label: 'Pseudo',
      title: 'On t’appelle comment\u00a0?'
    },
    points: defineTranslation('{points:plural}', {
      plural: { points: { one: 'point', other: 'points' } }
    }),
    room: 'Table {code}',
    roomSize: '{count:number} à table',
    score: '{points:number}',
    seating: 'On te trouve une place…',
    standing: {
      ofRound: defineTranslation('{rank:plural} de la manche', {
        plural: {
          rank: {
            one: '{?}er',
            other: '{?}e',
            type: 'ordinal'
          }
        }
      }),
      overall: defineTranslation('{rank:plural} sur {count:number}', {
        plural: {
          rank: {
            one: '{?}er',
            other: '{?}e',
            type: 'ordinal'
          }
        }
      })
    },
    table: 'À la table',
    upNext: 'Tu vas jouer à',
    you: 'Toi'
  },
  preferences: {
    language: 'Langue',
    theme: {
      dark: 'Sombre',
      label: 'Thème',
      light: 'Clair',
      system: 'Système'
    },
    volume: 'Volume de la salle'
  },
  quiz: {
    category: {
      arts: 'Arts et culture',
      capitals: 'Capitales',
      cinema: 'Cinéma et télé',
      everyday: 'Quotidien',
      flags: 'Drapeaux',
      geography: 'Géographie',
      history: 'Histoire',
      label: 'Sur quels sujets',
      none: 'N’en choisis aucun et tu as tous les sujets.',
      quotes: 'Citations',
      rebus: 'Rébus',
      science: 'Sciences',
      silhouettes: 'Silhouettes',
      sport: 'Sport',
      videogames: 'Jeux vidéo'
    },
    duration: 'Temps par question',
    flag: {
      alt: 'Le drapeau à reconnaître'
    },
    home: {
      description:
        'De l’histoire, des sciences, du sport, et des questions que personne ne voit venir. Tout le monde répond en même temps, et la bonne réponse la plus rapide rafle la manche.'
    },
    language: 'Langue des questions',
    name: 'Quiz',
    play: 'Jouer au Quiz',
    rebus: {
      alt: 'Le rébus à lire :'
    },
    reveal: {
      title: 'La réponse était'
    },
    scoring: {
      buzzer:
        'Le premier qui buzze répond à voix haute, et l’hôte dit si c’est bon. 100 points si c’est juste — et une mauvaise réponse te met hors-jeu pour le reste de la manche.',
      choice:
        'Quatre propositions, et tout le monde répond en même temps. La bonne rapporte 100 points.',
      typed:
        'Tout le monde tape sa réponse en même temps. La bonne rapporte 100 points.'
    },
    silhouette: {
      alt: 'La forme du pays à reconnaître'
    },
    tagline: 'Une question, et le premier qui sait.'
  },
  readyMade: {
    change: 'Changer',
    heading: 'Des parties toutes prêtes',
    hint: 'Un appui ouvre une table qui les enchaîne, déjà réglée.',
    lineUps: {
      firstGame: {
        caption: 'Rien à juger, rien à expliquer.',
        name: 'Première partie'
      },
      generalKnowledge: {
        caption: 'De quoi briller en société.',
        name: 'Culture générale'
      },
      grandMix: {
        caption:
          'Tous les jeux sans juge, sur plusieurs réglages, jamais deux pareils à la suite.',
        name: 'Mêlée générale'
      },
      music: {
        caption:
          'Trois blind tests : tubes français, années 80 et musiques de films.',
        name: 'Spéciale musique'
      },
      quick: {
        caption: 'La plus courte, presque rien à lire.',
        name: 'Partie éclair'
      }
    },
    loaded: '{name} est chargée.',
    oneAtATime: 'Ou un jeu à la fois',
    open: 'Ouvrir',
    rounds: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} manche', other: '{?} manches' } }
    })
  },
  reflex: {
    falseStart: {
      detail: 'Celle-là, tu la regardes depuis le banc.',
      title: 'Parti avant que l’écran change.'
    },
    flip: 'VAS-Y',
    hold: 'Appuie avant qu’il change et tu passes la manche.',
    home: {
      description:
        'Rien à savoir, rien à dire. L’écran reste immobile, puis il change — et les trois plus rapides marquent, le premier le plus. Pars avant qu’il change et celle-là, tu la regardes depuis le banc.'
    },
    landed: defineTranslation('{count:plural}', {
      plural: {
        count: { one: '{?} joueur a appuyé', other: '{?} joueurs ont appuyé' }
      }
    }),
    name: 'Réflexe',
    nobody: 'Personne n’a bougé',
    notYet: 'Attends que l’écran change',
    play: 'Jouer à Réflexe',
    pressed: 'C’est pris.',
    reaction: '{milliseconds:number} ms',
    scoring:
      'L’écran change : le plus rapide prend 100 points, le deuxième 60, le troisième 30. Pars avant qu’il change et tu passes la manche sur le banc.',
    tagline: 'L’écran change. Le plus rapide gagne.',
    tooEarly: 'parti trop tôt',
    waiting: 'Guette l’écran.'
  },
  room: {
    documentTitle: '{game} — Mêlée',
    documentTitleLobby: 'Mêlée',
    pause: {
      detail: 'La manche reprendra là où elle s’est arrêtée.',
      press: 'Pause',
      resume: 'Reprendre la partie',
      title: 'Pause'
    }
  },
  round: {
    answer: {
      correct: 'Tu l’as. Tranquille.',
      label: 'Ta réponse',
      missed: 'Pas celle-là.',
      retry: 'Autant d’essais que tu veux.',
      submit: 'Envoyer',
      waiting: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} a répondu', other: '{?} ont répondu' } }
      })
    },
    awardWithSpeed: '{answer:number} +{speed:number}',
    entryNumbered: '{name} {number:number}',
    finalStandings: 'Classement final',
    found: 'Trouvé : {found:number} sur {total:number}',
    index: 'Manche {index:number} sur {total:number}',
    indexOpen: 'Manche {index:number}',
    label: 'Manche',
    missed: 'Rien cette fois.',
    nobody: 'Personne n’a trouvé',
    othersScored: defineTranslation('{count:plural}', {
      plural: { count: { one: '+ {?} autre', other: '+ {?} autres' } }
    }),
    overallStandings: 'Classement général',
    scored: '+{points:number}',
    speedBonus: 'dont {points:number} pour la vitesse',
    speedRule:
      'Sur la montre, une réponse parfaite garde 90 points, et la donner tôt ajoute jusqu’à 10 de plus.',
    thisRound: 'Cette manche',
    unsent: 'Pas envoyé : pris tel quel sur ton écran.',
    unsentSeats: 'Pas envoyé, pris tel quel sur l’écran : {names}'
  },
  slate: {
    board: {
      close: 'Ramasser',
      closeItem: 'Ramasser {item} et le corriger maintenant',
      markItem: 'Corriger {item}',
      sheets: 'Les feuilles',
      show: 'Corriger',
      state: {
        closed: 'À corriger',
        marked: 'Corrigé',
        open: '{filled:number}/{count:number} écrits'
      }
    },
    correct: {
      blanks: 'Rien écrit : {names}',
      finish: 'Voir les scores',
      judge: 'Juste',
      key: {
        reveal: 'Dévoiler la réponse',
        title: 'La réponse'
      },
      next: 'Suivant',
      nobody: 'Personne n’a rien écrit pour celui-là.',
      previous: 'Précédent'
    },
    home: {
      description:
        'Des choses numérotées à deviner — des verres à goûter, des photos, des prix — et chacun écrit sur une feuille que personne ne voit, dans l’ordre qu’il veut. Puis l’hôte corrige les copies numéro par numéro, et chaque réponse qu’il accepte rapporte sa part des 100 points de la feuille.'
    },
    item: 'N° {index:number}',
    itemOf: 'N° {index:number} sur {count:number}',
    items: {
      add: 'Un de plus',
      label: 'Choses à deviner',
      summary: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} chose à deviner', other: '{?} choses à deviner' }
        }
      })
    },
    key: {
      field: 'Réponse pour {item}',
      hint: 'Gardé sur cet écran, et envoyé à l’ouverture des feuilles.',
      label: 'Corrigé',
      summary: defineTranslation('{count:plural}', {
        plural: {
          count: { one: 'Caché · {?} noté', other: 'Caché · {?} notés' }
        }
      })
    },
    labels: {
      duplicate: 'Une autre case affiche déjà ça.',
      hint: 'Laisse une case vide pour garder son numéro.',
      label: 'Noms des choses à deviner',
      none: 'Numérotées 1, 2, 3…',
      some: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} nommée', other: '{?} nommées' } }
      })
    },
    marking: {
      now: 'En correction'
    },
    name: 'L’Ardoise',
    play: 'Jouer à l’Ardoise',
    prepare: {
      keys: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} réponse notée', other: '{?} réponses notées' }
        }
      }),
      title: 'Préparer la feuille'
    },
    progress: '{filled:number}/{count:number}',
    scoring:
      'Chacun remplit sa feuille sans rien montrer, puis l’hôte corrige chaque réponse. La feuille vaut 100 points, partagés à parts égales entre ses numéros.',
    sheet: {
      blank: 'Rien écrit',
      closedBeforeYou: 'Ramassé avant ton arrivée',
      field: 'Ta réponse pour {item}',
      grid: 'Ta feuille',
      key: 'Réponse : {key}',
      next: 'Suivant',
      previous: 'Précédent',
      saved: 'Tu peux changer une réponse jusqu’à ce que l’hôte la ramasse.',
      tile: {
        empty: '{item}, vide',
        filled: '{item} : {answer}',
        locked: '{item}, ramassé'
      }
    },
    tagline: 'Chacun écrit. Personne ne copie.',
    verdict: {
      pending: 'L’hôte corrige…',
      right: 'Accepté',
      wrong: 'Pas cette fois'
    },
    wall: {
      allCollected: 'Tout est ramassé.',
      collect: 'Ramasser les feuilles',
      collectRest: 'Ramasser le reste',
      filling:
        'Les feuilles sont ouvertes. Écrivez ce que vous pensez de chacun.',
      toList: 'Revenir à la liste',
      toSheets: 'Revenir aux feuilles',
      toWall: 'Reprendre la correction'
    },
    yourAnswer: 'Tu as écrit',
    yourSheet: 'Toute ta feuille'
  },
  swatch: {
    answer: {
      hue: 'Teinte',
      label: 'Ta couleur',
      send: 'J’envoie ma couleur',
      sent: 'Ta couleur est partie. On attend les autres.',
      tone: 'Nuance et luminosité'
    },
    hidden: 'Disparue. Refais-la de mémoire.',
    home: {
      description:
        'Une couleur s’affiche sur tous les écrans — un bleu canard passé, un ocre chaud — quelques secondes, puis disparaît. Chacun la refait sur son écran, et le dévoilement pose chaque essai à côté de la vraie, la plus proche en premier. Pile dessus rapporte le plus, et de près, ça marque encore.'
    },
    name: 'Nuancier',
    play: 'Jouer au Nuancier',
    rebuildDuration: 'Temps pour la refaire',
    remember: 'Retiens cette couleur',
    reveal: {
      table: 'Les couleurs de la table',
      title: 'La couleur',
      yours: 'La tienne',
      yoursUnsent: 'La tienne, prise où était ton curseur'
    },
    scoring:
      'Une couleur s’affiche, disparaît, et tu la refais. Pile dessus, c’est 100 points, et ça descend jusqu’à rien plus tu t’en éloignes. Pas envoyée à temps, ta couleur compte là où est ton curseur. Pas de bonus de vitesse.',
    showDuration: 'Couleur affichée',
    tagline: 'Une couleur, quelques secondes. Refais-la.'
  },
  team: {
    aloud: {
      artist: 'Artiste',
      composer: 'Compositeur',
      confirm: 'Valider',
      film: 'Film',
      hadIt: 'Trouvé',
      label: 'Qui l’a trouvé ?',
      needsScreens: 'Demande un écran à chacun.',
      nobody: 'Personne n’a trouvé',
      title: 'Titre'
    },
    colour: {
      pawn1: 'Rouges',
      pawn2: 'Bleus',
      pawn3: 'Jaunes',
      pawn4: 'Verts',
      pawn5: 'Violets',
      pawn6: 'Orange',
      pawn7: 'Roses',
      pawn8: 'Turquoise',
      pawn9: 'Anis',
      pawn10: 'Marron',
      pawn11: 'Fuchsia',
      pawn12: 'Ciel'
    },
    count: 'Combien d’équipes',
    draw: 'Tirer les équipes',
    drawNeeds:
      'Il faut au moins {count:number} joueurs pour faire {count:number} équipes — ou choisis moins d’équipes.',
    duel: {
      title: '{first} contre {second}'
    },
    empty: 'Personne pour l’instant',
    final: {
      podium: 'Podium individuel',
      wins: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'victoire avec {?} point',
            other: 'victoire avec {?} points'
          }
        }
      }),
      winsOnCase: 'victoire case {case:number}'
    },
    join: 'Rejoindre',
    move: {
      label: 'Mettre {nickname} dans une autre équipe',
      short: 'Équipe',
      to: 'Chez les {team}'
    },
    needsSeats:
      'Les équipes se forment à partir de {count:number} joueurs — d’ici là, chacun joue pour soi.',
    pick: 'Choisis ton équipe',
    recolour: {
      action: 'Couleur des {team}',
      label: 'Couleur du pion'
    },
    redraw: 'Nouveau tirage',
    rename: {
      action: 'Renommer les {team}',
      label: 'Nom de l’équipe',
      submit: 'Renommer'
    },
    scoring: {
      balanced: 'Équilibré',
      balancedHint:
        'Chaque équipe marque sa moyenne par joueur : une grande équipe ne gagne pas juste par le nombre.',
      label: 'Score des équipes',
      sum: 'Additionné',
      sumHint: 'Chaque équipe marque tous les points de ses joueurs.'
    },
    setting: {
      aloud: 'À voix haute',
      aloudHint:
        'Personne ne rejoint : le mur pose la question, les équipes crient, tu touches celles qui ont trouvé.',
      aloudNeedsNoPhone:
        'Pour jouer à voix haute, personne ne doit avoir rejoint : demande à chacun de quitter d’abord.',
      chosen: 'Au choix',
      drawn: 'Tirées au sort',
      label: 'Équipes',
      off: 'Chacun pour soi'
    },
    summary: {
      aloud: '{count:number} équipes à voix haute',
      chosen: '{count:number} équipes au choix',
      drawn: '{count:number} équipes tirées au sort',
      off: 'Sans équipes'
    },
    title: 'Les équipes',
    unassigned: {
      chosen: 'Pas encore d’équipe',
      drawn: 'En attente du tirage'
    },
    yours: 'Ton équipe'
  },
  timeline: {
    answer: {
      earliest: 'Le plus ancien',
      hint: 'Fais glisser une carte, ou passe par ses flèches. 1, c’est le plus ancien.',
      label: 'Ton ordre, du plus ancien au plus récent',
      latest: 'Le plus récent',
      moveDown: 'Faire descendre « {event} »',
      moveUp: 'Faire remonter « {event} »',
      send: 'J’envoie mon ordre',
      sent: 'Ton ordre est parti. On attend les autres.'
    },
    dealt:
      'Lequel d’abord ? Remettez-les dans l’ordre, du plus ancien au plus récent.',
    duration: 'Temps par manche',
    home: {
      description:
        'Cinq événements tombent d’un coup — les premiers pas sur la Lune, la chute du mur de Berlin, le premier iPhone, une finale de Coupe du monde. Chacun les remet dans l’ordre, du plus ancien au plus récent, et les années tombent au dévoilement. Tout juste rapporte le plus, et une paire inversée marque encore.'
    },
    name: 'Frise chronologique',
    play: 'Jouer à la Frise chronologique',
    reveal: {
      perfect: 'Dans l’ordre',
      swapped: defineTranslation('{pairs:plural}', {
        plural: {
          pairs: { one: '{?} paire inversée', other: '{?} paires inversées' }
        }
      }),
      title: 'L’ordre :',
      unsent: 'L’ordre',
      yours: 'Ton ordre'
    },
    scoring:
      'Cinq événements à remettre dans l’ordre, du plus ancien au plus récent. Tout juste vaut 100 points, une paire inversée 67, deux paires 33.',
    tagline: 'Cinq événements. Lequel d’abord ?'
  },
  wall: {
    arriving: 'La table arrive…',
    hostAway: {
      takeOver: 'Tenir la table d’ici',
      title: 'L’hôte a décroché. La partie attend son retour.'
    },
    menu: {
      description:
        'Ouvre la table sur un autre écran, puis tape le code qu’il affiche.',
      failed: 'Ce code n’affiche rien. L’écran en montre peut-être un nouveau.',
      handOver: {
        hint: 'Scanne-le depuis l’écran qui tiendra la table. Il donne la table à qui l’ouvre : garde-le pour toi.',
        label: 'Tenir la table depuis un autre écran',
        summary: 'Cet écran devient alors celui de la salle.'
      },
      label: 'Code de l’écran',
      openHere: 'Afficher la partie dans un nouvel onglet',
      pair: 'Y afficher la table',
      paired: 'Code accepté : la table arrive sur cet écran…'
    },
    number: 'Écran {number:number}',
    numberSpeaking: 'Écran {number:number}, qui joue le son',
    pair: {
      backToTable: 'Retour à ma table',
      description:
        'L’écran qui affiche {code} montrera ta table, sans les réponses et sans rien à presser.',
      documentTitle: 'Afficher une table — Mêlée',
      done: 'Ta table est sur cet écran.',
      failed:
        'Ça n’est pas passé. Le code a peut-être expiré — l’écran en affiche un nouveau.',
      nothingHeld: {
        description:
          'Seul l’écran qui tient une table peut l’afficher ailleurs. Scanne le carré depuis celui-là.',
        title: 'Aucune table à afficher'
      },
      show: 'Afficher la table {room}',
      title: 'Afficher ta table sur cet écran-là ?'
    },
    pairAgain: 'Appairer cet écran',
    pairing: {
      caption: 'Scanne depuis l’écran qui tient la table',
      codeCaption: 'Ou tape ce code dans son menu',
      documentTitle: 'En attente d’une table — Mêlée',
      failed: 'On n’arrive pas à joindre Mêlée pour avoir un code.',
      retry: 'Réessayer',
      title: 'Cet écran attend sa table'
    },
    sound: 'Mettre le son'
  }
})
