import type { QuantityFamily } from '@melee/protocol/estimate'

import { BANKED_CITIES } from './city-bank'

const FAMOUS_COUNTRIES = [
  'France',
  'Allemagne',
  'Espagne',
  'Italie',
  'Royaume-Uni',
  'Belgique',
  'Suisse',
  'Portugal',
  'Pays-Bas',
  'Irlande',
  'Grèce',
  'Pologne',
  'Suède',
  'Norvège',
  'Danemark',
  'Finlande',
  'Autriche',
  'Russie',
  'Ukraine',
  'Turquie',
  'États-Unis',
  'Canada',
  'Mexique',
  'Brésil',
  'Argentine',
  'Chili',
  'Pérou',
  'Colombie',
  'Chine',
  'Japon',
  'Inde',
  'Corée du Sud',
  'Indonésie',
  'Thaïlande',
  'Vietnam',
  'Australie',
  'Nouvelle-Zélande',
  'Égypte',
  'Maroc',
  'Algérie',
  'Tunisie',
  'Afrique du Sud',
  'Sénégal',
  'Nigeria',
  'Arabie saoudite',
  'Iran',
  'Cuba',
  'Islande',
  'Luxembourg'
]

/** The thirteen regions of metropolitan France, which a French table names without thinking. */
const METROPOLITAN_REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur"
]

/**
 * The French towns the map of France already reads as everyone's — its own
 * `easy` tier — so a town is famous in the same way in both games.
 */
const FRENCH_TOWNS_EVERYONE_KNOWS: ReadonlySet<string> = new Set(
  BANKED_CITIES.filter(({ tier }) => tier === 'easy').map(({ name }) => name)
)

const FAMILIES_OF_TOWNS: ReadonlySet<QuantityFamily> = new Set([
  'area.city',
  'population.city'
])

/**
 * The rows a French table has heard of *and could rank*, by their French name,
 * picked by hand. The bank's `isWellKnown` is a traffic threshold, and every
 * country and three hundred cities clear it: Gabon against Gambia passed for
 * well known, and nobody at the table could say which is larger.
 */
export const FAMOUS_QUANTITY_NAMES: Record<QuantityFamily, readonly string[]> =
  {
    'area.city': [],
    'area.country': FAMOUS_COUNTRIES,
    'area.department': [],
    'area.region': METROPOLITAN_REGIONS,
    'elevation.mountain': [
      'Everest',
      'K2',
      'mont Blanc',
      'Cervin',
      'mont Fuji',
      'Etna',
      'Vésuve',
      'Mont Ventoux',
      'Aconcagua',
      'Mauna Kea',
      'Elbrouz',
      'mont Olympe',
      'Teide',
      'Denali',
      'mont Sinaï',
      'Piton de la Fournaise',
      'montagne Pelée',
      'Ben Nevis',
      'pic du Midi de Bigorre',
      'aiguille du Midi',
      'pic du Canigou',
      'Grand Ballon',
      'Monte Cinto',
      'mont Ararat'
    ],
    'height.building': [
      'tour Eiffel',
      'statue de la Liberté',
      'Tour Montparnasse',
      'Burj Khalifa',
      'Empire State Building',
      'One World Trade Center',
      'Chrysler Building',
      'tour CN',
      'The Shard',
      'tours Petronas',
      'Taipei 101',
      'Tokyo Skytree',
      'arche de la Défense',
      'Space Needle',
      'Shanghai Tower',
      'Burj-Al-Arab',
      'tour First'
    ],
    'length.river': [
      'Seine',
      'Loire',
      'Rhône',
      'Garonne',
      'Rhin',
      'Danube',
      'Nil',
      'Amazone',
      'Mississippi',
      'Tamise',
      'Meuse',
      'Moselle',
      'Dordogne',
      'Saône',
      'Marne',
      'Volga',
      'Gange',
      'Mékong',
      'Congo',
      'Tage',
      'Pô',
      'Elbe',
      'Yangzi Jiang',
      'fleuve Saint-Laurent',
      'Jourdain',
      'Tibre',
      'Escaut',
      'Niger',
      'Euphrate'
    ],
    'population.city': [
      'Paris',
      'Marseille',
      'Lyon',
      'Toulouse',
      'Nice',
      'Nantes',
      'Strasbourg',
      'Montpellier',
      'Bordeaux',
      'Lille',
      'Rennes',
      'Reims',
      'Le Havre',
      'Grenoble',
      'Dijon',
      'Brest',
      'Tours',
      'Londres',
      'Berlin',
      'Rome',
      'Barcelone',
      'Amsterdam',
      'Vienne',
      'Prague',
      'Moscou',
      'Istanbul',
      'Athènes',
      'Munich',
      'Milan',
      'Naples',
      'Copenhague',
      'Stockholm',
      'Dublin',
      'New York',
      'Chicago',
      'San Francisco',
      'Montréal',
      'Québec',
      'Toronto',
      'Mexico',
      'Rio de Janeiro',
      'São Paulo',
      'Tokyo',
      'Pékin',
      'Shanghaï',
      'Hong Kong',
      'Séoul',
      'Bangkok',
      'Singapour',
      'Sydney',
      'Le Caire',
      'Casablanca',
      'Alger',
      'Tunis',
      'Dakar',
      'Dubaï',
      'Bombay',
      'Delhi'
    ],
    'population.country': FAMOUS_COUNTRIES,
    'population.department': [],
    'population.region': METROPOLITAN_REGIONS
  }

export const isFamousQuantity = ({
  family,
  names
}: {
  family: QuantityFamily
  names: { fr: string }
}): boolean =>
  FAMOUS_QUANTITY_NAMES[family].includes(names.fr) ||
  (FAMILIES_OF_TOWNS.has(family) && FRENCH_TOWNS_EVERYONE_KNOWS.has(names.fr))
