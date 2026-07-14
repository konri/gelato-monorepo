/**
 * Generates a pickup code for an order
 * Format: orderNumber + 2 random uppercase letters
 * Example: 45 -> "45AB", 123 -> "123XY"
 *
 * Excludes confusing letters: O (looks like 0), I (looks like 1)
 */
export function generatePickupCode(orderNumber: number): string {
  // Letters without O and I to avoid confusion
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

  const randomLetter1 = letters[Math.floor(Math.random() * letters.length)]
  const randomLetter2 = letters[Math.floor(Math.random() * letters.length)]

  return `${orderNumber}${randomLetter1}${randomLetter2}`
}
