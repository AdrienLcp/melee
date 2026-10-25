import type { CountryCode } from '@melee/protocol/country-code'

import { bankedCapitals } from '../src/infrastructure/questions/capital-bank'
import type { TemplateName, Wording } from './guess-nine-templates'

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

/** Names a table says that Wikidata does not hold, keyed by entity. */
export const SPOKEN_ALIASES: Readonly<Record<string, readonly string[]>> = {
  ...seatNamesByCapital(),
  Q7156: ['Barça', 'Barcelona'],
  Q8678: ['Rio'],
  Q8682: ['Real'],
  Q192071: ['Nantes'],
  Q483020: ['PSG', 'Paris Saint-Germain', 'Paris SG']
}

/** The states of an M49 region or intermediate region, as the capital bank files them. */
const countriesIn = (
  m49: string,
  { except }: { except?: string } = {}
): CountryCode[] =>
  bankedCapitals()
    .filter(
      ({ region, subregion }) =>
        (region === m49 || subregion === m49) && subregion !== except
    )
    .map(({ code }) => code)

export const GUESS_NINE_THEMES: readonly ThemeSpec[] = [
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
    blackWord: 'Q29054009',
    subject: 'Q42574',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Jonathan Mostow, without Cameron',
      fr: 'Réalisé par Jonathan Mostow, sans Cameron'
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
    blackWord: 'Q107270',
    subject: 'Q56094',
    template: 'films-directed-by',
    why: {
      en: 'Directed by his daughter, Sofia Coppola',
      fr: 'Réalisé par sa fille, Sofia Coppola'
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
    blackWord: 'Q980041',
    subject: 'Q4465',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Peter Jackson, directed by Spielberg',
      fr: 'Produit par Peter Jackson, réalisé par Spielberg'
    }
  },
  {
    blackWord: 'Q192073',
    subject: 'Q223687',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Jonathan Dayton and Valerie Faris',
      fr: 'Réalisé par Jonathan Dayton et Valerie Faris'
    }
  },
  {
    blackWord: 'Q471169',
    subject: 'Q25089',
    template: 'films-directed-by',
    why: { en: 'Directed by Rob Reiner', fr: 'Réalisé par Rob Reiner' }
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
    blackWord: 'Q162331',
    subject: 'Q53001',
    template: 'films-directed-by',
    why: {
      en: 'Directed by François Truffaut',
      fr: 'Réalisé par François Truffaut'
    }
  },
  {
    blackWord: 'Q19069',
    subject: 'Q8006',
    template: 'films-directed-by',
    why: {
      en: 'John Sturges’s western remake of Seven Samurai',
      fr: 'Le remake western des Sept Samouraïs, par John Sturges'
    }
  },
  {
    blackWord: 'Q741878',
    subject: 'Q55424',
    template: 'films-directed-by',
    why: {
      en: 'Robin Williams again, but directed by Barry Levinson',
      fr: 'Robin Williams aussi, mais réalisé par Barry Levinson'
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
    blackWord: 'Q85997053',
    subject: 'Q95008',
    template: 'films-directed-by',
    why: {
      en: 'Scored by Carpenter, directed by David Gordon Green',
      fr: 'Musique de Carpenter, réalisé par David Gordon Green'
    }
  },
  {
    blackWord: 'Q1137310',
    subject: 'Q47284',
    template: 'films-directed-by',
    why: {
      en: 'Tarantino’s half of Grindhouse; Rodriguez made Planet Terror',
      fr: 'La moitié de Grindhouse signée Tarantino ; Rodriguez a fait Planète Terreur'
    }
  },
  {
    blackWord: 'Q426828',
    subject: 'Q2071',
    template: 'films-directed-by',
    why: { en: 'Directed by Richard Kelly', fr: 'Réalisé par Richard Kelly' }
  },
  {
    blackWord: 'Q209538',
    subject: 'Q295964',
    template: 'films-directed-by',
    why: {
      en: 'Favreau plays Happy Hogan, Shane Black directs',
      fr: 'Favreau y joue Happy Hogan, Shane Black le réalise'
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
    blackWord: 'Q25627545',
    subject: 'Q103917',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Soderbergh, directed by Gary Ross',
      fr: 'Produit par Soderbergh, réalisé par Gary Ross'
    }
  },
  {
    blackWord: 'Q229808',
    subject: 'Q275402',
    template: 'films-directed-by',
    why: {
      en: 'Marc Webb’s reboot, after Raimi’s trilogy',
      fr: 'Le reboot de Marc Webb, après la trilogie de Raimi'
    }
  },
  {
    blackWord: 'Q1199628',
    subject: 'Q312258',
    template: 'films-directed-by',
    why: {
      en: 'Directed by his wife, Agnès Varda',
      fr: 'Réalisé par sa femme, Agnès Varda'
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
    blackWord: 'Q151904',
    subject: 'Q223233',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Martin Campbell; Mendes made Skyfall and Spectre',
      fr: 'Réalisé par Martin Campbell ; Mendes a fait Skyfall et Spectre'
    }
  },
  {
    blackWord: 'Q221102',
    subject: 'Q134867',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Boyle, directed by Juan Carlos Fresnadillo',
      fr: 'Produit par Boyle, réalisé par Juan Carlos Fresnadillo'
    }
  },
  {
    blackWord: 'Q42047',
    subject: 'Q189526',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Martin Scorsese',
      fr: 'Réalisé par Martin Scorsese'
    }
  },
  {
    blackWord: 'Q67805539',
    subject: 'Q28556',
    template: 'films-directed-by',
    why: {
      en: 'The third OSS 117, directed by Nicolas Bedos',
      fr: 'Le troisième OSS 117, réalisé par Nicolas Bedos'
    }
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
    blackWord: 'Q279991',
    subject: 'Q15862',
    template: 'albums-by-band',
    why: {
      en: 'Freddie Mercury with Montserrat Caballé, without Queen',
      fr: 'Freddie Mercury avec Montserrat Caballé, sans Queen'
    }
  },
  {
    blackWord: 'Q840476',
    subject: 'Q2306',
    template: 'albums-by-band',
    why: {
      en: 'Roger Waters solo, after he left Pink Floyd',
      fr: 'Roger Waters en solo, après son départ de Pink Floyd'
    }
  },
  {
    blackWord: 'Q26980835',
    subject: 'Q185828',
    template: 'albums-by-band',
    why: {
      en: 'The Weeknd’s album; Daft Punk only feature on two tracks',
      fr: 'Un album de The Weeknd ; Daft Punk n’est invité que sur deux titres'
    }
  },
  {
    blackWord: 'Q298',
    labels: {
      en: 'Countries bordering Brazil',
      fr: 'Les pays frontaliers du Brésil'
    },
    subject: 'Q155',
    template: 'countries-bordering',
    why: {
      en: 'With Ecuador, the only South American country not touching Brazil',
      fr: 'Avec l’Équateur, le seul pays d’Amérique du Sud sans frontière avec le Brésil'
    }
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
    blackWord: 'Q39',
    labels: { en: 'Member states of NATO', fr: 'Les États membres de l’OTAN' },
    subject: 'Q7184',
    template: 'members-of',
    why: {
      en: 'Neutral, never a NATO member',
      fr: 'Neutre, jamais membre de l’OTAN'
    }
  },
  {
    blackWord: 'Q794',
    labels: {
      en: 'Member states of the Arab League',
      fr: 'Les États membres de la Ligue arabe'
    },
    subject: 'Q7172',
    template: 'members-of',
    why: {
      en: 'Persian-speaking, never a member',
      fr: 'Persanophone, jamais membre'
    }
  },
  {
    blackWord: 'Q27',
    labels: {
      en: 'Member states of the Commonwealth',
      fr: 'Les États membres du Commonwealth'
    },
    subject: 'Q7785',
    template: 'members-of',
    why: {
      en: 'Left the Commonwealth in 1949',
      fr: 'A quitté le Commonwealth en 1949'
    }
  },
  {
    blackWord: 'Q237',
    labels: {
      en: 'Member states of the United Nations',
      fr: 'Les États membres de l’ONU'
    },
    subject: 'Q1065',
    template: 'members-of',
    why: {
      en: 'An observer state, never a member',
      fr: 'Un État observateur, jamais membre'
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
    labels: {
      en: 'Member states of La Francophonie',
      fr: 'Les États membres de la Francophonie'
    },
    subject: 'Q134102',
    template: 'members-of',
    why: {
      en: 'French is widely spoken, but Algeria never joined',
      fr: 'Le français y est très parlé, mais l’Algérie n’a jamais adhéré'
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
    blackWord: 'Q1006',
    subject: 'Q5146',
    template: 'countries-speaking',
    why: {
      en: 'French is official in Guinea; Portuguese is Guinea-Bissau’s',
      fr: 'Le français y est officiel ; le portugais, c’est la Guinée-Bissau'
    }
  },
  {
    blackWord: 'Q151820',
    labels: {
      en: 'Winners of the Prix Goncourt',
      fr: 'Les lauréats du prix Goncourt'
    },
    subject: 'Q187300',
    template: 'award-winners',
    why: {
      en: 'Journey to the End of the Night lost the 1932 Goncourt',
      fr: 'Voyage au bout de la nuit a manqué le Goncourt 1932'
    }
  },
  {
    blackWord: 'Q504',
    subject: 'Q37922',
    template: 'award-winners',
    why: {
      en: 'Nominated in 1901 and 1902, never won',
      fr: 'Nommé en 1901 et 1902, jamais lauréat'
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
    blackWord: 'Q1001',
    subject: 'Q35637',
    template: 'award-winners',
    why: {
      en: 'Nominated five times, never won',
      fr: 'Nommé cinq fois, jamais lauréat'
    }
  },
  {
    blackWord: 'Q184433',
    labels: {
      en: 'Fields Medal winners',
      fr: 'Les lauréats de la médaille Fields'
    },
    subject: 'Q28835',
    template: 'award-winners',
    why: {
      en: 'Past forty, given a silver plaque instead',
      fr: "Trop âgé à 41 ans, une plaque d'argent à la place"
    }
  },
  {
    blackWord: 'Q7251',
    labels: { en: 'Turing Award winners', fr: 'Les lauréats du prix Turing' },
    subject: 'Q185667',
    template: 'award-winners',
    why: {
      en: 'The award bears his name, created after his death',
      fr: 'Le prix porte son nom, créé après sa mort'
    }
  },
  {
    blackWord: 'Q9106',
    subject: 'Q44585',
    template: 'award-winners',
    why: {
      en: 'Nominated several times, never won',
      fr: 'Proposé plusieurs fois, jamais lauréat'
    }
  },
  {
    blackWord: 'Q529',
    subject: 'Q80061',
    template: 'award-winners',
    why: {
      en: 'Died six years before the first Nobel',
      fr: 'Mort six ans avant le premier Nobel'
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
    blackWord: 'Q318471',
    labels: {
      en: 'Prime ministers of the United Kingdom',
      fr: 'Les Premiers ministres britanniques'
    },
    neighbour: 'Q531471',
    subject: 'Q14211',
    template: 'position-holders',
    why: {
      en: 'Led the Brexit campaign, never prime minister',
      fr: 'Figure du Brexit, jamais Premier ministre'
    }
  },
  {
    blackWord: 'Q76658',
    labels: {
      en: 'Chancellors of Germany since 1949',
      fr: "Les chanceliers fédéraux d'Allemagne"
    },
    neighbour: 'Q25223',
    subject: 'Q4970706',
    template: 'position-holders',
    why: {
      en: 'Beaten in 2009, president instead',
      fr: 'Battu en 2009, devenu président fédéral'
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
    blackWord: 'Q192649',
    labels: {
      en: 'Books by Honoré de Balzac',
      fr: "Les livres d'Honoré de Balzac"
    },
    subject: 'Q9711',
    template: 'books-by-author',
    why: { en: 'A novel by Stendhal', fr: 'Un roman de Stendhal' }
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
    blackWord: 'Q193417',
    subject: 'Q9327',
    template: 'books-by-author',
    why: {
      en: 'A novel by Gustave Flaubert, his mentor',
      fr: 'Un roman de Gustave Flaubert, son mentor'
    }
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
    blackWord: 'Q170583',
    subject: 'Q5686',
    template: 'books-by-author',
    why: { en: 'A novel by Jane Austen', fr: 'Un roman de Jane Austen' }
  },
  {
    blackWord: 'Q471379',
    subject: 'Q5582',
    template: 'paintings-by',
    why: { en: 'A painting by Edvard Munch', fr: "Un tableau d'Edvard Munch" }
  },
  {
    blackWord: 'Q737062',
    subject: 'Q296',
    template: 'paintings-by',
    why: { en: 'A painting by Édouard Manet', fr: "Un tableau d'Édouard Manet" }
  },
  {
    blackWord: 'Q25729',
    subject: 'Q5593',
    template: 'paintings-by',
    why: {
      en: 'A painting by Salvador Dalí',
      fr: 'Un tableau de Salvador Dalí'
    }
  },
  {
    blackWord: 'Q151047',
    subject: 'Q762',
    template: 'paintings-by',
    why: { en: 'A painting by Botticelli', fr: 'Un tableau de Botticelli' }
  },
  {
    blackWord: 'Q328523',
    labels: {
      en: 'Paintings by Auguste Renoir',
      fr: "Les tableaux d'Auguste Renoir"
    },
    subject: 'Q39931',
    template: 'paintings-by',
    why: { en: 'A painting by Claude Monet', fr: 'Un tableau de Claude Monet' }
  },
  {
    blackWord: 'Q219831',
    subject: 'Q41264',
    template: 'paintings-by',
    why: { en: 'A painting by Rembrandt', fr: 'Un tableau de Rembrandt' }
  },
  {
    blackWord: 'Q185372',
    subject: 'Q5598',
    template: 'paintings-by',
    why: {
      en: 'A painting by Johannes Vermeer',
      fr: 'Un tableau de Johannes Vermeer'
    }
  },
  {
    blackWord: 'Q1061035',
    subject: 'Q5577',
    template: 'paintings-by',
    why: {
      en: 'A painting by René Magritte',
      fr: 'Un tableau de René Magritte'
    }
  },
  {
    blackWord: 'Q25729',
    subject: 'Q7836',
    template: 'paintings-by',
    why: {
      en: 'A painting by Salvador Dalí',
      fr: 'Un tableau de Salvador Dalí'
    }
  },
  {
    blackWord: 'Q328523',
    labels: {
      en: 'Paintings by Édouard Manet',
      fr: "Les tableaux d'Édouard Manet"
    },
    subject: 'Q40599',
    template: 'paintings-by',
    why: { en: 'A painting by Claude Monet', fr: 'Un tableau de Claude Monet' }
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
    blackWord: 'Q161036',
    labels: { en: 'States of Germany', fr: "Les Länder d'Allemagne" },
    neighbour: 'Q1221156',
    subject: 'Q183',
    template: 'subdivisions-of',
    why: { en: 'Abolished in 1947', fr: 'Abolie en 1947' }
  },
  {
    blackWord: 'Q1410',
    labels: {
      en: 'Autonomous communities of Spain',
      fr: "Les communautés autonomes d'Espagne"
    },
    neighbour: 'Q10742',
    subject: 'Q29',
    template: 'subdivisions-of',
    why: { en: 'A British territory', fr: 'Un territoire britannique' }
  },
  {
    blackWord: 'Q2023',
    labels: { en: 'Provinces of Canada', fr: 'Les provinces du Canada' },
    neighbour: 'Q11828004',
    subject: 'Q16',
    template: 'subdivisions-of',
    why: {
      en: 'A territory, not a province',
      fr: 'Un territoire, pas une province'
    }
  },
  {
    blackWord: 'Q347',
    labels: { en: 'Cantons of Switzerland', fr: 'Les cantons suisses' },
    neighbour: 'Q23058',
    subject: 'Q39',
    template: 'subdivisions-of',
    why: {
      en: 'An independent principality',
      fr: 'Une principauté indépendante'
    }
  },
  {
    blackWord: 'Q2737',
    labels: {
      en: 'Winners of the César Award for Best Actor',
      fr: 'Les lauréats du César du meilleur acteur'
    },
    subject: 'Q900494',
    template: 'award-winners',
    why: {
      en: 'An honorary César, never best actor',
      fr: "Un César d'honneur, jamais du meilleur acteur"
    }
  },
  {
    blackWord: 'Q36268',
    labels: {
      en: 'Winners of the César Award for Best Actress',
      fr: 'Les lauréates du César de la meilleure actrice'
    },
    subject: 'Q24241',
    template: 'award-winners',
    why: {
      en: 'Retired before the César existed',
      fr: 'Retirée avant la création des César'
    }
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
    blackWord: 'Q117663112',
    labels: {
      en: "Palme d'Or winners",
      fr: "Les films lauréats de la Palme d'or"
    },
    subject: 'Q179808',
    template: 'award-winning-films',
    why: {
      en: 'In competition in 2023; Anatomy of a Fall took the Palme',
      fr: 'En compétition en 2023 ; la Palme est allée à Anatomie d’une chute'
    }
  },
  {
    blackWord: 'Q101112656',
    labels: {
      en: 'Golden Lion winners',
      fr: "Les films lauréats du Lion d'or"
    },
    subject: 'Q209459',
    template: 'award-winning-films',
    why: {
      en: 'Silver Lion for its direction in 2024, not the Golden Lion',
      fr: 'Lion d’argent de la mise en scène en 2024, pas le Lion d’or'
    }
  },
  {
    blackWord: 'Q86427',
    labels: {
      en: 'Golden Bear winners',
      fr: "Les films lauréats de l'Ours d'or"
    },
    subject: 'Q154590',
    template: 'award-winning-films',
    why: {
      en: 'Silver Bear for best director in 1960',
      fr: 'Ours d’argent du meilleur réalisateur en 1960'
    }
  },
  {
    blackWord: 'Q9036',
    labels: {
      en: 'Nobel Prize in Physics laureates',
      fr: 'Les lauréats du prix Nobel de physique'
    },
    subject: 'Q38104',
    template: 'award-winning-people',
    why: {
      en: 'Never won; the 1915 rumour of a prize shared with Edison was false',
      fr: 'Jamais lauréat ; la rumeur d’un prix partagé avec Edison en 1915 était fausse'
    }
  },
  {
    blackWord: 'Q9317',
    labels: {
      en: 'Nobel laureates in Economics',
      fr: "Les lauréats du prix Nobel d'économie"
    },
    subject: 'Q47170',
    template: 'award-winning-people',
    why: {
      en: 'Died in 1946, before the prize was created in 1969',
      fr: 'Mort en 1946, avant la création du prix en 1969'
    }
  },
  {
    blackWord: 'Q214642',
    labels: { en: 'Booker Prize winners', fr: 'Les lauréats du prix Booker' },
    subject: 'Q160082',
    template: 'award-winning-people',
    why: {
      en: 'Shortlisted in 2017 for 4 3 2 1, never won',
      fr: 'Finaliste en 2017 avec 4 3 2 1, jamais lauréat'
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
    blackWord: 'Q23844',
    labels: {
      en: 'Winners of the Academy Award for Best Director',
      fr: "Les lauréats de l'Oscar du meilleur réalisateur"
    },
    subject: 'Q103360',
    template: 'award-winning-people',
    why: {
      en: 'Oscars for acting and for producing Argo, never best director',
      fr: 'Oscarisé comme acteur et producteur d’Argo, jamais comme réalisateur'
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
    blackWord: 'Q329',
    labels: {
      en: 'Prime ministers of France',
      fr: 'Les Premiers ministres français'
    },
    neighbour: 'Q191954',
    subject: 'Q1587677',
    template: 'position-holders',
    why: {
      en: 'Interior minister, never prime minister',
      fr: "Ministre de l'Intérieur, jamais Premier ministre"
    }
  },
  {
    blackWord: 'Q658288',
    labels: { en: 'Books by Albert Camus', fr: "Les livres d'Albert Camus" },
    subject: 'Q34670',
    template: 'books-by-author',
    why: {
      en: 'A novel by Jean-Paul Sartre',
      fr: 'Un roman de Jean-Paul Sartre'
    }
  },
  {
    blackWord: 'Q191949',
    subject: 'Q3335',
    template: 'books-by-author',
    why: { en: 'A novel by Aldous Huxley', fr: "Un roman d'Aldous Huxley" }
  },
  {
    blackWord: 'Q192649',
    subject: 'Q43444',
    template: 'books-by-author',
    why: { en: 'A novel by Stendhal', fr: 'Un roman de Stendhal' }
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
    blackWord: 'Q16672466',
    subject: 'Q55171',
    template: 'films-directed-by',
    why: {
      en: 'Produced by the Almodóvar brothers, directed by Damián Szifron',
      fr: 'Produit par les frères Almodóvar, réalisé par Damián Szifron'
    }
  },
  {
    blackWord: 'Q1749100',
    subject: 'Q51552',
    template: 'films-directed-by',
    why: {
      en: 'Polanski plays himself, Michel Blanc directs',
      fr: 'Polanski y joue son propre rôle, Michel Blanc le réalise'
    }
  },
  {
    blackWord: 'Q80379',
    subject: 'Q219124',
    template: 'films-directed-by',
    why: {
      en: 'Co-written by del Toro, who was to direct it; Peter Jackson did',
      fr: 'Coécrit par del Toro, qui devait le réaliser ; Peter Jackson l’a fait'
    }
  },
  {
    blackWord: 'Q323472',
    subject: 'Q192762',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Aronofsky, directed by David O. Russell',
      fr: 'Produit par Aronofsky, réalisé par David O. Russell'
    }
  },
  {
    blackWord: 'Q275553',
    subject: 'Q103646',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Ron Howard, directed by Clint Eastwood',
      fr: 'Produit par Ron Howard, réalisé par Clint Eastwood'
    }
  },
  {
    blackWord: 'Q47075',
    subject: 'Q179497',
    template: 'films-directed-by',
    why: {
      en: 'Written by Oliver Stone, directed by Brian De Palma',
      fr: 'Écrit par Oliver Stone, réalisé par Brian De Palma'
    }
  },
  {
    blackWord: 'Q201924',
    subject: 'Q270097',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Michael Mann, directed by Martin Scorsese',
      fr: 'Produit par Michael Mann, réalisé par Martin Scorsese'
    }
  },
  {
    blackWord: 'Q475693',
    subject: 'Q495980',
    template: 'films-directed-by',
    why: { en: 'Directed by Park Chan-wook', fr: 'Réalisé par Park Chan-wook' }
  },
  {
    blackWord: 'Q260379',
    subject: 'Q160726',
    template: 'films-directed-by',
    why: { en: 'Directed by Zhang Yimou', fr: 'Réalisé par Zhang Yimou' }
  },
  {
    blackWord: 'Q2246971',
    labels: {
      en: 'Books by Haruki Murakami',
      fr: 'Les livres d’Haruki Murakami'
    },
    subject: 'Q134798',
    template: 'books-by-author',
    why: {
      en: 'A novel by Banana Yoshimoto',
      fr: 'Un roman de Banana Yoshimoto'
    }
  },
  {
    blackWord: 'Q1168267',
    subject: 'Q5878',
    template: 'books-by-author',
    why: { en: 'A novel by Isabel Allende', fr: 'Un roman d’Isabel Allende' }
  },
  {
    blackWord: 'Q161531',
    subject: 'Q991',
    template: 'books-by-author',
    why: { en: 'A novel by Leo Tolstoy', fr: 'Un roman de Léon Tolstoï' }
  },
  {
    blackWord: 'Q165318',
    subject: 'Q7243',
    template: 'books-by-author',
    why: {
      en: 'A novel by Fyodor Dostoevsky',
      fr: 'Un roman de Fiodor Dostoïevski'
    }
  },
  {
    blackWord: 'Q1216707',
    subject: 'Q905',
    template: 'books-by-author',
    why: { en: 'A novel by Dino Buzzati', fr: 'Un roman de Dino Buzzati' }
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
    blackWord: 'Q1198839',
    subject: 'Q236630',
    template: 'books-by-author',
    why: { en: 'A novel by Alain-Fournier', fr: 'Un roman d’Alain-Fournier' }
  },
  {
    blackWord: 'Q892658',
    labels: {
      en: 'Books by Amélie Nothomb',
      fr: 'Les livres d’Amélie Nothomb'
    },
    subject: 'Q168040',
    template: 'books-by-author',
    why: { en: 'A novel by Françoise Sagan', fr: 'Un roman de Françoise Sagan' }
  },
  {
    blackWord: 'Q2817377',
    subject: 'Q103114',
    template: 'books-by-author',
    why: {
      en: 'A novel by Frédéric Beigbeder',
      fr: 'Un roman de Frédéric Beigbeder'
    }
  },
  {
    blackWord: 'Q167906',
    subject: 'Q7833',
    template: 'books-by-author',
    why: { en: 'A novel by Raymond Queneau', fr: 'Un roman de Raymond Queneau' }
  },
  {
    blackWord: 'Q1193312',
    subject: 'Q42207',
    template: 'paintings-by',
    why: {
      en: 'By Georges de La Tour; Caravaggio painted his own Cardsharps',
      fr: 'De Georges de La Tour ; le Caravage a peint ses propres Tricheurs'
    }
  },
  {
    blackWord: 'Q1212269',
    labels: {
      en: 'Paintings by Francisco de Goya',
      fr: 'Les tableaux de Francisco de Goya'
    },
    subject: 'Q5432',
    template: 'paintings-by',
    why: {
      en: 'By Édouard Manet, after Goya’s Third of May',
      fr: 'D’Édouard Manet, d’après le Tres de mayo de Goya'
    }
  },
  {
    blackWord: 'Q920030',
    subject: 'Q297',
    template: 'paintings-by',
    why: { en: 'A royal portrait by Goya', fr: 'Un portrait royal de Goya' }
  },
  {
    blackWord: 'Q474338',
    subject: 'Q5597',
    template: 'paintings-by',
    why: {
      en: 'By Leonardo da Vinci; Raphael painted the Lady with a Unicorn',
      fr: 'De Léonard de Vinci ; Raphaël a peint La Dame à la licorne'
    }
  },
  {
    blackWord: 'Q910199',
    labels: {
      en: 'Paintings by Henri Matisse',
      fr: 'Les tableaux d’Henri Matisse'
    },
    subject: 'Q5589',
    template: 'paintings-by',
    why: {
      en: 'By Pablo Picasso, his rival',
      fr: 'De Pablo Picasso, son rival'
    }
  },
  {
    blackWord: 'Q464782',
    labels: {
      en: 'Paintings by Edward Hopper',
      fr: 'Les tableaux d’Edward Hopper'
    },
    subject: 'Q203401',
    template: 'paintings-by',
    why: { en: 'By Grant Wood', fr: 'De Grant Wood' }
  },
  {
    blackWord: 'Q249967',
    labels: { en: 'Illumination films', fr: 'Les films Illumination' },
    subject: 'Q1189512',
    template: 'films-of-studio',
    why: {
      en: 'Made by Sony Pictures Animation',
      fr: 'Un film de Sony Pictures Animation'
    }
  },
  {
    blackWord: 'Q11648811',
    labels: {
      en: 'Winners of the César Award for Best Film',
      fr: 'Les films lauréats du César du meilleur film'
    },
    subject: 'Q645595',
    template: 'award-winning-films',
    why: {
      en: 'Palme d’or 2013; the César went to Me, Myself and Mum',
      fr: 'Palme d’or 2013 ; le César est allé aux Garçons et Guillaume, à table !'
    }
  },
  {
    blackWord: 'Q104123',
    labels: {
      en: 'Winners of the Golden Globe for Best Drama Film',
      fr: 'Les films lauréats du Golden Globe du meilleur film dramatique'
    },
    subject: 'Q1011509',
    template: 'award-winning-films',
    why: {
      en: 'Nominated in 1995, lost to Forrest Gump',
      fr: 'Nommé en 1995, battu par Forrest Gump'
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
    blackWord: 'Q128933',
    labels: {
      en: 'Prime ministers of Canada',
      fr: 'Les Premiers ministres du Canada'
    },
    neighbour: 'Q390776',
    subject: 'Q839078',
    template: 'position-holders',
    why: {
      en: 'Governor General, then head of La Francophonie, never prime minister',
      fr: 'Gouverneure générale, puis secrétaire générale de la Francophonie, jamais Première ministre'
    }
  },
  {
    blackWord: 'Q57308',
    labels: {
      en: 'Secretaries-General of the United Nations',
      fr: 'Les secrétaires généraux de l’ONU'
    },
    neighbour: 'Q1161813',
    subject: 'Q81066',
    template: 'position-holders',
    why: {
      en: 'President of the UN General Assembly in 1974, never Secretary-General',
      fr: 'Président de l’Assemblée générale de l’ONU en 1974, jamais secrétaire général'
    }
  },
  {
    blackWord: 'Q470806',
    subject: 'Q382389',
    template: 'films-directed-by',
    why: {
      en: 'Dialogue by his father Michel Audiard, directed by Georges Lautner',
      fr: 'Dialogues de son père Michel Audiard, réalisé par Georges Lautner'
    }
  },
  {
    blackWord: 'Q348013',
    subject: 'Q513632',
    template: 'films-directed-by',
    why: {
      en: 'Jaoui and Bacri again, but directed by Agnès Jaoui',
      fr: 'Jaoui et Bacri aussi, mais réalisé par Agnès Jaoui'
    }
  },
  {
    blackWord: 'Q25139',
    subject: 'Q25132',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Sam Mendes, the year of Magnolia',
      fr: 'Réalisé par Sam Mendes, l’année de Magnolia'
    }
  },
  {
    blackWord: 'Q1070729',
    subject: 'Q157322',
    template: 'books-by-author',
    why: {
      en: 'A novel by Antoine de Saint-Exupéry, another airman',
      fr: 'Un roman d’Antoine de Saint-Exupéry, aviateur lui aussi'
    }
  },
  {
    blackWord: 'Q1195257',
    labels: { en: 'Books by Annie Ernaux', fr: 'Les livres d’Annie Ernaux' },
    subject: 'Q1153825',
    template: 'books-by-author',
    why: {
      en: 'A novel by Marguerite Duras',
      fr: 'Un roman de Marguerite Duras'
    }
  },
  {
    blackWord: 'Q163297',
    subject: 'Q9364',
    template: 'books-by-author',
    why: { en: 'A novel by Albert Camus', fr: 'Un roman d’Albert Camus' }
  },
  {
    blackWord: 'Q328523',
    subject: 'Q159758',
    template: 'paintings-by',
    why: { en: 'A painting by Claude Monet', fr: 'Un tableau de Claude Monet' }
  },
  {
    blackWord: 'Q321303',
    subject: 'Q43270',
    template: 'paintings-by',
    why: {
      en: 'A painting by Hieronymus Bosch',
      fr: 'Un tableau de Jérôme Bosch'
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
    blackWord: 'Q8678',
    countries: countriesIn('005'),
    labels: {
      en: 'Capitals of South America',
      fr: 'Les capitales d’Amérique du Sud'
    },
    subject: 'south-america',
    template: 'capitals-of',
    why: {
      en: 'Brazil’s capital until 1960; Brasília since',
      fr: 'Capitale du Brésil jusqu’en 1960 ; Brasília depuis'
    }
  },
  {
    blackWord: 'Q7903',
    countries: countriesIn('002'),
    labels: { en: 'Capitals of Africa', fr: 'Les capitales d’Afrique' },
    subject: 'africa',
    template: 'capitals-of',
    why: {
      en: 'Morocco’s largest city; its capital is Rabat',
      fr: 'La plus grande ville du Maroc ; sa capitale est Rabat'
    }
  },
  {
    blackWord: 'Q406',
    countries: countriesIn('142'),
    labels: { en: 'Capitals of Asia', fr: 'Les capitales d’Asie' },
    subject: 'asia',
    template: 'capitals-of',
    why: {
      en: 'Turkey’s largest city; its capital is Ankara',
      fr: 'La plus grande ville de Turquie ; sa capitale est Ankara'
    }
  },
  {
    blackWord: 'Q3130',
    countries: countriesIn('009'),
    labels: { en: 'Capitals of Oceania', fr: 'Les capitales d’Océanie' },
    subject: 'oceania',
    template: 'capitals-of',
    why: {
      en: 'Australia’s largest city; its capital is Canberra',
      fr: 'La plus grande ville d’Australie ; sa capitale est Canberra'
    }
  },
  {
    blackWord: 'Q60',
    countries: countriesIn('019', { except: '005' }),
    labels: {
      en: 'Capitals of North and Central America',
      fr: 'Les capitales d’Amérique du Nord et centrale'
    },
    subject: 'north-and-central-america',
    template: 'capitals-of',
    why: {
      en: 'The largest city of the United States; its capital is Washington',
      fr: 'La plus grande ville des États-Unis ; leur capitale est Washington'
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
    blackWord: 'Q37995',
    countries: countriesIn('035'),
    labels: {
      en: 'Capitals of South-eastern Asia',
      fr: 'Les capitales d’Asie du Sud-Est'
    },
    subject: 'south-eastern-asia',
    template: 'capitals-of',
    why: {
      en: 'Myanmar’s capital until 2006; Naypyidaw since',
      fr: 'Capitale de la Birmanie jusqu’en 2006 ; Naypyidaw depuis'
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
  },
  {
    blackWord: 'Q38',
    countries: [
      'AUS',
      'BOL',
      'BRA',
      'CAN',
      'CHE',
      'CIV',
      'ECU',
      'KAZ',
      'LKA',
      'MAR',
      'NGA',
      'NZL',
      'PAK',
      'TUR',
      'TZA',
      'USA',
      'VNM',
      'ZAF'
    ],
    labels: {
      en: 'Countries whose capital is not their largest city',
      fr: 'Les pays dont la capitale n’est pas la plus grande ville'
    },
    subject: 'capital-not-largest-city',
    template: 'countries-listed',
    why: {
      en: 'Rome is its largest city too; Milan is only its richest',
      fr: 'Rome est aussi sa plus grande ville ; Milan n’est que la plus riche'
    }
  }
]
