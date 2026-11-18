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

/**
 * The name a Portuguese screen shows where Wikidata's `pt` label is not
 * Portugal's — a Brazilian title, an untranslated one — keyed by entity.
 */
export const PORTUGUESE_LABELS: Readonly<Record<string, string>> = {
  Q631: 'Inter de Milão',
  Q782: 'Havai',
  Q824: 'Oregon',
  Q977: 'Djibuti',
  Q1422: 'Juventus',
  Q1543: 'AC Milan',
  Q1764: 'Reiquiavique',
  Q2875: 'E Tudo o Vento Levou',
  Q5738: 'Adolphe Thiers',
  Q7156: 'Barcelona',
  Q7721: 'Napoleão III',
  Q8682: 'Real Madrid',
  Q8701: 'Atlético de Madrid',
  Q9616: 'Chelsea',
  Q13917: 'Île-de-France',
  Q17163: 'Johan Cruyff',
  Q18656: 'Manchester United',
  Q18711: 'Aston Villa',
  Q19490: 'Nottingham Forest',
  Q19509: 'Rennes',
  Q19512: 'Sochaux',
  Q19513: 'Montpellier',
  Q19516: 'Lille',
  Q19521: 'Saint-Étienne',
  Q20456: 'Danças com Lobos',
  Q39444: 'Ronaldinho',
  Q41483: 'O Bom, o Mau e o Vilão',
  Q47703: 'O Padrinho',
  Q50602: 'Manchester City',
  Q53592: 'Da Terra à Lua',
  Q81205: 'Megamente',
  Q81888: 'Ajax',
  Q86791: 'Um Conto de Natal',
  Q104137: 'Imperdoável',
  Q109564: 'A Corda',
  Q117464: 'Le Gendarme de Saint-Tropez',
  Q120367: 'Gang de Tubarões',
  Q126334: 'Estrasburgo',
  Q128446: 'FC Porto',
  Q131074: 'O Senhor dos Anéis: O Regresso do Rei',
  Q131499: 'Benfica',
  Q132863: 'À Procura de Nemo',
  Q132885: 'Olympique de Marselha',
  Q151047: 'O Nascimento de Vénus',
  Q151143: 'Mulher com Colar de Pérolas',
  Q153723: 'Sacanas Sem Lei',
  Q154581: 'Gangs de Nova Iorque',
  Q157541: 'Girassóis',
  Q163038: 'Psico',
  Q163872: 'O Cavaleiro das Trevas',
  Q164417: 'A Noiva Cadáver',
  Q165512: '101 Dálmatas',
  Q166937: 'Mulher de Azul a Ler uma Carta',
  Q172476: 'Bordéus',
  Q174555: 'Madagáscar',
  Q174654: 'O Segredo de Chimneys',
  Q180305: 'AS Mónaco',
  Q182218: 'Os Vingadores',
  Q182876: 'Auxerre',
  Q183239: 'O Estranho Caso de Benjamin Button',
  Q184843: 'Blade Runner',
  Q185163: 'Nice',
  Q187726: 'Monstros e Companhia',
  Q188439: 'Entrelaçados',
  Q189505: 'Tubarão',
  Q190765: '1492: Cristóvão Colombo',
  Q191843: 'RC Lens',
  Q192071: 'FC Nantes',
  Q196004: 'Aberto Até de Madrugada',
  Q199940: 'Noventa e Três',
  Q202548: 'A Mulher Que Viveu Duas Vezes',
  Q206576: 'A Invenção de Hugo',
  Q207698: 'Reino dos Céus',
  Q208108: 'Apanha-me Se Puderes',
  Q208228: 'Reims',
  Q212041: 'Sweeney Todd: O Terrível Barbeiro de Fleet Street',
  Q213326: 'The Incredibles: Os Super-Heróis',
  Q213411: 'O Náufrago',
  Q214132: 'As Dez Figuras Negras',
  Q215365: 'Kenai e Koda',
  Q216153: 'Uma Vida de Inseto',
  Q216720: 'O Rochedo',
  Q216929: 'Oliver e Companhia',
  Q217182: 'Eduardo Mãos de Tesoura',
  Q218235: 'Charlie e a Fábrica de Chocolate',
  Q219457: 'Viagem ao Centro da Terra',
  Q219831: 'A Ronda da Noite',
  Q221384: 'Cercados',
  Q223163: 'Pacha e o Imperador',
  Q232055: 'Dois Anos de Férias',
  Q237222: 'Sangue por Sangue',
  Q244604: 'Relatório Minoritário',
  Q245227: 'O Príncipe do Egito',
  Q245366: 'Pular a Cerca',
  Q270215: 'Contacto',
  Q278997: 'O Grande Peixe',
  Q304493: 'Poirot Desvenda o Passado',
  Q305250: 'A Idade do Gelo',
  Q318766: 'Terminal de Aeroporto',
  Q319149: 'As Aventuras do Capitão Hatteras',
  Q323318: 'Sombras da Escuridão',
  Q326114: 'Indomável',
  Q328523: 'Impressão, Nascer do Sol',
  Q334132: 'Rato Basílio: O Grande Mestre dos Detetives',
  Q379873: 'Quem Tramou Roger Rabbit?',
  Q380349: 'As Aventuras Extraordinárias de Adèle Blanc-Sec',
  Q381731: 'Destruir Depois de Ler',
  Q384160: 'A Longa Marcha',
  Q392530: 'O Planeta do Tesouro',
  Q399823: 'As Pontes de Madison County',
  Q406936: 'Le Corniaud',
  Q429969: 'Insónia',
  Q457252: 'O Mistério dos Sete Relógios',
  Q462454: 'O Talismã',
  Q464951: 'As Bandeiras dos Nossos Pais',
  Q466605: 'Charlie e a Fábrica de Chocolate',
  Q466790: 'A Zona Morta',
  Q470937: 'Shining',
  Q472228: 'O Misterioso Caso de Styles',
  Q474093: 'Millennium 1: Os Homens Que Odeiam as Mulheres',
  Q495850: 'Os Croods',
  Q496255: 'Chamada para a Morte',
  Q497311: 'A Casa Encantada',
  Q499639: 'O Desconhecido do Norte-Expresso',
  Q501105: 'Os 39 Degraus',
  Q501874: 'Irmão, Onde Estás?',
  Q501995: 'O Cabo do Medo',
  Q502629: 'Em Busca da Esmeralda Perdida',
  Q517239: 'Vertigem Azul',
  Q550232: 'Artur e os Minimeus',
  Q559524: 'Rei-Bruxo de Angmar',
  Q560800: "L'As des as",
  Q570481: 'Revelação',
  Q583407: 'Um Assassino pelas Costas',
  Q587419: 'Difamação',
  Q607232: 'O Dinheiro',
  Q610502: 'Formiga Z',
  Q622634: 'Cinco Semanas em Balão',
  Q622769: 'Homem de Aço',
  Q627333: 'A Máquina do Tempo',
  Q640547: 'Soldado Universal',
  Q641315: 'Spirit: O Corcel Indomável',
  Q643203: 'George e o Remédio Maravilhoso',
  Q670439: 'Arizona Júnior',
  Q681918: 'Monstros vs. Alienígenas',
  Q693559: 'Encontro com um Assassino',
  Q700251: 'Rapariga a Ler uma Carta à Janela',
  Q705247: 'A Mania das Grandezas',
  Q723020: '22/11/63',
  Q723187: 'O Jogo',
  Q726215: 'Táxi',
  Q727861: 'Os Crimes do ABC',
  Q731626: 'Cai o Pano',
  Q735061: 'A Carta de Amor',
  Q741042: 'Sala de Pânico',
  Q741196: 'O Sargento de Ferro',
  Q741570: 'O Sonho',
  Q742226: 'Cemitério de Animais',
  Q747936: 'Horizontes de Glória',
  Q750117: 'Crueldade Intolerável',
  Q785461: 'Impacto Súbito',
  Q835739: 'Cujo',
  Q846209: 'Nova Iorque Fora de Horas',
  Q851095: 'Um Mal Nunca Vem Só',
  Q862197: 'Polar Express',
  Q865211: 'O Homem Que Ri',
  Q906705: 'O Pistoleiro do Diabo',
  Q913440: 'O Barbeiro',
  Q941549: 'La Grenouillère',
  Q960060: 'Hora Zero',
  Q969367: 'Mulher a Segurar uma Balança',
  Q980041: 'As Aventuras de Tintin',
  Q1051472: 'A Ratoeira',
  Q1121567: 'Miguel Strogoff',
  Q1130849: 'Liverpool',
  Q1137310: 'À Prova de Morte',
  Q1140257: "Joana d'Arc",
  Q1160186: 'A Morte Fica-vos Tão Bem',
  Q1167912: 'Almoço na Relva',
  Q1169395: 'O Concerto',
  Q1170032: 'O Paraíso das Damas',
  Q1170481: 'Le Cerveau',
  Q1193210: 'O Exorcista',
  Q1196439: 'Le Coup du parapluie',
  Q1197590: 'A Taberna',
  Q1210863: 'As Loucas Aventuras do Rabi Jacob',
  Q1211109: 'Os Trabalhadores do Mar',
  Q1212773: 'A Alegria de Viver',
  Q1217792: 'Os Pestes',
  Q1446938: 'A Obra',
  Q1451508: 'Mulher com Sombrinha',
  Q1476462: 'O Amigo Gigante',
  Q1755607: 'A Terra',
  Q2271805: 'Campo de Trigo com Ciprestes',
  Q2320903: 'O Fantástico Senhor Raposo',
  Q2336984: 'A Lição de Música',
  Q2340655: 'A Propósito de Llewyn Davis',
  Q2350772: 'Assalto à Casa Branca',
  Q2381272: 'Camille Monet no Leito de Morte',
  Q2409203: 'A Derrocada',
  Q2734892: 'Mulheres no Jardim',
  Q3086219: 'A Lenda dos Séculos',
  Q3212522: 'A Rua Montorgueil',
  Q3231547: 'Os Castigos',
  Q3231725: 'As Contemplações',
  Q3231771: 'Papoilas',
  Q3265982: 'Lucrécia Bórgia',
  Q3404003: 'Raptadas',
  Q3630735: 'Autorretrato',
  Q4233325: 'Raízes de Árvores',
  Q5815826: 'Coco',
  Q5887360: 'Guardiões da Galáxia',
  Q7737199: 'A Viagem de Arlo',
  Q11826275: 'A Sesta',
  Q14920425: 'Em Parte Incerta',
  Q15068238: 'Kingsman: Serviços Secretos',
  Q16970789: 'Sniper Americano',
  Q17023954: 'Retrato do Dr. Gachet',
  Q18155726: 'Perdido e Achado',
  Q18516636: 'Salve, César!',
  Q18647981: 'Vaiana',
  Q18677767: 'Altos de França',
  Q18811634: 'Silêncio',
  Q19321019: 'A Casa da Senhora Peregrine para Crianças Peculiares',
  Q19363214: 'Autorretrato com Orelha Cortada e Cachimbo',
  Q19569225: 'Rei Artur: A Lenda da Espada',
  Q19896308: 'Fim de Turno',
  Q20382729: 'O Primeiro Encontro',
  Q20926273: 'Valerian e a Cidade dos Mil Planetas',
  Q23781129: 'Capitão Marvel',
  Q29588607: 'Homem-Aranha: No Universo Aranha',
  Q37342034: 'A Balada de Buster Scruggs',
  Q47300912: 'Era Uma Vez em... Hollywood',
  Q49985736: 'A Gare Saint-Lazare',
  Q54812267: 'Correio de Droga',
  Q59690895: 'Bora Lá',
  Q60614686: 'The Gentlemen',
  Q60834962: 'Duna',
  Q61448040: 'Parasitas',
  Q63630439: 'As Bruxas',
  Q65058737: 'O Caso de Richard Jewell',
  Q65768589: 'Shang-Chi e a Lenda dos Dez Anéis',
  Q83808444: 'Tudo em Todo o Lado ao Mesmo Tempo',
  Q84693711: 'A Tragédia de Macbeth',
  Q97288428: 'Os Mauzões',
  Q104845027: 'Estranhamente Vermelho',
  Q105105219: 'Quarteto Fantástico: Primeiros Passos',
  Q105482844: 'Pinóquio',
  Q105806948: 'Napoleão',
  Q107710009: 'Os Fabelmans',
  Q118904382: 'Como Treinares o Teu Dragão',
  Q119549900: 'Jurado N.º 2',
  Q124378349: 'O Robô Selvagem',
  Q125187519: 'Drácula',
  Q125622088: 'Flow',
  Q130268157: 'Guerreiras do K-Pop',
  Q132256832: 'The Dog Stars'
}

