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
  atlas: {
    answer: {
      cancel: 'Annuler',
      confirm: 'Je le pose ici',
      sent: 'Ton pion est posé. On attend les autres.'
    },
    asks: {
      name: 'Nommer {places}',
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
      name: 'Nommer ce qui est montré',
      place: 'Placer ce qui est nommé'
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
    scoring:
      'Tout le monde pose son pion en même temps. Dans le pays, ça rapporte 30 points, à moins de 500 km de sa frontière 20, à moins de 1 500 km 10 — et plus tu le poses tôt, plus la montre ajoute, jusqu’au double.',
    scoringCapitals:
      'Tout le monde pose son pion en même temps. À moins de 100 km de la capitale, ça rapporte 30 points, à moins de 300 km 20, à moins de 1 000 km 10 — et plus tu le poses tôt, plus la montre ajoute, jusqu’au double.',
    scoringCities:
      'Tout le monde pose son pion en même temps, sur la carte de France. À moins de 25 km de la ville, ça rapporte 30 points, à moins de 75 km 20, à moins de 150 km 10 — et plus tu le poses tôt, plus la montre ajoute, jusqu’au double.',
    scoringMixed:
      'Tout le monde pose son pion en même temps — un pays, une capitale ou une ville de France, selon la manche. Plus ton pion est près, plus il rapporte, jusqu’à 30 points, et plus tu le poses tôt, plus la montre ajoute, jusqu’au double.',
    scoringName: {
      choice:
        'La carte montre un lieu et propose quatre noms, à tout le monde en même temps. Le bon rapporte 10 points, et plus tu le trouves tôt, plus la montre ajoute — jusqu’au double.',
      typed:
        'La carte montre un lieu et chacun tape son nom en même temps. Le bon nom rapporte 30 points, et plus tu le trouves tôt, plus la montre ajoute — jusqu’au double.'
    },
    tagline: 'Un lieu. Pose ton pion dessus, ou nomme-le.'
  },
  blacksquare: {
    answer: {
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
        'Un thème tombe — les films de Quentin Tarantino, les pays qui bordent la France — et jusqu’à neuf réponses se cachent derrière, les moins évidentes rapportant le plus. Chacun tire ses réponses depuis son écran, autant qu’il veut. Caché parmi elles, un mot noir : une réponse qui sonne juste et ne l’est pas, et qui tombe dessus perd sa manche.'
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
      'Jusqu’à neuf réponses sont cachées : le tiers le plus connu rapporte 10 points, le suivant 20, le dernier 30. Tombe sur le mot noir et ta manche ne vaut plus rien.',
    scoringLoneFinds:
      'Jusqu’à neuf réponses sont cachées : le tiers le plus connu rapporte 10 points, le suivant 20, le dernier 30, et le double si personne d’autre ne la trouve. Tombe sur le mot noir et ta manche ne vaut plus rien.',
    scoringSpoken:
      'Une équipe dit ses réponses à voix haute et quelqu’un d’une autre équipe les coche : le tiers le plus connu rapporte 10 points, le suivant 20, le dernier 30. Le mot noir prononcé, la manche de l’équipe ne vaut plus rien.',
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
    difficulty: {
      label: 'À quel point c’est connu',
      mixed: 'Un peu pointu',
      obscure: 'Pour les experts',
      pinnedByFilms:
        'Les musiques de films fixent leur propre niveau — rien ici n’est un tube du top.',
      wellKnown: 'Grand public'
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
        'Le premier qui buzze répond à voix haute. L’hôte juge le titre et l’artiste, 10 points chacun — une mauvaise réponse te met hors-jeu pour le reste de la manche.',
      choice:
        'Quatre propositions sur le même extrait, et tout le monde répond. La bonne rapporte 10 points, et plus tu la trouves tôt, plus la montre ajoute — jusqu’au double.',
      typed:
        'Tout le monde tape, sur le même extrait. Titre et artiste rapportent 10 points chacun, les deux ensemble 30, et plus tu trouves tôt, plus la montre ajoute — jusqu’au double.'
    },
    scoringFilm: {
      buzzer:
        'Le premier qui buzze répond à voix haute. L’hôte juge le film et le compositeur, 10 points chacun — une mauvaise réponse te met hors-jeu pour le reste de la manche.',
      typed:
        'Tout le monde tape, sur le même extrait. Film et compositeur rapportent 10 points chacun, les deux ensemble 30, et plus tu trouves tôt, plus la montre ajoute — jusqu’au double.'
    },
    source: {
      all: 'Toutes les sources',
      chart: 'Le top du moment',
      decade: 'Une décennie',
      film: 'Musiques de films',
      filmHint:
        'Ce qu’un compositeur a écrit pour un film ou une série — pas les chansons de la bande originale.',
      label: 'D’où viennent les titres',
      none: 'N’en choisis aucune et tu as tout, mélangé : le top, toutes les décennies et les musiques de films.',
      noneInDecade:
        'Rien de jouable dans ces années-là. Essaie une autre décennie.',
      noneInFilms:
        'Rien de jouable n’est revenu des compositeurs. Essaie une autre source.',
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
      search: 'Une recherche'
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
    none: 'Sans plateau',
    recentre: 'Recentrer',
    setting: {
      catchUp: {
        hint: 'Seul à la dernière place, on avance d’une case de plus sur une manche où l’on marque.',
        label: 'Coup de pouce au dernier'
      },
      hint: {
        off: 'Des pions sur un parcours, autour de l’écran de la salle.',
        seats: 'Un pion par joueur, qui avance à chaque manche.',
        teams: 'Un pion par équipe, qui avance à chaque manche.'
      },
      label: 'Plateau',
      length: '{length:number} cases',
      lengthLabel: 'Longueur',
      strategy: {
        hint: {
          onePointOneCase:
            'Une case par tranche de 10 points gagnés dans la manche.',
          rank: 'Le premier de la manche avance de 3 cases, le deuxième de 2, le troisième de 1.'
        },
        label: 'Les pions avancent',
        onePointOneCase: 'Aux points',
        rank: 'Au classement'
      }
    },
    standing: '{team} : case {case:number} sur {length:number}',
    start: 'Départ',
    summary: 'plateau de {length:number} cases',
    walked: '+{count:number}'
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
      'Le plus rapide répond à voix haute, et l’hôte dit si c’est bon. 10 points si c’est juste — et une mauvaise réponse te met hors-jeu jusqu’à ce qu’il te remette en jeu.',
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
      'Ça se joue à table. L’hôte classe les trois premiers : 30 points au premier, 20 au deuxième, 10 au troisième — une égalité partage la place.',
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
    flagIcons:
      'Chaque drapeau est dessiné tel qu’il est livré, renommé d’après son propre dessin plutôt que son pays, et le code du pays écrit dans chaque fichier a été remplacé, pour que le fichier envoyé à un écran ne dise rien de la réponse. Sept drapeaux dessinés exactement comme celui d’un autre pays ont été écartés.',
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
    music_source_unavailable:
      'La musique ne répond plus. Réessaie dans un instant.',
    nickname_taken: 'Ce pseudo est déjà pris.',
    no_content_available: 'Il ne reste rien à jouer. Change les réglages.',
    no_game_chosen: 'Choisis d’abord un jeu.',
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
    wrong_phase: 'Trop tard, la partie est passée à autre chose.'
  },
  estimate: {
    answer: {
      label: 'Ton estimation',
      send: 'Envoyer',
      sent: 'Estimation envoyée. On attend les autres.'
    },
    asks: {
      area: { country: 'Quelle superficie ?' },
      elevation: { mountain: 'Quelle altitude ?' },
      height: { building: 'Quelle hauteur ?' },
      length: { river: 'Quelle longueur ?' },
      population: {
        city: 'Combien d’habitants ?',
        country: 'Combien d’habitants ?'
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
      'Une question dont la réponse est un nombre, et chacun tape son estimation. Les trois plus proches marquent 30, 20 et 10 points ; à dix fois la réponse ou plus, rien. Pas de bonus de vitesse.',
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
  higherlower: {
    answer: {
      counter: 'Paire {index:number} sur {count:number}',
      sent: 'Ton choix est parti. On attend les autres.'
    },
    asks: {
      area: { country: 'Le plus vaste ?' },
      elevation: { mountain: 'Le plus haut ?' },
      height: { building: 'Le plus haut ?' },
      length: { river: 'Le plus long ?' },
      population: {
        city: 'Le plus d’habitants ?',
        country: 'Le plus d’habitants ?'
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
      'Deux choses du même genre — deux villes, deux fleuves, deux sommets — et tu choisis la plus grande. Un bon choix rapporte 10 points, plus un bonus si tu choisis vite.',
    tagline: 'Deux noms. Lequel est le plus grand ?'
  },
  home: {
    opening: 'Ouverture de la table…',
    resume: 'Reprendre la table',
    shelf: 'Les jeux',
    shelfHint: 'Un appui ouvre une table sur ce jeu.',
    title: 'Mêlée'
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
      move: 'On déplace l’allumette',
      number: 'On tape un nombre',
      order: 'Dans l’ordre',
      pairs: 'On choisit le plus grand',
      point: 'On pointe sur la carte',
      spoken: 'Équipe par équipe',
      typed: 'On tape',
      vote: 'On vote pour quelqu’un'
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
        raise: 'Passer à {count:number}'
      },
      detail: {
        allSubjects: 'Tous les sujets',
        oneGo: 'Un essai chacun',
        subjects: '{count:number} sujets'
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
      wins: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'gagne avec {?} point',
            other: 'gagne avec {?} points'
          }
        }
      })
    },
    game: {
      label: 'À quoi on joue',
      prompt:
        'Touche un jeu pour le prévoir. Tu pourras en ajouter d’autres pour les enchaîner.'
    },
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
      close: 'Fermer les réglages',
      empty:
        'Personne pour l’instant. Lis {code} à voix haute, ou montre le QR de l’écran de la salle.',
      more: '+{count:number}',
      pointsHint:
        '– et + : {points:number} points d’un coup, pour une réponse que le jeu n’a pas vue.',
      roster: 'Joueurs',
      settings: 'Réglages',
      tied: 'à égalité'
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
          count: { one: '{?} gardée', other: '{?} gardées' }
        }
      }),
      doorEmpty: 'Garde celle-ci pour la relancer une autre fois',
      empty:
        'Aucune partie gardée pour l’instant. Donne un nom à celle-ci pour la relancer une autre fois.',
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
        'Une partie est déjà gardée sous ce nom : celle-ci prend sa place.',
      rounds: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} manche', other: '{?} manches' } }
      }),
      run: 'Lancer {name}',
      save: 'La garder',
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
      rules: {
        points: defineTranslation(
          '{rounds:plural}\u00a0: l’équipe qui marque le plus gagne.',
          { plural: { rounds: { one: '{?} manche', other: '{?} manches' } } }
        ),
        pointsOpen: 'L’équipe qui marque le plus gagne.',
        seatTrack: defineTranslation(
          '{rounds:plural}, {length:number} cases\u00a0: le premier à l’arrivée gagne.',
          { plural: { rounds: { one: '{?} manche', other: '{?} manches' } } }
        ),
        seatTrackOpen:
          '{length:number} cases\u00a0: le premier à l’arrivée gagne.',
        track: defineTranslation(
          '{rounds:plural}, {length:number} cases\u00a0: la première équipe à l’arrivée gagne.',
          { plural: { rounds: { one: '{?} manche', other: '{?} manches' } } }
        ),
        trackOpen:
          '{length:number} cases\u00a0: la première équipe à l’arrivée gagne.'
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
      'Compte dans ta tête et appuie une fois. 30 points pile à l’heure, rien à un quart du compte d’écart — plus c’est près, plus ça paie.',
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
      savedEvenings:
        'Les parties que tu as enregistrées sous un nom, chaque jeu avec ses réglages, pour les relancer.',
      seats:
        'La place que tu occupes à chaque table rejointe, pour qu’un rechargement ou un écran verrouillé t’y ramène avec ton score. Oubliée au bout d’un jour.',
      server:
        'Tant qu’une table est jouée, les serveurs de Cloudflare la gardent : les pseudos autour, les réponses données, les scores et les réglages. Elle est supprimée quand l’hôte ferme la table, ou une heure après que le dernier écran l’a quittée. Il n’y a pas de compte, et rien de ce qui te concerne ne survit à la table.',
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
        'Une égalité fausse dessinée en allumettes — ou un nombre à rendre le plus grand, ou le plus petit, possible. Chacun prend une allumette sur son écran et la pose ailleurs : la bonne réponse rapporte le plus, les nombres suivants un peu moins, et le chrono s’y ajoute. Ou à voix haute : le premier à buzzer dit quelle allumette bouge et où, et l’hôte tranche. Chaque énigme est tirée à neuf, la partie ne s’épuise jamais, et toutes ont une réponse.'
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
      'Une allumette à déplacer. Le premier à buzzer dit son coup à voix haute, et l’hôte tranche — 10 points s’il a raison.',
    scoringMove:
      'Une allumette à déplacer, tout le monde en même temps. La bonne réponse vaut 30 points — sur un nombre, la suivante 20 et la troisième 10 — et le chrono s’y ajoute.',
    tagline: 'Une allumette bouge. Trouve laquelle.'
  },
  menu: {
    build: 'Version {build}',
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
    points: {
      give: '{points:number} points de plus pour {name}',
      label: 'Points',
      take: '{points:number} points de moins pour {name}',
      teams: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} équipe', other: '{?} équipes' } }
      })
    },
    thisDevice: {
      qrCode: {
        action: 'Afficher',
        description: 'Pour un écran à l’entrée, sans rejoindre la partie.',
        label: 'Afficher le QR code d’une table'
      },
      title: 'Cet appareil',
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
      'Une phrase sur l’un de vous s’affiche et chacun vote pour quelqu’un, soi-même compris. Vote comme la table et tu marques 10 points. Pas de bonus de vitesse.',
    tagline: 'Une phrase, l’un de vous. C’est qui ?'
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
      famousPerson: 'Personnalité',
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
      'Une lettre, un mot par catégorie. La table vote sur chaque réponse : celle que personne d’autre n’a écrite rapporte 20 points, une réponse partagée 10.',
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
      ofRoom: defineTranslation('{rank:plural} sur {count:number}', {
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
    adult: {
      label: 'Inclure les questions pour adultes'
    },
    category: {
      arts: 'Arts et culture',
      capitals: 'Capitales',
      cinema: 'Cinéma',
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
        'Le premier qui buzze répond à voix haute, et l’hôte dit si c’est bon. 10 points si c’est juste — et une mauvaise réponse te met hors-jeu pour le reste de la manche.',
      choice:
        'Quatre propositions, et tout le monde répond en même temps. La bonne rapporte 10 points, et plus tu la trouves tôt, plus la montre ajoute — jusqu’au double.',
      typed:
        'Tout le monde tape sa réponse en même temps. La bonne rapporte 30 points, et plus tu la trouves tôt, plus la montre ajoute — jusqu’au double.'
    },
    silhouette: {
      alt: 'La forme du pays à reconnaître'
    },
    tagline: 'Une question, et le premier qui sait.',
    variant: {
      wellKnown: 'Grand public'
    },
    wellKnown: {
      hint: 'Il y en a moins à tirer, mais personne ne sèche.',
      label: 'Rester grand public'
    }
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
        'Rien à savoir, rien à dire. L’écran reste immobile, puis il change — et le plus rapide rafle la manche. Pars avant qu’il change et celle-là, tu la regardes depuis le banc.'
    },
    landed: defineTranslation('{count:plural}', {
      plural: {
        count: { one: '{?} joueur a appuyé', other: '{?} joueurs ont appuyé' }
      }
    }),
    name: 'Réflexe',
    nobody: 'Personne n’a bougé',
    play: 'Jouer à Réflexe',
    pressed: 'C’est pris.',
    reaction: '{milliseconds:number} ms',
    scoring:
      'L’écran change, et le plus rapide prend les 10 points. Pars avant qu’il change et tu passes la manche sur le banc.',
    tagline: 'L’écran change. Le plus rapide gagne.',
    tooEarly: 'parti trop tôt',
    waiting: 'Guette l’écran.'
  },
  room: {
    documentTitle: '{game} — Mêlée',
    documentTitleLobby: 'Mêlée'
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
    award: '{points:number}',
    awardWithSpeed: '{answer:number} +{speed:number}',
    entryNumbered: '{name} {number:number}',
    index: 'Manche {index:number} sur {total:number}',
    indexOpen: 'Manche {index:number}',
    label: 'Manche',
    missed: 'Rien cette fois.',
    nobody: 'Personne n’a trouvé',
    scored: '+{points:number}',
    speedBonus: 'dont {points:number} pour la vitesse',
    speedHalf: '+{points:number}'
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
        'Des choses numérotées à deviner — des verres à goûter, des photos, des prix — et chacun écrit sur une feuille que personne ne voit, dans l’ordre qu’il veut. Puis l’hôte corrige les copies numéro par numéro, et chaque réponse qu’il accepte vaut 10 points.'
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
      'Chacun remplit sa feuille sans rien montrer, puis l’hôte corrige : 10 points par réponse qu’il accepte.',
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
      title: 'La couleur',
      yours: 'La tienne'
    },
    scoring:
      'Une couleur s’affiche, disparaît, et tu la refais. Pile dessus, c’est 30 points, et ça descend jusqu’à rien plus tu t’en éloignes. Pas de bonus de vitesse.',
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
      pawn8: 'Turquoise'
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
      })
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
      'Cinq événements à remettre dans l’ordre, du plus ancien au plus récent. Tout juste vaut 30 points, une paire inversée 20, deux paires 10 — et le chrono s’y ajoute.',
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
