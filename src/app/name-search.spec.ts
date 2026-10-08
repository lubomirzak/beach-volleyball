import { nameMatchesQuery } from './name-search'

describe('name search', () => {
  it('finds accented player names without typing accents', () => {
    expect(nameMatchesQuery('Ľubo Žák', 'Lubo')).toBeTrue()
    expect(nameMatchesQuery('Ľubo Žák', 'Zak Lub')).toBeTrue()
    expect(nameMatchesQuery('Ľubo Žák', 'Ľubo Žák')).toBeTrue()
    expect(nameMatchesQuery('Ľubo Žák', 'Peter')).toBeFalse()
  })

  it('matches team members in either order', () => {
    expect(nameMatchesQuery('Ľubo Žák, Jana Nováková', 'Jana Lubo')).toBeTrue()
    expect(nameMatchesQuery('Ľubo Žák, Jana Nováková', 'Lubo Peter')).toBeFalse()
  })
})
