/**
 * Whether two values of plain data hold the same contents. Every frame decodes
 * a fresh snapshot, so a seat list nobody touched arrives as a new array each
 * time and identity says nothing about whether it changed.
 */
export const isSameData = <Data>({
  kept,
  next
}: {
  kept: Data
  next: Data
}): boolean => kept === next || JSON.stringify(kept) === JSON.stringify(next)
