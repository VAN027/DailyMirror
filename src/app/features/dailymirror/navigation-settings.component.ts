import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CollapsibleComponent } from '../../ui/collapsible/collapsible.component';
import { FormlySlideToggleComponent } from '../../ui/formly-slide-toggle/formly-slide-toggle.component';
import { MagicNavConfigService } from '../../core-ui/magic-side-nav/magic-nav-config.service';
import { DisplayPreferencesService } from './display-preferences.service';
import { T } from '../../t.const';

@Component({
  selector: 'dm-navigation-settings',
  imports: [TranslatePipe, CollapsibleComponent, FormlySlideToggleComponent],
  // Share the original settings section layout, including its accordion spacing.
  styleUrls: ['../config/config-section/config-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <collapsible
      [title]="T.DM.NAV | translate"
      [isIconBefore]="true"
      [isExpanded]="isExpanded()"
    >
      <div class="form-wrapper">
        <p>{{ T.DM.NAV_HINT | translate }}</p>
        @for (row of rows(); track row.item.id) {
          <formly-field-mat-slide-toggle
            [field]="{
              formControl: row.control,
              props: {
                label: row.item.label || '' | translate,
                icon: row.item.icon,
              },
            }"
            (changed)="preferences.pin(row.item.id, $event.checked)"
          />
        }
      </div>
    </collapsible>
  `,
})
export class NavigationSettingsComponent {
  readonly T = T;
  readonly isExpanded = input(false);
  readonly nav = inject(MagicNavConfigService);
  readonly preferences = inject(DisplayPreferencesService);
  readonly rows = computed(() =>
    this.nav.configurableItems().map((item) => ({
      item,
      control: new FormControl(this.preferences.isPinned(item.id), { nonNullable: true }),
    })),
  );
}
