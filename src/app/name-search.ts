export function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
}

export function nameMatchesQuery(name: string, query: string): boolean {
  const searchableName = normalizeName(name)
  const words = normalizeName(query).trim().split(/\s+/).filter(Boolean)
  return words.every(word => searchableName.includes(word))
}
