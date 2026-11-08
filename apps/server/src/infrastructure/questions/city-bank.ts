import type { GeoPoint } from '@melee/protocol/atlas'
import type { Difficulty } from '@melee/protocol/difficulty'

import {
  type ContentTier,
  drawByDifficulty
} from '@melee/core/round/difficulty-draw'

/** A city a map round may ask a table to place on the map of France. */
export type BankedCity = { name: string; point: GeoPoint; tier: ContentTier }

/**
 * Every prefecture of metropolitan France, and the towns a table knows without
 * being one: ports, resorts, the second city of a department. Three of Paris'
 * inner ring are left out — Nanterre, Bobigny and Créteil are each on Paris at
 * this map's scale, and a city that pays for placing Paris asks nothing.
 * Coordinates are the town hall's, to a few hundred metres. The tier is read
 * by hand off a French table: the big cities and the resorts everyone has
 * been to are `easy`, the small prefectures `hard`.
 */
const CITIES: readonly (readonly [
  name: string,
  latitude: number,
  longitude: number,
  tier: ContentTier
])[] = [
  // Prefectures
  ['Bourg-en-Bresse', 46.205, 5.226, 'hard'],
  ['Laon', 49.564, 3.62, 'hard'],
  ['Moulins', 46.566, 3.333, 'hard'],
  ['Digne-les-Bains', 44.092, 6.236, 'hard'],
  ['Gap', 44.559, 6.079, 'hard'],
  ['Nice', 43.71, 7.262, 'easy'],
  ['Privas', 44.735, 4.599, 'hard'],
  ['Charleville-Mézières', 49.762, 4.726, 'hard'],
  ['Foix', 42.965, 1.607, 'hard'],
  ['Troyes', 48.297, 4.074, 'medium'],
  ['Carcassonne', 43.213, 2.349, 'medium'],
  ['Rodez', 44.35, 2.575, 'hard'],
  ['Marseille', 43.296, 5.37, 'easy'],
  ['Caen', 49.183, -0.371, 'easy'],
  ['Aurillac', 44.926, 2.44, 'hard'],
  ['Angoulême', 45.649, 0.156, 'medium'],
  ['La Rochelle', 46.16, -1.151, 'easy'],
  ['Bourges', 47.081, 2.399, 'hard'],
  ['Tulle', 45.267, 1.77, 'hard'],
  ['Ajaccio', 41.919, 8.739, 'easy'],
  ['Bastia', 42.697, 9.451, 'easy'],
  ['Dijon', 47.322, 5.041, 'easy'],
  ['Saint-Brieuc', 48.514, -2.765, 'hard'],
  ['Guéret', 46.171, 1.871, 'hard'],
  ['Périgueux', 45.184, 0.721, 'hard'],
  ['Besançon', 47.238, 6.024, 'easy'],
  ['Valence', 44.933, 4.892, 'medium'],
  ['Évreux', 49.027, 1.151, 'hard'],
  ['Chartres', 48.446, 1.489, 'medium'],
  ['Quimper', 47.996, -4.102, 'medium'],
  ['Nîmes', 43.837, 4.36, 'easy'],
  ['Toulouse', 43.605, 1.444, 'easy'],
  ['Auch', 43.646, 0.586, 'hard'],
  ['Bordeaux', 44.838, -0.579, 'easy'],
  ['Montpellier', 43.611, 3.877, 'easy'],
  ['Rennes', 48.117, -1.678, 'easy'],
  ['Châteauroux', 46.811, 1.686, 'hard'],
  ['Tours', 47.394, 0.685, 'easy'],
  ['Grenoble', 45.188, 5.725, 'easy'],
  ['Lons-le-Saunier', 46.675, 5.556, 'hard'],
  ['Mont-de-Marsan', 43.89, -0.5, 'hard'],
  ['Blois', 47.586, 1.336, 'hard'],
  ['Saint-Étienne', 45.44, 4.387, 'easy'],
  ['Le Puy-en-Velay', 45.043, 3.885, 'hard'],
  ['Nantes', 47.218, -1.554, 'easy'],
  ['Orléans', 47.903, 1.909, 'easy'],
  ['Cahors', 44.448, 1.441, 'hard'],
  ['Agen', 44.203, 0.616, 'hard'],
  ['Mende', 44.518, 3.5, 'hard'],
  ['Angers', 47.478, -0.563, 'easy'],
  ['Saint-Lô', 49.116, -1.091, 'hard'],
  ['Châlons-en-Champagne', 48.957, 4.363, 'hard'],
  ['Chaumont', 48.111, 5.139, 'hard'],
  ['Laval', 48.073, -0.77, 'hard'],
  ['Nancy', 48.692, 6.184, 'easy'],
  ['Bar-le-Duc', 48.773, 5.16, 'hard'],
  ['Vannes', 47.658, -2.76, 'medium'],
  ['Metz', 49.12, 6.176, 'easy'],
  ['Nevers', 46.99, 3.159, 'hard'],
  ['Lille', 50.629, 3.057, 'easy'],
  ['Beauvais', 49.43, 2.081, 'hard'],
  ['Alençon', 48.432, 0.091, 'hard'],
  ['Arras', 50.291, 2.777, 'medium'],
  ['Clermont-Ferrand', 45.778, 3.087, 'easy'],
  ['Pau', 43.295, -0.371, 'easy'],
  ['Tarbes', 43.233, 0.078, 'hard'],
  ['Perpignan', 42.699, 2.895, 'easy'],
  ['Strasbourg', 48.573, 7.752, 'easy'],
  ['Colmar', 48.079, 7.358, 'medium'],
  ['Lyon', 45.764, 4.836, 'easy'],
  ['Vesoul', 47.622, 6.155, 'hard'],
  ['Mâcon', 46.307, 4.828, 'hard'],
  ['Le Mans', 48.006, 0.199, 'easy'],
  ['Chambéry', 45.564, 5.918, 'medium'],
  ['Annecy', 45.9, 6.129, 'easy'],
  ['Paris', 48.857, 2.352, 'easy'],
  ['Rouen', 49.443, 1.1, 'easy'],
  ['Melun', 48.54, 2.66, 'hard'],
  ['Versailles', 48.805, 2.12, 'easy'],
  ['Niort', 46.323, -0.465, 'hard'],
  ['Amiens', 49.894, 2.296, 'easy'],
  ['Albi', 43.929, 2.148, 'hard'],
  ['Montauban', 44.018, 1.355, 'hard'],
  ['Toulon', 43.124, 5.928, 'easy'],
  ['Avignon', 43.949, 4.806, 'easy'],
  ['La Roche-sur-Yon', 46.67, -1.426, 'hard'],
  ['Poitiers', 46.58, 0.34, 'easy'],
  ['Limoges', 45.834, 1.261, 'easy'],
  ['Épinal', 48.173, 6.45, 'hard'],
  ['Auxerre', 47.798, 3.567, 'hard'],
  ['Belfort', 47.64, 6.863, 'hard'],
  ['Évry-Courcouronnes', 48.629, 2.441, 'hard'],
  ['Cergy', 49.036, 2.063, 'hard'],
  // Towns a table knows
  ['Le Havre', 49.494, 0.108, 'easy'],
  ['Brest', 48.39, -4.486, 'easy'],
  ['Reims', 49.258, 4.032, 'easy'],
  ['Mulhouse', 47.75, 7.336, 'easy'],
  ['Dunkerque', 51.034, 2.377, 'easy'],
  ['Calais', 50.951, 1.858, 'easy'],
  ['Boulogne-sur-Mer', 50.726, 1.614, 'medium'],
  ['Cherbourg', 49.64, -1.616, 'easy'],
  ['Saint-Malo', 48.649, -2.026, 'easy'],
  ['Lorient', 47.748, -3.37, 'medium'],
  ['Saint-Nazaire', 47.273, -2.214, 'medium'],
  ['Biarritz', 43.483, -1.559, 'easy'],
  ['Aix-en-Provence', 43.53, 5.447, 'easy'],
  ['Cannes', 43.552, 7.017, 'easy'],
  ['Arles', 43.677, 4.63, 'medium'],
  ['Béziers', 43.344, 3.216, 'medium'],
  ['Narbonne', 43.184, 3.004, 'medium'],
  ['Sète', 43.403, 3.697, 'medium'],
  ['Vichy', 46.128, 3.426, 'medium'],
  ['Chamonix', 45.924, 6.869, 'easy'],
  ['Lourdes', 43.095, -0.046, 'easy'],
  ['Saint-Tropez', 43.273, 6.639, 'easy'],
  ['Arcachon', 44.658, -1.168, 'easy'],
  ['Cognac', 45.696, -0.329, 'medium'],
  ['Épernay', 49.04, 3.959, 'medium'],
  ['Verdun', 49.16, 5.384, 'medium'],
  ['Saint-Quentin', 49.848, 3.287, 'hard'],
  ['Valenciennes', 50.358, 3.523, 'medium'],
  ['Briançon', 44.899, 6.643, 'medium'],
  ['Royan', 45.624, -1.029, 'medium'],
  ['Les Sables-d’Olonne', 46.497, -1.783, 'medium'],
  ['Dieppe', 49.922, 1.078, 'medium'],
  ['Deauville', 49.357, 0.07, 'medium'],
  ['Calvi', 42.567, 8.757, 'medium'],
  ['Porto-Vecchio', 41.591, 9.279, 'medium'],
  ['Bonifacio', 41.387, 9.159, 'medium'],
  ['Menton', 43.775, 7.497, 'medium'],
  ['Albertville', 45.676, 6.392, 'hard'],
  ['Montluçon', 46.34, 2.603, 'hard'],
  ['Roanne', 46.036, 4.068, 'hard'],
  ['Thionville', 49.358, 6.168, 'hard'],
  ['Rochefort', 45.937, -0.961, 'hard'],
  ['Saumur', 47.26, -0.077, 'medium'],
  ['Fontainebleau', 48.405, 2.701, 'medium']
]

export const BANKED_CITIES: readonly BankedCity[] = CITIES.map(
  ([name, latitude, longitude, tier]) => ({
    name,
    point: { latitude, longitude },
    tier
  })
)

/** The id a played city takes in the room's no-repeat set, beside the countries. */
export const playedCityId = (name: string): string => `atlas:city:${name}`

/** A city the room has not been asked yet, or `null` once it has placed them all. */
export const drawCity = ({
  difficulty,
  playedIds
}: {
  difficulty: Difficulty
  playedIds: ReadonlySet<string>
}): BankedCity | null =>
  drawByDifficulty({
    difficulty,
    pool: BANKED_CITIES.filter(
      (city) => !playedIds.has(playedCityId(city.name))
    ),
    tierOf: ({ tier }) => tier
  })
