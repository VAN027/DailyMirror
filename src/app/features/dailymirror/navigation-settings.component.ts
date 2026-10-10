import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { MagicNavConfigService } from '../../core-ui/magic-side-nav/magic-nav-config.service';
import { DisplayPreferencesService } from './display-preferences.service';
import { T } from '../../t.const';

@Component({
  selector: 'dm-navigation-settings',
  imports: [TranslatePipe, MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h2>{{ T.DM.NAV | translate }}</h2>
      <p>{{ T.DM.NAV_HINT | translate }}</p>
      @for (item of nav.configurableItems(); track item.id) {
        <label>
          <input
            #pinToggle
            type="checkbox"
            [checked]="preferences.isPinned(item.id)"
            (change)="preferences.pin(item.id, pinToggle.checked)"
          />
          {{ item.label || '' | translate }}
        </label>
      }
      <button
        mat-button
        (click)="preferences.resetNavigation()"
      >
        {{ T.DM.RESET_NAV | translate }}
      </button>
    </section>
  `,
  styles: `
    section {
      padding: var(--s2);
      margin-bottom: var(--s2);
    }
    label {
      display: inline-flex;
      align-items: center;
      gap: var(--s);
      margin: var(--s);
    }
  `,
})
export class NavigationSettingsComponent {
  readonly T = T;
  readonly nav = inject(MagicNavConfigService);
  readonly preferences = inject(DisplayPreferencesService);
}
