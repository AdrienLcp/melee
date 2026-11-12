import type { CountryCode } from '@melee/protocol/country-code'

import { bankedCapitals } from '../src/infrastructure/questions/capital-bank'
import type { TemplateName, Wording } from './black-square-templates'

export type ThemeSpec = {
  /** The candidate to bank as the black word, over the most read one. */
  blackWord?: string
  /** The states a capitals template lists, by code. */
  countries?: readonly CountryCode[]
  /** Candidates read and refused, each one a true answer Wikidata missed or a word too weak to bite. */
  excluded?: string[]
  /** The theme's wording, where the template's would not read right. */
  labels?: Wording
  /** The second entity a template reads beside the subject. */
  neighbour?: string
  /** Truths counted as one thing where no series or title joins them: a version of a painting filed apart from its series. */
  sameThing?: readonly (readonly string[])[]
  subject: string
  template: TemplateName
  /**
   * Why the black word is wrong, one line for the reveal. Written by hand once
   * the word has been read against the whole list: a theme without one is not
   * banked.
   */
  why?: Wording
}

/** A seat is a capital a table may give and be right, so it banks the capital's cell. */
const seatNamesByCapital = (): Record<string, readonly string[]> =>
  Object.fromEntries(
    bankedCapitals()
      .filter(({ seats }) => seats.length > 0)
      .map(({ capital, seats }) => [
        capital.id,
        [...new Set(seats.flatMap(({ names }) => [names.en, names.fr]))]
      ])
  )

/**
 * Series and franchises that hold a subject's whole output, a period or a
 * list rather than one story told again — every Marvel Studios film is in the
 * Marvel Cinematic Universe, every Balzac novel in *La Comédie humaine* — so
 * sharing one says nothing about being a sequel. Read off the series the
 * banked truths share most.
 */
export const UMBRELLA_SERIES: ReadonlySet<string> = new Set([
  'Q3048935', // Voyages extraordinaires
  'Q6027', // Les Rougon-Macquart
  'Q122441953', // Hercule Poirot
  'Q132133414', // Miss Marple
  'Q592139', // Les Travaux d'Hercule
  'Q26705935', // BBC's 100 Greatest Films of the 21st Century
  'Q26196748', // DreamWorks Animation feature films
  'Q56070713', // Walt Disney Animation Studios feature films
  'Q906232', // Disney films from 1989 to 1995
  'Q2732470', // Pixar films
  'Q642878', // Marvel Cinematic Universe
  'Q63405798', // The Infinity Saga
  'Q113292798', // The Multiverse Saga
  'Q51963292', // MCU Phase One
  'Q51963356', // MCU Phase Two
  'Q51963836', // MCU Phase Three
  'Q62604229', // MCU Phase Four
  'Q104643359', // MCU Phase Five
  'Q113281347', // MCU Phase Six
  'Q5168586' // Van Gogh's copies after other painters
])

/** The name a screen shows where Wikidata's own label is not the one a table says, keyed by entity. */
export const SHOWN_LABELS: Readonly<Record<string, Wording>> = {}

/** Names a table says that Wikidata does not hold, keyed by entity. */
export const SPOKEN_ALIASES: Readonly<Record<string, readonly string[]>> = {
  ...seatNamesByCapital(),
  Q7156: ['Barça', 'Barcelona'],
  Q8682: ['Real'],
  Q192071: ['Nantes'],
  Q483020: ['PSG', 'Paris Saint-Germain', 'Paris SG']
}

/** The states of an M49 region or intermediate region, as the capital bank files them. */
const countriesIn = (m49: string): CountryCode[] =>
  bankedCapitals()
    .filter(({ region, subregion }) => region === m49 || subregion === m49)
    .map(({ code }) => code)