/** Names a Portuguese table says that Wikidata does not hold, keyed by entity. */
export const PORTUGUESE_SPOKEN_ALIASES: Readonly<
  Record<string, readonly string[]>
> = {
  Q977: ['Djibouti', 'Jibuti'],
  Q1764: ['Reykjavík'],
  Q2875: ['Gone with the Wind'],
  Q7156: ['FC Barcelona', 'Barça'],
  Q8682: ['Real'],
  Q12418: ['Gioconda', 'A Gioconda'],
  Q15789: ['Bayern'],
  Q17163: ['Cruijff'],
  Q20456: ['Dances with Wolves'],
  Q39444: ['Ronaldinho Gaúcho'],
  Q47703: ['The Godfather'],
  Q81205: ['Megamind'],
  Q86791: ['A Christmas Carol'],
  Q104137: ['Unforgiven'],
  Q105387: ['Dia da Independência'],
  Q109564: ['Rope'],
  Q117464: ['O Gendarme de Saint-Tropez'],
  Q120367: ['Shark Tale'],
  Q126334: ['RC Strasbourg'],
  Q131499: ['Sport Lisboa e Benfica'],
  Q132863: ['Finding Nemo'],
  Q132885: ['Marselha'],
  Q153723: ['Inglourious Basterds'],
  Q154581: ['Gangs of New York'],
  Q157541: ['Os Girassóis'],
  Q163038: ['Psycho'],
  Q163872: ['The Dark Knight'],
  Q164417: ['Corpse Bride'],
  Q165512: ['One Hundred and One Dalmatians'],
  Q167726: ['Jurassic Park'],
  Q172476: ['Girondins de Bordeaux', 'Bordeaux'],
  Q180305: ['Mónaco'],
  Q182218: ['The Avengers'],
  Q187726: ['Monsters, Inc.'],
  Q188439: ['Tangled'],
  Q189505: ['Jaws'],
  Q190765: ['1492'],
  Q190908: ['Seven'],
  Q191843: ['Lens'],
  Q192071: ['Nantes'],
  Q196004: ['From Dusk Till Dawn'],
  Q202548: ['Vertigo'],
  Q206576: ['Hugo'],
  Q207698: ['Kingdom of Heaven'],
  Q208108: ['Catch Me If You Can'],
  Q208592: ['Sleepy Hollow'],
  Q213411: ['Cast Away'],
  Q215365: ['Brother Bear'],
  Q216153: ["A Bug's Life"],
  Q216720: ['The Rock'],
  Q216929: ['Oliver & Company'],
  Q217182: ['Edward Scissorhands'],
  Q218235: ['Charlie and the Chocolate Factory'],
  Q221384: ['Black Hawk Down'],
  Q223163: ["The Emperor's New Groove"],
  Q237222: ['Blood Simple'],
  Q244604: ['Minority Report'],
  Q245227: ['The Prince of Egypt'],
  Q245366: ['Over the Hedge'],
  Q270215: ['Contact'],
  Q278997: ['Big Fish'],
  Q305250: ['Ice Age'],
  Q318766: ['The Terminal'],
  Q323318: ['Dark Shadows'],
  Q326114: ['True Grit'],
  Q334132: ['Rato Basílio'],
  Q379873: ['Roger Rabbit'],
  Q380349: ['Adèle Blanc-Sec'],
  Q381731: ['Burn After Reading'],
  Q392530: ['Treasure Planet'],
  Q399823: ['The Bridges of Madison County'],
  Q429969: ['Insomnia'],
  Q464951: ['Flags of Our Fathers'],
  Q470937: ['O Iluminado'],
  Q474093: ['Millennium'],
  Q495850: ['The Croods'],
  Q496255: ['Dial M for Murder'],
  Q497311: ['Spellbound'],
  Q499639: ['Strangers on a Train'],
  Q501105: ['The 39 Steps'],
  Q501874: ['O Brother, Where Art Thou?'],
  Q501995: ['Cape Fear'],
  Q502629: ['Romancing the Stone'],
  Q517239: ['Le Grand Bleu'],
  Q529207: ['Ronaldo Fenómeno'],
  Q550232: ['Arthur et les Minimoys'],
  Q570481: ['What Lies Beneath'],
  Q583407: ['Duel'],
  Q587419: ['Notorious'],
  Q610502: ['Antz'],
  Q622769: ['Man of Steel'],
  Q627333: ['The Time Machine'],
  Q640547: ['Universal Soldier'],
  Q641315: ['Spirit'],
  Q643203: ["George's Marvellous Medicine", 'O Remédio Maravilhoso do Jorge'],
  Q670439: ['Raising Arizona'],
  Q681918: ['Monsters vs. Aliens'],
  Q705247: ['La Folie des grandeurs'],
  Q723020: ['11/22/63'],
  Q723187: ['The Game'],
  Q741042: ['Panic Room'],
  Q741196: ['Heartbreak Ridge'],
  Q742226: ['Pet Sematary'],
  Q747936: ['Paths of Glory'],
  Q750117: ['Intolerable Cruelty'],
  Q785461: ['Sudden Impact'],
  Q835739: ['Cão Raivoso'],
  Q846209: ['After Hours'],
  Q851095: ['Lock, Stock and Two Smoking Barrels'],
  Q906705: ['High Plains Drifter'],
  Q913440: ["The Man Who Wasn't There"],
  Q980041: ['The Adventures of Tintin'],
  Q1137310: ['Death Proof'],
  Q1140257: ["Jeanne d'Arc"],
  Q1160186: ['Death Becomes Her'],
  Q1170032: ['Au Bonheur des Dames'],
  Q1197590: ["L'Assommoir"],
  Q1210863: ['Rabbi Jacob', 'Rabi Jacob'],
  Q1217792: ['The Twits'],
  Q1476462: ['The BFG'],
  Q2320903: ['Fantastic Mr Fox'],
  Q2340655: ['Inside Llewyn Davis'],
  Q2350772: ['White House Down'],
  Q3231725: ['Les Contemplations'],
  Q3231771: ['Campo de Papoilas'],
  Q3404003: ['Prisoners'],
  Q5887360: ['Guardians of the Galaxy'],
  Q7737199: ['The Good Dinosaur'],
  Q14920425: ['Gone Girl'],
  Q15068238: ['Kingsman'],
  Q16970789: ['American Sniper'],
  Q18155726: ['Finders Keepers', 'Achados e Perdidos'],
  Q18516636: ['Hail, Caesar!'],
  Q18647981: ['Moana'],
  Q18811634: ['Silence'],
  Q19321019: ['Miss Peregrine'],
  Q19569225: ['King Arthur'],
  Q19896308: ['End of Watch', 'Último Turno'],
  Q20382729: ['Arrival'],
  Q20926273: ['Valérian'],
  Q23781129: ['Captain Marvel'],
  Q29588607: ['Spider-Man: Into the Spider-Verse'],
  Q47300912: ['Once Upon a Time in Hollywood'],
  Q54812267: ['The Mule'],
  Q59690895: ['Onward'],
  Q60614686: ['The Gentlemen: Senhores do Crime'],
  Q60834962: ['Dune'],
  Q61448040: ['Parasite'],
  Q63630439: ['The Witches'],
  Q65058737: ['Richard Jewell'],
  Q65768589: ['Shang-Chi'],
  Q83808444: ['Everything Everywhere All at Once'],
  Q84693711: ['Macbeth'],
  Q97288428: ['The Bad Guys'],
  Q104845027: ['Turning Red'],
  Q105105219: ['The Fantastic Four: First Steps'],
  Q105482844: ['Pinocchio'],
  Q105806948: ['Napoleon'],
  Q107710009: ['The Fabelmans'],
  Q124378349: ['The Wild Robot'],
  Q130268157: ['KPop Demon Hunters']
}

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
      fr: 'Écrit par Tarantino, réalisé par Robert Rodriguez',
      pt: 'Escrito por Tarantino, realizado por Robert Rodriguez'
    }
  },
  {
    blackWord: 'Q91540',
    subject: 'Q8877',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Spielberg, directed by Robert Zemeckis',
      fr: 'Produit par Spielberg, réalisé par Robert Zemeckis',
      pt: 'Produzido por Spielberg, realizado por Robert Zemeckis'
    }
  },
  {
    blackWord: 'Q221113',
    subject: 'Q2001',
    template: 'films-directed-by',
    why: {
      en: 'Developed by Kubrick, directed by Spielberg after his death',
      fr: 'Développé par Kubrick, réalisé par Spielberg après sa mort',
      pt: 'Desenvolvido por Kubrick, realizado por Spielberg após a sua morte'
    }
  },
  {
    blackWord: 'Q739046',
    subject: 'Q7374',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Henri-Georges Clouzot',
      fr: 'Réalisé par Henri-Georges Clouzot',
      pt: 'Realizado por Henri-Georges Clouzot'
    }
  },
  {
    blackWord: 'Q47075',
    subject: 'Q41148',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Brian De Palma',
      fr: 'Réalisé par Brian De Palma',
      pt: 'Realizado por Brian De Palma'
    }
  },
  {
    blackWord: 'Q622769',
    subject: 'Q25191',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Nolan, directed by Zack Snyder',
      fr: 'Produit par Nolan, réalisé par Zack Snyder',
      pt: 'Produzido por Nolan, realizado por Zack Snyder'
    }
  },
  {
    blackWord: 'Q21500755',
    subject: 'Q56005',
    template: 'films-directed-by',
    why: {
      en: 'Produced by Ridley Scott, directed by Denis Villeneuve',
      fr: 'Produit par Ridley Scott, réalisé par Denis Villeneuve',
      pt: 'Produzido por Ridley Scott, realizado por Denis Villeneuve'
    }
  },
  {
    blackWord: 'Q322328',
    subject: 'Q56008',
    template: 'films-directed-by',
    why: {
      en: 'Imagined and produced by Burton, directed by Henry Selick',
      fr: 'Imaginé et produit par Burton, réalisé par Henry Selick',
      pt: 'Imaginado e produzido por Burton, realizado por Henry Selick'
    }
  },
  {
    blackWord: 'Q41483',
    subject: 'Q43203',
    template: 'films-directed-by',
    why: {
      en: 'Eastwood stars, Sergio Leone directs',
      fr: 'Eastwood y joue, Sergio Leone le réalise',
      pt: 'Eastwood é o ator, Sergio Leone o realizador'
    }
  },
  {
    blackWord: 'Q726215',
    subject: 'Q484779',
    template: 'films-directed-by',
    why: {
      en: 'Written and produced by Besson, directed by Gérard Pirès',
      fr: 'Écrit et produit par Besson, réalisé par Gérard Pirès',
      pt: 'Escrito e produzido por Besson, realizado por Gérard Pirès'
    }
  },
  {
    blackWord: 'Q133654',
    subject: 'Q184903',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Jonathan Demme',
      fr: 'Réalisé par Jonathan Demme',
      pt: 'Realizado por Jonathan Demme'
    }
  },
  {
    blackWord: 'Q241958',
    subject: 'Q187364',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Joe Dante, produced by Spielberg',
      fr: 'Réalisé par Joe Dante, produit par Spielberg',
      pt: 'Realizado por Joe Dante, produzido por Spielberg'
    }
  },
  {
    blackWord: 'Q15068238',
    subject: 'Q192990',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Matthew Vaughn, producer of Ritchie’s first films',
      fr: 'Réalisé par Matthew Vaughn, producteur des premiers Ritchie',
      pt: 'Realizado por Matthew Vaughn, produtor dos primeiros Ritchie'
    }
  },
  {
    blackWord: 'Q184843',
    subject: 'Q548823',
    template: 'films-directed-by',
    why: {
      en: 'Ridley Scott’s original; Villeneuve directed the 2049 sequel',
      fr: 'L’original de Ridley Scott ; Villeneuve a réalisé la suite, 2049',
      pt: 'O original de Ridley Scott; Villeneuve realizou a sequela, 2049'
    }
  },
  {
    blackWord: 'Q117464',
    subject: 'Q470798',
    template: 'films-directed-by',
    why: {
      en: 'De Funès stars, Jean Girault directs',
      fr: 'Avec de Funès, mais réalisé par Jean Girault',
      pt: 'Com Louis de Funès, mas realizado por Jean Girault'
    }
  },
  {
    blackWord: 'Q778696',
    subject: 'Q358356',
    template: 'films-directed-by',
    why: {
      en: 'Co-written by Veber, directed by Édouard Molinaro',
      fr: 'Coécrit par Veber, réalisé par Édouard Molinaro',
      pt: 'Coescrito por Veber, realizado por Édouard Molinaro'
    }
  },
  {
    blackWord: 'Q105387',
    subject: 'Q59259',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Roland Emmerich',
      fr: 'Réalisé par Roland Emmerich',
      pt: 'Realizado por Roland Emmerich'
    }
  },
  {
    blackWord: 'Q208344',
    subject: 'Q60100',
    template: 'films-directed-by',
    why: {
      en: 'Directed by Michael Bay',
      fr: 'Réalisé par Michael Bay',
      pt: 'Realizado por Michael Bay'
    }
  },
  {
    blackWord: 'Q483815',
    labels: {
      en: 'Pixar films',
      fr: 'Les films Pixar',
      pt: 'Os filmes da Pixar'
    },
    neighbour: 'Q191224',
    subject: 'Q127552',
    template: 'films-of-studio',
    why: {
      en: 'A DreamWorks Animation film',
      fr: 'Un film DreamWorks Animation',
      pt: 'Um filme da DreamWorks Animation'
    }
  },
  {
    blackWord: 'Q305250',
    labels: {
      en: 'DreamWorks Animation films',
      fr: 'Les films DreamWorks Animation',
      pt: 'Os filmes da DreamWorks Animation'
    },
    subject: 'Q500088',
    template: 'films-of-studio',
    why: {
      en: 'Made by Blue Sky Studios',
      fr: 'Un film des studios Blue Sky',
      pt: 'Um filme dos estúdios Blue Sky'
    }
  },
  {
    blackWord: 'Q486609',
    labels: {
      en: 'Walt Disney Animation Studios films',
      fr: 'Les films de Walt Disney Animation Studios',
      pt: 'Os filmes dos Walt Disney Animation Studios'
    },
    subject: 'Q1047410',
    template: 'films-of-studio',
    why: {
      en: 'Made by Don Bluth for 20th Century Fox',
      fr: 'Réalisé par Don Bluth pour la 20th Century Fox',
      pt: 'Realizado por Don Bluth para a 20th Century Fox'
    }
  },
  {
    blackWord: 'Q19347291',
    labels: {
      en: 'Marvel Studios films',
      fr: 'Les films Marvel Studios',
      pt: 'Os filmes da Marvel Studios'
    },
    subject: 'Q367466',
    template: 'films-of-studio',
    why: {
      en: 'Made by 20th Century Fox; only Deadpool & Wolverine is Marvel Studios',
      fr: 'Produit par la 20th Century Fox ; seul Deadpool & Wolverine est un Marvel Studios',
      pt: 'Produzido pela 20th Century Fox; só Deadpool & Wolverine é da Marvel Studios'
    }
  },
  {
    blackWord: 'Q333266',
    labels: {
      en: 'Albums by the Beatles',
      fr: 'Les albums des Beatles',
      pt: 'Os álbuns dos Beatles'
    },
    subject: 'Q1299',
    template: 'albums-by-band',
    why: {
      en: 'John Lennon’s solo album',
      fr: 'Un album solo de John Lennon',
      pt: 'Um álbum a solo de John Lennon'
    }
  },
  {
    blackWord: 'Q145',
    labels: {
      en: 'Member states of the European Union',
      fr: 'Les États membres de l’Union européenne',
      pt: 'Os Estados-membros da União Europeia'
    },
    subject: 'Q458',
    template: 'members-of',
    why: {
      en: 'Left the European Union in 2020',
      fr: 'A quitté l’Union européenne en 2020',
      pt: 'Saiu da União Europeia em 2020'
    }
  },
  {
    blackWord: 'Q29',
    labels: {
      en: 'Members of the G20',
      fr: 'Les pays membres du G20',
      pt: 'Os países membros do G20'
    },
    subject: 'Q19771',
    template: 'members-of',
    why: {
      en: 'A permanent guest, not a member',
      fr: 'Invitée permanente, pas membre',
      pt: 'Convidada permanente, não membro'
    }
  },
  {
    blackWord: 'Q262',
    subject: 'Q150',
    template: 'countries-speaking',
    why: {
      en: 'Widely spoken, but only Arabic and Tamazight are official',
      fr: 'Très parlé, mais seuls l’arabe et le tamazight sont officiels',
      pt: 'Muito falado, mas só o árabe e o tamazigue são oficiais'
    }
  },
  {
    blackWord: 'Q36301',
    labels: {
      en: 'Winners of the Academy Award for Best Actress',
      fr: "Les lauréates de l'Oscar de la meilleure actrice",
      pt: 'As vencedoras do Óscar de melhor atriz'
    },
    subject: 'Q103618',
    template: 'award-winning-people',
    why: {
      en: 'Won best supporting actress, never best actress',
      fr: 'Oscar du second rôle, jamais de la meilleure actrice',
      pt: 'Óscar de atriz secundária, nunca de melhor atriz'
    }
  },
  {
    blackWord: 'Q45901',
    labels: {
      en: "Ballon d'Or winners",
      fr: "Les lauréats du Ballon d'or",
      pt: 'Os vencedores da Bola de Ouro'
    },
    subject: 'Q166177',
    template: 'award-winners',
    why: {
      en: 'Runner-up in 2003, never won',
      fr: 'Deuxième en 2003, jamais lauréat',
      pt: 'Segundo em 2003, nunca venceu'
    }
  },
  {
    blackWord: 'Q8701',
    labels: {
      en: 'UEFA Champions League winners',
      fr: 'Les vainqueurs de la Ligue des champions',
      pt: 'Os vencedores da Liga dos Campeões'
    },
    neighbour: 'Q18760',
    subject: 'Q18756',
    template: 'competition-winners',
    why: {
      en: 'Three finals, three defeats',
      fr: 'Trois finales, trois défaites',
      pt: 'Três finais, três derrotas'
    }
  },
  {
    blackWord: 'Q19509',
    labels: {
      en: 'French football champions',
      fr: 'Les clubs champions de France de football',
      pt: 'Os clubes campeões de França de futebol'
    },
    neighbour: 'Q193121',
    subject: 'Q13394',
    template: 'competition-winners',
    why: {
      en: 'Never champion of France',
      fr: 'Jamais champion de France',
      pt: 'Nunca foi campeão de França'
    }
  },
  {
    blackWord: 'Q12959',
    labels: {
      en: 'Presidents of the French Republic',
      fr: 'Les présidents de la République française',
      pt: 'Os presidentes da República Francesa'
    },
    neighbour: 'Q1587677',
    subject: 'Q191954',
    template: 'position-holders',
    why: {
      en: 'Prime minister, beaten in the 1995 election',
      fr: 'Premier ministre, battu à la présidentielle de 1995',
      pt: 'Primeiro-ministro, derrotado nas presidenciais de 1995'
    }
  },
  {
    blackWord: 'Q34969',
    labels: {
      en: 'Presidents of the United States',
      fr: 'Les présidents des États-Unis',
      pt: 'Os presidentes dos Estados Unidos'
    },
    neighbour: 'Q11699',
    subject: 'Q11696',
    template: 'position-holders',
    why: {
      en: 'A Founding Father, never president',
      fr: 'Père fondateur, jamais président',
      pt: 'Pai fundador, nunca presidente'
    }
  },
  {
    blackWord: 'Q191838',
    labels: {
      en: 'Works by Victor Hugo',
      fr: 'Les œuvres de Victor Hugo',
      pt: 'As obras de Victor Hugo'
    },
    subject: 'Q535',
    template: 'books-by-author',
    why: {
      en: 'A novel by Alexandre Dumas',
      fr: "Un roman d'Alexandre Dumas",
      pt: 'Um romance de Alexandre Dumas'
    }
  },
  {
    blackWord: 'Q339761',
    labels: {
      en: 'Books by Émile Zola',
      fr: "Les livres d'Émile Zola",
      pt: 'Os livros de Émile Zola'
    },
    subject: 'Q504',
    template: 'books-by-author',
    why: {
      en: 'A novel by Guy de Maupassant',
      fr: 'Un roman de Guy de Maupassant',
      pt: 'Um romance de Guy de Maupassant'
    }
  },
  {
    blackWord: 'Q627333',
    subject: 'Q33977',
    template: 'books-by-author',
    why: {
      en: 'A novel by H. G. Wells',
      fr: 'Un roman de H. G. Wells',
      pt: 'Um romance de H. G. Wells'
    }
  },
  {
    blackWord: 'Q45192',
    labels: {
      en: 'Books by Agatha Christie',
      fr: "Les livres d'Agatha Christie",
      pt: 'Os livros de Agatha Christie'
    },
    subject: 'Q35064',
    template: 'books-by-author',
    why: {
      en: 'A novel by Arthur Conan Doyle',
      fr: "Un roman d'Arthur Conan Doyle",
      pt: 'Um romance de Arthur Conan Doyle'
    }
  },
  {
    blackWord: 'Q1193210',
    subject: 'Q39829',
    template: 'books-by-author',
    why: {
      en: 'A novel by William Peter Blatty',
      fr: 'Un roman de William Peter Blatty',
      pt: 'Um romance de William Peter Blatty'
    }
  },
  {
    blackWord: 'Q471379',
    subject: 'Q5582',
    template: 'paintings-by',
    why: {
      en: 'A painting by Edvard Munch',
      fr: "Un tableau d'Edvard Munch",
      pt: 'Um quadro de Edvard Munch'
    }
  },
  {
    blackWord: 'Q151047',
    subject: 'Q762',
    template: 'paintings-by',
    why: {
      en: 'A painting by Botticelli',
      fr: 'Un tableau de Botticelli',
      pt: 'Um quadro de Botticelli'
    }
  },
  {
    blackWord: 'Q737062',
    sameThing: [['Q1189907', 'Q3220338']],
    subject: 'Q296',
    template: 'paintings-by',
    why: {
      en: 'A painting by Édouard Manet',
      fr: "Un tableau d'Édouard Manet",
      pt: 'Um quadro de Édouard Manet'
    }
  },
  {
    blackWord: 'Q219831',
    subject: 'Q41264',
    template: 'paintings-by',
    why: {
      en: 'A painting by Rembrandt',
      fr: 'Un tableau de Rembrandt',
      pt: 'Um quadro de Rembrandt'
    }
  },
  {
    blackWord: 'Q55452801',
    labels: {
      en: 'Characters of Game of Thrones',
      fr: 'Les personnages de Game of Thrones',
      pt: 'As personagens de A Guerra dos Tronos'
    },
    subject: 'Q23572',
    template: 'characters-of-work',
    why: {
      en: 'A character of House of the Dragon',
      fr: 'Un personnage de House of the Dragon',
      pt: 'Uma personagem de House of the Dragon'
    }
  },
  {
    blackWord: 'Q46302',
    labels: {
      en: 'Characters of The Lord of the Rings',
      fr: 'Les personnages du Seigneur des anneaux',
      pt: 'As personagens de O Senhor dos Anéis'
    },
    subject: 'Q15228',
    template: 'characters-of-work',
    why: {
      en: 'The dragon of The Hobbit',
      fr: 'Le dragon du Hobbit',
      pt: 'O dragão de O Hobbit'
    }
  },
  {
    blackWord: 'Q1142',
    labels: {
      en: 'Regions of France',
      fr: 'Les régions de France',
      pt: 'As regiões de França'
    },
    neighbour: 'Q36784',
    subject: 'Q142',
    template: 'subdivisions-of',
    why: {
      en: 'Merged into Grand Est in 2016',
      fr: 'Fondue dans le Grand Est en 2016',
      pt: 'Fundida no Grande Leste em 2016'
    }
  },
  {
    blackWord: 'Q1183',
    labels: {
      en: 'States of the United States',
      fr: 'Les États des États-Unis',
      pt: 'Os estados dos Estados Unidos'
    },
    neighbour: 'Q35657',
    subject: 'Q30',
    template: 'subdivisions-of',
    why: {
      en: 'A territory, not a state',
      fr: 'Un territoire, pas un État',
      pt: 'Um território, não um estado'
    }
  },
  {
    blackWord: 'Q25188',
    labels: {
      en: 'Winners of the Academy Award for Best Picture',
      fr: "Les films lauréats de l'Oscar du meilleur film",
      pt: 'Os filmes vencedores do Óscar de melhor filme'
    },
    subject: 'Q102427',
    template: 'award-winning-films',
    why: {
      en: 'Nominated in 2011, lost to The King’s Speech',
      fr: 'Nommé en 2011, battu par Le Discours d’un roi',
      pt: 'Nomeado em 2011, perdeu para O Discurso do Rei'
    }
  },
  {
    blackWord: 'Q175535',
    labels: {
      en: 'Winners of the Academy Award for Best Actor',
      fr: "Les lauréats de l'Oscar du meilleur acteur",
      pt: 'Os vencedores do Óscar de melhor ator'
    },
    subject: 'Q103916',
    template: 'award-winning-people',
    why: {
      en: 'An Oscar for writing Good Will Hunting, never best actor',
      fr: 'Un Oscar du scénario pour Will Hunting, jamais du meilleur acteur',
      pt: 'Óscar de argumento por O Bom Rebelde, nunca de melhor ator'
    }
  },
  {
    blackWord: 'Q517',
    labels: {
      en: 'Kings of France',
      fr: 'Les rois de France',
      pt: 'Os reis de França'
    },
    neighbour: 'Q191954',
    subject: 'Q18384454',
    template: 'position-holders',
    why: {
      en: 'An emperor, never a king',
      fr: 'Empereur, jamais roi',
      pt: 'Imperador, nunca rei'
    }
  },
  {
    blackWord: 'Q18067135',
    labels: {
      en: 'Films directed by the Coen brothers',
      fr: 'Les films réalisés par les frères Coen',
      pt: 'Os filmes realizados pelos irmãos Coen'
    },
    subject: 'Q13595311',
    template: 'films-directed-by',
    why: {
      en: 'Written by the Coens, directed by Spielberg',
      fr: 'Écrit par les Coen, réalisé par Spielberg',
      pt: 'Escrito pelos Coen, realizado por Spielberg'
    }
  },
  {
    blackWord: 'Q1940145',
    subject: 'Q25161',
    template: 'books-by-author',
    why: {
      en: 'A novel by Ian Fleming; Dahl only wrote the film’s screenplay',
      fr: 'Un roman de Ian Fleming ; Dahl n’a écrit que le scénario du film',
      pt: 'Um romance de Ian Fleming; Dahl só escreveu o argumento do filme'
    }
  },
  {
    blackWord: 'Q182153',
    labels: {
      en: 'Winners of the Academy Award for Best Animated Feature',
      fr: 'Les films lauréats de l’Oscar du meilleur film d’animation',
      pt: 'Os filmes vencedores do Óscar de melhor filme de animação'
    },
    subject: 'Q106800',
    template: 'award-winning-films',
    why: {
      en: 'Nominated in 2007, lost to Happy Feet',
      fr: 'Nommé en 2007, battu par Happy Feet',
      pt: 'Nomeado em 2007, perdeu para Happy Feet'
    }
  },
  {
    blackWord: 'Q72',
    countries: countriesIn('150'),
    labels: {
      en: 'Capitals of Europe',
      fr: 'Les capitales d’Europe',
      pt: 'As capitais da Europa'
    },
    subject: 'europe',
    template: 'capitals-of',
    why: {
      en: 'Switzerland’s largest city; its capital is Bern',
      fr: 'La plus grande ville de Suisse ; sa capitale est Berne',
      pt: 'A maior cidade da Suíça; a capital é Berna'
    }
  },
  {
    blackWord: 'Q71',
    countries: countriesIn('155'),
    labels: {
      en: 'Capitals of Western Europe',
      fr: 'Les capitales d’Europe de l’Ouest',
      pt: 'As capitais da Europa Ocidental'
    },
    subject: 'western-europe',
    template: 'capitals-of',
    why: {
      en: 'Home to the UN in Europe, but Switzerland’s capital is Bern',
      fr: 'Siège de l’ONU en Europe, mais la capitale suisse est Berne',
      pt: 'Sede da ONU na Europa, mas a capital suíça é Berna'
    }
  },
  {
    blackWord: 'Q25287',
    countries: countriesIn('154'),
    labels: {
      en: 'Capitals of Northern Europe',
      fr: 'Les capitales d’Europe du Nord',
      pt: 'As capitais da Europa do Norte'
    },
    subject: 'northern-europe',
    template: 'capitals-of',
    why: {
      en: 'Sweden’s second city; its capital is Stockholm',
      fr: 'La deuxième ville de Suède ; sa capitale est Stockholm',
      pt: 'A segunda cidade da Suécia; a capital é Estocolmo'
    }
  },
  {
    blackWord: 'Q490',
    countries: countriesIn('039'),
    labels: {
      en: 'Capitals of Southern Europe',
      fr: 'Les capitales d’Europe du Sud',
      pt: 'As capitais da Europa do Sul'
    },
    subject: 'southern-europe',
    template: 'capitals-of',
    why: {
      en: 'Italy’s business capital; its capital is Rome',
      fr: 'La capitale économique de l’Italie ; sa capitale est Rome',
      pt: 'A capital económica de Itália; a capital é Roma'
    }
  },
  {
    blackWord: 'Q656',
    countries: countriesIn('151'),
    labels: {
      en: 'Capitals of Eastern Europe',
      fr: 'Les capitales d’Europe de l’Est',
      pt: 'As capitais da Europa de Leste'
    },
    subject: 'eastern-europe',
    template: 'capitals-of',
    why: {
      en: 'Russia’s capital until 1918; Moscow since',
      fr: 'Capitale de la Russie jusqu’en 1918 ; Moscou depuis',
      pt: 'Capital da Rússia até 1918; Moscovo desde então'
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
      fr: 'Les capitales des pays frontaliers de la France',
      pt: 'As capitais dos países que fazem fronteira com França'
    },
    subject: 'bordering-france',
    template: 'capitals-of',
    why: {
      en: 'On the French border, but Switzerland’s capital is Bern',
      fr: 'À la frontière française, mais la capitale suisse est Berne',
      pt: 'Na fronteira francesa, mas a capital suíça é Berna'
    }
  }
]
