/**
 * Helpers de typographie française.
 * Insère des espaces insécables avant la ponctuation haute,
 * corrige les apostrophes et les guillemets.
 */

export function nbsp(text: string): string {
  return text
    .replace(/\s([:;?!»%])/g, ' $1')
    .replace(/«\s/g, '« ')
    .replace(/\s»/g, ' »')
}

export function formatQuotes(text: string): string {
  return text
    .replace(/"([^"]*)"/g, '« $1 »')
    .replace(/'/g, '’')
}

/** Applique nbsp + guillemets en une passe */
export function frenchTypo(text: string): string {
  return nbsp(formatQuotes(text))
}
