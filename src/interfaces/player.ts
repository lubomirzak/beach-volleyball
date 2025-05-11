import { Attending } from './attending'

export interface Player {
  id: string
  firstName: string
  lastName: string
  attending: Attending
}
