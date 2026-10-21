import type { GeoPoint } from '@melee/protocol/worldmap'

import { pickRandom } from '@melee/core/helpers/random'

/** A city a map round may ask a table to place on the map of France. */
export type BankedCity = { name: string; point: GeoPoint }

/**
 * Every prefecture of metropolitan France, and the towns a table knows without
 * being one: ports, resorts, the second city of a department. Three of Paris'
 * inner ring are left out — Nanterre, Bobigny and Créteil are each on Paris at
 * this map's scale, and a city that pays for placing Paris asks nothing.
 * Coordinates are the town hall's, to a few hundred metres.
 */
const CITIES: readonly (readonly [
  name: string,
  latitude: number,
  longitude: number
])[] = [
  // Prefectures
  ['Bourg-en-Bresse', 46.205, 5.226],
  ['Laon', 49.564, 3.62],
  ['Moulins', 46.566, 3.333],
  ['Digne-les-Bains', 44.092, 6.236],
  ['Gap', 44.559, 6.079],
  ['Nice', 43.71, 7.262],
  ['Privas', 44.735, 4.599],
  ['Charleville-Mézières', 49.762, 4.726],
  ['Foix', 42.965, 1.607],
  ['Troyes', 48.297, 4.074],
  ['Carcassonne', 43.213, 2.349],
  ['Rodez', 44.35, 2.575],
  ['Marseille', 43.296, 5.37],
  ['Caen', 49.183, -0.371],
  ['Aurillac', 44.926, 2.44],
  ['Angoulême', 45.649, 0.156],
  ['La Rochelle', 46.16, -1.151],
  ['Bourges', 47.081, 2.399],
  ['Tulle', 45.267, 1.77],
  ['Ajaccio', 41.919, 8.739],
  ['Bastia', 42.697, 9.451],
  ['Dijon', 47.322, 5.041],
  ['Saint-Brieuc', 48.514, -2.765],
  ['Guéret', 46.171, 1.871],
  ['Périgueux', 45.184, 0.721],
  ['Besançon', 47.238, 6.024],
  ['Valence', 44.933, 4.892],
  ['Évreux', 49.027, 1.151],
  ['Chartres', 48.446, 1.489],
  ['Quimper', 47.996, -4.102],
  ['Nîmes', 43.837, 4.36],
  ['Toulouse', 43.605, 1.444],
  ['Auch', 43.646, 0.586],
  ['Bordeaux', 44.838, -0.579],
  ['Montpellier', 43.611, 3.877],
  ['Rennes', 48.117, -1.678],
  ['Châteauroux', 46.811, 1.686],
  ['Tours', 47.394, 0.685],
  ['Grenoble', 45.188, 5.725],
  ['Lons-le-Saunier', 46.675, 5.556],
  ['Mont-de-Marsan', 43.89, -0.5],
  ['Blois', 47.586, 1.336],
  ['Saint-Étienne', 45.44, 4.387],
  ['Le Puy-en-Velay', 45.043, 3.885],
  ['Nantes', 47.218, -1.554],
  ['Orléans', 47.903, 1.909],
  ['Cahors', 44.448, 1.441],
  ['Agen', 44.203, 0.616],
  ['Mende', 44.518, 3.5],
  ['Angers', 47.478, -0.563],
  ['Saint-Lô', 49.116, -1.091],
  ['Châlons-en-Champagne', 48.957, 4.363],
  ['Chaumont', 48.111, 5.139],
  ['Laval', 48.073, -0.77],
  ['Nancy', 48.692, 6.184],
  ['Bar-le-Duc', 48.773, 5.16],
  ['Vannes', 47.658, -2.76],
  ['Metz', 49.12, 6.176],
  ['Nevers', 46.99, 3.159],
  ['Lille', 50.629, 3.057],
  ['Beauvais', 49.43, 2.081],
  ['Alençon', 48.432, 0.091],
  ['Arras', 50.291, 2.777],
  ['Clermont-Ferrand', 45.778, 3.087],
  ['Pau', 43.295, -0.371],
  ['Tarbes', 43.233, 0.078],
  ['Perpignan', 42.699, 2.895],
  ['Strasbourg', 48.573, 7.752],
  ['Colmar', 48.079, 7.358],
  ['Lyon', 45.764, 4.836],
  ['Vesoul', 47.622, 6.155],
  ['Mâcon', 46.307, 4.828],
  ['Le Mans', 48.006, 0.199],
  ['Chambéry', 45.564, 5.918],
  ['Annecy', 45.9, 6.129],
  ['Paris', 48.857, 2.352],
  ['Rouen', 49.443, 1.1],
  ['Melun', 48.54, 2.66],
  ['Versailles', 48.805, 2.12],
  ['Niort', 46.323, -0.465],
  ['Amiens', 49.894, 2.296],
  ['Albi', 43.929, 2.148],
  ['Montauban', 44.018, 1.355],
  ['Toulon', 43.124, 5.928],
  ['Avignon', 43.949, 4.806],
  ['La Roche-sur-Yon', 46.67, -1.426],
  ['Poitiers', 46.58, 0.34],
  ['Limoges', 45.834, 1.261],
  ['Épinal', 48.173, 6.45],
  ['Auxerre', 47.798, 3.567],
  ['Belfort', 47.64, 6.863],
  ['Évry-Courcouronnes', 48.629, 2.441],
  ['Cergy', 49.036, 2.063],
  // Towns a table knows
  ['Le Havre', 49.494, 0.108],
  ['Brest', 48.39, -4.486],
  ['Reims', 49.258, 4.032],
  ['Mulhouse', 47.75, 7.336],
  ['Dunkerque', 51.034, 2.377],
  ['Calais', 50.951, 1.858],
  ['Boulogne-sur-Mer', 50.726, 1.614],
  ['Cherbourg', 49.64, -1.616],
  ['Saint-Malo', 48.649, -2.026],
  ['Lorient', 47.748, -3.37],
  ['Saint-Nazaire', 47.273, -2.214],
  ['Biarritz', 43.483, -1.559],
  ['Aix-en-Provence', 43.53, 5.447],
  ['Cannes', 43.552, 7.017],
  ['Arles', 43.677, 4.63],
  ['Béziers', 43.344, 3.216],
  ['Narbonne', 43.184, 3.004],
  ['Sète', 43.403, 3.697],
  ['Vichy', 46.128, 3.426],
  ['Chamonix', 45.924, 6.869],
  ['Lourdes', 43.095, -0.046],
  ['Saint-Tropez', 43.273, 6.639],
  ['Arcachon', 44.658, -1.168],
  ['Cognac', 45.696, -0.329],
  ['Épernay', 49.04, 3.959],
  ['Verdun', 49.16, 5.384],
  ['Saint-Quentin', 49.848, 3.287],
  ['Valenciennes', 50.358, 3.523],
  ['Briançon', 44.899, 6.643],
  ['Royan', 45.624, -1.029],
  ['Les Sables-d’Olonne', 46.497, -1.783],
  ['Dieppe', 49.922, 1.078],
  ['Deauville', 49.357, 0.07],
  ['Calvi', 42.567, 8.757],
  ['Porto-Vecchio', 41.591, 9.279],
  ['Bonifacio', 41.387, 9.159],
  ['Menton', 43.775, 7.497],
  ['Albertville', 45.676, 6.392],
  ['Montluçon', 46.34, 2.603],
  ['Roanne', 46.036, 4.068],
  ['Thionville', 49.358, 6.168],
  ['Rochefort', 45.937, -0.961],
  ['Saumur', 47.26, -0.077],
  ['Fontainebleau', 48.405, 2.701]
]

export const BANKED_CITIES: readonly BankedCity[] = CITIES.map(
  ([name, latitude, longitude]) => ({ name, point: { latitude, longitude } })
)

/** The id a played city takes in the room's no-repeat set, beside the countries. */
export const playedCityId = (name: string): string => `worldmap:city:${name}`

/** A city the room has not been asked yet, or `null` once it has placed them all. */
export const drawCity = ({
  playedIds
}: {
  playedIds: ReadonlySet<string>
}): BankedCity | null =>
  pickRandom(
    BANKED_CITIES.filter((city) => !playedIds.has(playedCityId(city.name)))
  )
