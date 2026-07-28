/**
 * Lanceur Node de scripts/replayCheck.ts.
 * jiti compile le TypeScript à la volée et résout l'alias « @/ » du tsconfig,
 * ce que le binaire jiti seul ne fait pas.
 */
const path = require('path')
const root = path.resolve(__dirname, '..')

// Hors navigateur il n'y a pas de window.localStorage : zustand le signale à chaque
// tour simulé. La persistance n'a aucun effet sur les calculs — on masque l'avertissement.
const warn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('zustand persist middleware')) return
  warn(...args)
}

require(path.join(root, 'node_modules', 'jiti'))(__filename, {
  alias: { '@': root },
  interopDefault: true,
})(path.join(__dirname, 'replayCheck.ts'))
