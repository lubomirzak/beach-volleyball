import { Injectable, inject } from '@angular/core'
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth'
import { map } from 'rxjs'
import { environment } from '../environments/environment'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth)
  readonly user$ = user(this.auth)
  readonly isAdmin$ = this.user$.pipe(
    map(account => account?.emailVerified === true &&
      account.email?.toLowerCase() === environment.adminEmail)
  )

  signIn() {
    return signInWithPopup(this.auth, new GoogleAuthProvider())
  }

  signOut() {
    return signOut(this.auth)
  }
}
