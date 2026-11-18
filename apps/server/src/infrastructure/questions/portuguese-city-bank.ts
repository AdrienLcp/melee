import type { ContentTier } from '@melee/core/round/difficulty-draw'

/**
 * The eighteen district capitals of mainland Portugal and the towns a table
 * knows without being one: the resorts, the pilgrimages, the old towns. Funchal
 * and Ponta Delgada are left out with their islands, which the map of Portugal
 * does not reach, and a town on top of a bigger one at this map's scale —
 * Almada, Gaia, Olhão — asks nothing the bigger one does not. Coordinates are
 * the town hall's, to a few hundred metres; the tier is read off a Portuguese
 * table. A name is Portugal's own, as a French city's is France's: _Lisboa_,
 * which a table may answer in its own language among the aliases.
 */
export const PORTUGUESE_CITY_ROWS: readonly (readonly [
  name: string,
  latitude: number,
  longitude: number,
  tier: ContentTier,
  aliases?: readonly string[]
])[] = [
  // District capitals
  ['Aveiro', 40.641, -8.654, 'easy'],
  ['Beja', 38.015, -7.863, 'medium'],
  ['Braga', 41.551, -8.427, 'easy'],
  ['Bragança', 41.806, -6.757, 'medium'],
  ['Castelo Branco', 39.822, -7.491, 'medium'],
  ['Coimbra', 40.211, -8.429, 'easy'],
  ['Évora', 38.571, -7.909, 'easy'],
  ['Faro', 37.019, -7.931, 'easy'],
  ['Guarda', 40.537, -7.268, 'medium'],
  ['Leiria', 39.744, -8.807, 'medium'],
  ['Lisboa', 38.707, -9.136, 'easy', ['Lisbon', 'Lisbonne']],
  ['Portalegre', 39.293, -7.431, 'hard'],
  ['Porto', 41.15, -8.611, 'easy', ['Oporto']],
  ['Santarém', 39.236, -8.686, 'medium'],
  ['Setúbal', 38.524, -8.893, 'medium'],
  ['Viana do Castelo', 41.694, -8.832, 'medium'],
  ['Vila Real', 41.3, -7.744, 'medium'],
  ['Viseu', 40.657, -7.914, 'medium'],
  // Towns a table knows
  ['Sintra', 38.8, -9.379, 'easy'],
  ['Cascais', 38.697, -9.421, 'easy'],
  ['Guimarães', 41.444, -8.296, 'easy'],
  ['Nazaré', 39.601, -9.071, 'easy'],
  ['Fátima', 39.631, -8.673, 'easy'],
  ['Lagos', 37.102, -8.673, 'easy'],
  ['Albufeira', 37.089, -8.25, 'easy'],
  ['Óbidos', 39.361, -9.157, 'medium'],
  ['Tomar', 39.601, -8.409, 'medium'],
  ['Peniche', 39.356, -9.381, 'medium'],
  ['Ericeira', 38.963, -9.416, 'medium'],
  ['Figueira da Foz', 40.15, -8.861, 'medium'],
  ['Portimão', 37.138, -8.537, 'medium'],
  ['Sagres', 37.009, -8.94, 'medium'],
  ['Tavira', 37.127, -7.648, 'medium'],
  ['Sesimbra', 38.444, -9.101, 'medium'],
  ['Amarante', 41.27, -8.081, 'medium'],
  ['Barcelos', 41.532, -8.616, 'medium'],
  ['Póvoa de Varzim', 41.383, -8.761, 'medium'],
  ['Chaves', 41.74, -7.471, 'medium'],
  ['Covilhã', 40.281, -7.504, 'medium'],
  ['Vila Nova de Milfontes', 37.724, -8.783, 'medium'],
  ['Lamego', 41.097, -7.808, 'hard'],
  ['Elvas', 38.881, -7.163, 'hard'],
  ['Estremoz', 38.844, -7.586, 'hard'],
  ['Monsaraz', 38.443, -7.381, 'hard'],
  ['Mértola', 37.641, -7.661, 'hard'],
  ['Sines', 37.956, -8.87, 'hard'],
  ['Loulé', 37.137, -8.023, 'hard'],
  ['Monchique', 37.317, -8.556, 'hard'],
  ['Vila Real de Santo António', 37.195, -7.416, 'hard'],
  ['Ponte de Lima', 41.767, -8.584, 'hard'],
  ['Valença', 42.028, -8.643, 'hard'],
  ['Miranda do Douro', 41.496, -6.274, 'hard'],
  ['Mirandela', 41.485, -7.181, 'hard'],
  ['Abrantes', 39.463, -8.198, 'hard'],
  ['Torres Vedras', 39.091, -9.259, 'hard'],
  ['Alcácer do Sal', 38.372, -8.513, 'hard']
]
