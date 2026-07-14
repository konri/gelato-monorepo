export function removeNonEnglishChars(input: string) {
  return input.replace(/[^a-zA-Z ]/g, '')
}