export const BLACK_SQUARE_THEMES: readonly ThemeSpec[] = [
  {
    blackWord: 'Q196004',
    subject: 'Q3772',
    template: 'films-directed-by',
    why: {
      en: 'Written by Tarantino, directed by Robert Rodriguez',
      fr: 'Écrit par Tarantino, réalisé par Robert Rodriguez'
    }
  },
  {
    blackWord: 'Q91540',
    subject: 'Q8877',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Spielberg, directed by Robert Zemeckis',
      fr: 'Produit par Spielberg, réalisé par Robert Zemeckis'
    }
  },
  {
    blackWord: 'Q221113',
    subject: 'Q2001',
    template: 'films-directed-by',
    why: {
      en: 'Developed by Kubrick, directed by Spielberg after his death',
      fr: 'Développé par Kubrick, réalisé par Spielberg après sa mort'
    }
  },
  {
    blackWord: 'Q739046',
    subject: 'Q7374',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Henri-Georges Clouzot',
      fr: 'Réalisé par Henri-Georges Clouzot'
    }
  },
  {
    blackWord: 'Q47075',
    subject: 'Q41148',
    template: 'films-directed-by',
    why: { en: 'Directed by Brian De Palma', fr: 'Réalisé par Brian De Palma' }
  },
  {
    blackWord: 'Q622769',
    subject: 'Q25191',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Nolan, directed by Zack Snyder',
      fr: 'Produit par Nolan, réalisé par Zack Snyder'
    }
  },
  {
    blackWord: 'Q21500755',
    subject: 'Q56005',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Ridley Scott, directed by Denis Villeneuve',
      fr: 'Produit par Ridley Scott, réalisé par Denis Villeneuve'
    }
  },
  {
    blackWord: 'Q322328',
    subject: 'Q56008',
    template: 'films-directed-by',
    why: {
      en: 'Imagined and produced by Burton, directed by Henry Selick',
      fr: 'Imaginé et produit par Burton, réalisé par Henry Selick'
    }
  },
  {
    blackWord: 'Q41483',
    subject: 'Q43203',
    template: 'films-directed-by',
    why: {
      en: 'Eastwood stars, Sergio Leone directs',
      fr: 'Eastwood y joue, Sergio Leone le réalise'
    }
  },
  {
    blackWord: 'Q726215',
    subject: 'Q484779',
    template: 'films-directed-by',
    why: {
      en: 'Written and produced by Besson, directed by Gérard Pirès',
      fr: 'Écrit et produit par Besson, réalisé par Gérard Pirès'
    }
  },
  {
    blackWord: 'Q133654',
    subject: 'Q184903',
    template: 'films-directed-by',
    why: { en: 'Directed by Jonathan Demme', fr: 'Réalisé par Jonathan Demme' }
  },
  {
    blackWord: 'Q241958',
    subject: 'Q187364',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Joe Dante, produced by Spielberg',
      fr: 'Réalisé par Joe Dante, produit par Spielberg'
    }
  },
  {
    blackWord: 'Q15068238',
    subject: 'Q192990',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Matthew Vaughn, producer of Ritchie’s first films',
      fr: 'Réalisé par Matthew Vaughn, producteur des premiers Ritchie'
    }
  },
  {
    blackWord: 'Q184843',
    subject: 'Q548823',
    template: 'films-directed-by',
    why: {
      en: 'Ridley Scott’s original; Villeneuve directed the 2049 sequel',
      fr: 'L’original de Ridley Scott ; Villeneuve a réalisé la suite, 2049'
    }
  },
  {
    blackWord: 'Q117464',
    subject: 'Q470798',
    template: 'films-directed-by',
    why: {
      en: 'De Funès stars, Jean Girault directs',
      fr: 'Avec de Funès, mais réalisé par Jean Girault'
    }
  },
  {
    blackWord: 'Q778696',
    subject: 'Q358356',
    template: 'films-directed-by',
    why: {
      en: 'Co-written by Veber, directed by Édouard Molinaro',
      fr: 'Coécrit par Veber, réalisé par Édouard Molinaro'
    }
  },
  {
    blackWord: 'Q105387',
    subject: 'Q59259',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Roland Emmerich',
      fr: 'Réalisé par Roland Emmerich'
    }
  },
  {
    blackWord: 'Q208344',
    subject: 'Q60100',
    template: 'films-directed-by',
    why: { en: 'Directed by Michael Bay', fr: 'Réalisé par Michael Bay' }
  },
  {
    blackWord: 'Q483815',
    labels: { en: 'Pixar films', fr: 'Les films Pixar' },
    neighbour: 'Q191224',
    subject: 'Q127552',
    template: 'films-of-studio',
    why: {
      en: 'A DreamWorks Animation film',
      fr: 'Un film DreamWorks Animation'
    }
  },
  {
    blackWord: 'Q305250',
    labels: {
      en: 'DreamWorks Animation films',
      fr: 'Les films DreamWorks Animation'
    },
    subject: 'Q500088',
    template: 'films-of-studio',
    why: { en: 'Made by Blue Sky Studios', fr: 'Un film des studios Blue Sky' }
  },
  {
    blackWord: 'Q486609',
    labels: {
      en: 'Walt Disney Animation Studios films',
      fr: 'Les films de Walt Disney Animation Studios'
    },
    subject: 'Q1047410',
    template: 'films-of-studio',
    why: {
      en: 'Made by Don Bluth for 20th Century Fox',
      fr: 'Réalisé par Don Bluth pour la 20th Century Fox'
    }
  },
  {
    blackWord: 'Q19347291',
    labels: { en: 'Marvel Studios films', fr: 'Les films Marvel Studios' },
    subject: 'Q367466',
    template: 'films-of-studio',
    why: {
      en: 'Made by 20th Century Fox; only Deadpool & Wolverine is Marvel Studios',
      fr: 'Produit par la 20th Century Fox ; seul Deadpool & Wolverine est un Marvel Studios'
    }
  },
  {
    blackWord: 'Q333266',
    labels: { en: 'Albums by the Beatles', fr: 'Les albums des Beatles' },
    subject: 'Q1299',
    template: 'albums-by-band',
    why: { en: 'John Lennon’s solo album', fr: 'Un album solo de John Lennon' }
  },
  {
    blackWord: 'Q145',
    labels: {
      en: 'Member states of the European Union',
      fr: 'Les États membres de l’Union européenne'
    },
    subject: 'Q458',
    template: 'members-of',
    why: {
      en: 'Left the European Union in 2020',
      fr: 'A quitté l’Union européenne en 2020'
    }
  },
  {
    blackWord: 'Q29',
    labels: { en: 'Members of the G20', fr: 'Les pays membres du G20' },
    subject: 'Q19771',
    template: 'members-of',
    why: {
      en: 'A permanent guest, not a member',
      fr: 'Invitée permanente, pas membre'
    }
  },
  {
    blackWord: 'Q262',
    subject: 'Q150',
    template: 'countries-speaking',
    why: {
      en: 'Widely spoken, but only Arabic and Tamazight are official',
      fr: 'Très parlé, mais seuls l’arabe et le tamazight sont officiels'
    }
  },
  {
    blackWord: 'Q36301',
    labels: {
      en: 'Winners of the Academy Award for Best Actress',
      fr: "Les lauréates de l'Oscar de la meilleure actrice"
    },
    subject: 'Q103618',
    template: 'award-winners',
    why: {
      en: 'Won best supporting actress, never best actress',
      fr: 'Oscar du second rôle, jamais de la meilleure actrice'
    }
  },
  {
    blackWord: 'Q45901',
    labels: { en: "Ballon d'Or winners", fr: "Les lauréats du Ballon d'or" },
    subject: 'Q166177',
    template: 'award-winners',
    why: {
      en: 'Runner-up in 2003, never won',
      fr: 'Deuxième en 2003, jamais lauréat'
    }
  },
  {
    blackWord: 'Q8701',
    labels: {
      en: 'UEFA Champions League winners',
      fr: 'Les vainqueurs de la Ligue des champions'
    },
    neighbour: 'Q18760',
    subject: 'Q18756',
    template: 'competition-winners',
    why: {
      en: 'Three finals, three defeats',
      fr: 'Trois finales, trois défaites'
    }
  },
  {
    blackWord: 'Q19509',
    labels: {
      en: 'French football champions',
      fr: 'Les clubs champions de France de football'
    },
    neighbour: 'Q193121',
    subject: 'Q13394',
    template: 'competition-winners',
    why: { en: 'Never champion of France', fr: 'Jamais champion de France' }
  },
  {
    blackWord: 'Q12959',
    labels: {
      en: 'Presidents of the French Republic',
      fr: 'Les présidents de la République française'
    },
    neighbour: 'Q1587677',
    subject: 'Q191954',
    template: 'position-holders',
    why: {
      en: 'Prime minister, beaten in the 1995 election',
      fr: 'Premier ministre, battu à la présidentielle de 1995'
    }
  },
  {
    blackWord: 'Q34969',
    labels: {
      en: 'Presidents of the United States',
      fr: 'Les présidents des États-Unis'
    },
    neighbour: 'Q11699',
    subject: 'Q11696',
    template: 'position-holders',
    why: {
      en: 'A Founding Father, never president',
      fr: 'Père fondateur, jamais président'
    }
  },
  {
    blackWord: 'Q191838',
    labels: { en: 'Works by Victor Hugo', fr: 'Les œuvres de Victor Hugo' },
    subject: 'Q535',
    template: 'books-by-author',
    why: { en: 'A novel by Alexandre Dumas', fr: "Un roman d'Alexandre Dumas" }
  },
  {
    blackWord: 'Q339761',
    labels: { en: 'Books by Émile Zola', fr: "Les livres d'Émile Zola" },
    subject: 'Q504',
    template: 'books-by-author',
    why: {
      en: 'A novel by Guy de Maupassant',
      fr: 'Un roman de Guy de Maupassant'
    }
  },
  {
    blackWord: 'Q627333',
    subject: 'Q33977',
    template: 'books-by-author',
    why: { en: 'A novel by H. G. Wells', fr: 'Un roman de H. G. Wells' }
  },
  {
    blackWord: 'Q45192',
    labels: {
      en: 'Books by Agatha Christie',
      fr: "Les livres d'Agatha Christie"
    },
    subject: 'Q35064',
    template: 'books-by-author',
    why: {
      en: 'A novel by Arthur Conan Doyle',
      fr: "Un roman d'Arthur Conan Doyle"
    }
  },
  {
    blackWord: 'Q1193210',
    subject: 'Q39829',
    template: 'books-by-author',
    why: {
      en: 'A novel by William Peter Blatty',
      fr: 'Un roman de William Peter Blatty'
    }
  },
  {
    blackWord: 'Q1048916',
    labels: {
      en: 'Books by Alexandre Dumas',
      fr: "Les livres d'Alexandre Dumas"
    },
    subject: 'Q38337',
    template: 'books-by-author',
    why: { en: 'A play by Edmond Rostand', fr: "Une pièce d'Edmond Rostand" }
  },
  {
    blackWord: 'Q485093',
    subject: 'Q892',
    template: 'books-by-author',
    why: {
      en: 'A novel by C. S. Lewis, his friend',
      fr: 'Un roman de C. S. Lewis, son ami'
    }
  },
  {
    blackWord: 'Q471379',
    subject: 'Q5582',
    template: 'paintings-by',
    why: { en: 'A painting by Edvard Munch', fr: "Un tableau d'Edvard Munch" }
  },
  {
    blackWord: 'Q151047',
    subject: 'Q762',
    template: 'paintings-by',
    why: { en: 'A painting by Botticelli', fr: 'Un tableau de Botticelli' }
  },
  {
    blackWord: 'Q737062',
    sameThing: [['Q1189907', 'Q3220338']],
    subject: 'Q296',
    template: 'paintings-by',
    why: { en: 'A painting by Édouard Manet', fr: "Un tableau d'Édouard Manet" }
  },
  {
    blackWord: 'Q219831',
    subject: 'Q41264',
    template: 'paintings-by',
    why: { en: 'A painting by Rembrandt', fr: 'Un tableau de Rembrandt' }
  },
  {
    blackWord: 'Q55452801',
    labels: {
      en: 'Characters of Game of Thrones',
      fr: 'Les personnages de Game of Thrones'
    },
    subject: 'Q23572',
    template: 'characters-of-work',
    why: {
      en: 'A character of House of the Dragon',
      fr: 'Un personnage de House of the Dragon'
    }
  },
  {
    blackWord: 'Q46302',
    labels: {
      en: 'Characters of The Lord of the Rings',
      fr: 'Les personnages du Seigneur des anneaux'
    },
    subject: 'Q15228',
    template: 'characters-of-work',
    why: { en: 'The dragon of The Hobbit', fr: 'Le dragon du Hobbit' }
  },
  {
    blackWord: 'Q1142',
    labels: { en: 'Regions of France', fr: 'Les régions de France' },
    neighbour: 'Q36784',
    subject: 'Q142',
    template: 'subdivisions-of',
    why: {
      en: 'Merged into Grand Est in 2016',
      fr: 'Fondue dans le Grand Est en 2016'
    }
  },
  {
    blackWord: 'Q1183',
    labels: {
      en: 'States of the United States',
      fr: 'Les États des États-Unis'
    },
    neighbour: 'Q35657',
    subject: 'Q30',
    template: 'subdivisions-of',
    why: { en: 'A territory, not a state', fr: 'Un territoire, pas un État' }
  },
  {
    blackWord: 'Q25188',
    labels: {
      en: 'Winners of the Academy Award for Best Picture',
      fr: "Les films lauréats de l'Oscar du meilleur film"
    },
    subject: 'Q102427',
    template: 'award-winning-films',
    why: {
      en: 'Nominated in 2011, lost to The King’s Speech',
      fr: 'Nommé en 2011, battu par Le Discours d’un roi'
    }
  },
  {
    blackWord: 'Q175535',
    labels: {
      en: 'Winners of the Academy Award for Best Actor',
      fr: "Les lauréats de l'Oscar du meilleur acteur"
    },
    subject: 'Q103916',
    template: 'award-winning-people',
    why: {
      en: 'An Oscar for writing Good Will Hunting, never best actor',
      fr: 'Un Oscar du scénario pour Will Hunting, jamais du meilleur acteur'
    }
  },
  {
    blackWord: 'Q517',
    labels: { en: 'Kings of France', fr: 'Les rois de France' },
    neighbour: 'Q191954',
    subject: 'Q18384454',
    template: 'position-holders',
    why: { en: 'An emperor, never a king', fr: 'Empereur, jamais roi' }
  },
  {
    blackWord: 'Q18067135',
    labels: {
      en: 'Films directed by the Coen brothers',
      fr: 'Les films réalisés par les frères Coen'
    },
    subject: 'Q13595311',
    template: 'films-directed-by',
    why: {
      en: 'Written by the Coens, directed by Spielberg',
      fr: 'Écrit par les Coen, réalisé par Spielberg'
    }
  },
  {
    blackWord: 'Q1940145',
    subject: 'Q25161',
    template: 'books-by-author',
    why: {
      en: 'A novel by Ian Fleming; Dahl only wrote the film’s screenplay',
      fr: 'Un roman de Ian Fleming ; Dahl n’a écrit que le scénario du film'
    }
  },
  {
    blackWord: 'Q182153',
    labels: {
      en: 'Winners of the Academy Award for Best Animated Feature',
      fr: 'Les films lauréats de l’Oscar du meilleur film d’animation'
    },
    subject: 'Q106800',
    template: 'award-winning-films',
    why: {
      en: 'Nominated in 2007, lost to Happy Feet',
      fr: 'Nommé en 2007, battu par Happy Feet'
    }
  },
  {
    blackWord: 'Q72',
    countries: countriesIn('150'),
    labels: { en: 'Capitals of Europe', fr: 'Les capitales d’Europe' },
    subject: 'europe',
    template: 'capitals-of',
    why: {
      en: 'Switzerland’s largest city; its capital is Bern',
      fr: 'La plus grande ville de Suisse ; sa capitale est Berne'
    }
  },
  {
    blackWord: 'Q71',
    countries: countriesIn('155'),
    labels: {
      en: 'Capitals of Western Europe',
      fr: 'Les capitales d’Europe de l’Ouest'
    },
    subject: 'western-europe',
    template: 'capitals-of',
    why: {
      en: 'Home to the UN in Europe, but Switzerland’s capital is Bern',
      fr: 'Siège de l’ONU en Europe, mais la capitale suisse est Berne'
    }
  },
  {
    blackWord: 'Q25287',
    countries: countriesIn('154'),
    labels: {
      en: 'Capitals of Northern Europe',
      fr: 'Les capitales d’Europe du Nord'
    },
    subject: 'northern-europe',
    template: 'capitals-of',
    why: {
      en: 'Sweden’s second city; its capital is Stockholm',
      fr: 'La deuxième ville de Suède ; sa capitale est Stockholm'
    }
  },
  {
    blackWord: 'Q490',
    countries: countriesIn('039'),
    labels: {
      en: 'Capitals of Southern Europe',
      fr: 'Les capitales d’Europe du Sud'
    },
    subject: 'southern-europe',
    template: 'capitals-of',
    why: {
      en: 'Italy’s business capital; its capital is Rome',
      fr: 'La capitale économique de l’Italie ; sa capitale est Rome'
    }
  },
  {
    blackWord: 'Q656',
    countries: countriesIn('151'),
    labels: {
      en: 'Capitals of Eastern Europe',
      fr: 'Les capitales d’Europe de l’Est'
    },
    subject: 'eastern-europe',
    template: 'capitals-of',
    why: {
      en: 'Russia’s capital until 1918; Moscow since',
      fr: 'Capitale de la Russie jusqu’en 1918 ; Moscou depuis'
    }
  },
  {
    blackWord: 'Q71',
    countries: [
      'AND',
      'BEL',
      'BRA',
      'CHE',
      'DEU',
      'ESP',
      'ITA',
      'LUX',
      'MCO',
      'NLD',
      'SUR'
    ],
    labels: {
      en: 'Capitals of the countries bordering France',
      fr: 'Les capitales des pays frontaliers de la France'
    },
    subject: 'bordering-france',
    template: 'capitals-of',
    why: {
      en: 'On the French border, but Switzerland’s capital is Bern',
      fr: 'À la frontière française, mais la capitale suisse est Berne'
    }
  }
]
