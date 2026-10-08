import { Component, Input } from '@angular/core'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@Component({
  selector: 'app-loading-spinner',
  imports: [MatProgressSpinnerModule],
  template: '<mat-spinner [attr.aria-label]="label"></mat-spinner>',
  styles: ':host { display: grid; place-items: center; min-height: 50vh; width: 100%; }',
})
export class LoadingSpinnerComponent {
  @Input() label = 'Loading'
}
