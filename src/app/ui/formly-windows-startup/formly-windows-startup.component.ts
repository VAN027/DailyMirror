import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { FormControl } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { FormlySlideToggleComponent } from '../formly-slide-toggle/formly-slide-toggle.component';
import { TranslatePipe } from '@ngx-translate/core';
import { T } from '../../t.const';

// Keyless, like the local REST token field: Windows owns this setting, not sync.
@Component({
  selector: 'formly-windows-startup',
  imports: [FormlySlideToggleComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <formly-field-mat-slide-toggle
      [field]="{
        formControl: startupControl,
        props: {
          label: T.GCF.MISC.WINDOWS_STARTUP | translate,
          disabled: busy() || !supported(),
          description:
            (supported()
              ? T.GCF.MISC.WINDOWS_STARTUP_HINT
              : T.GCF.MISC.WINDOWS_STARTUP_UNAVAILABLE
            ) | translate,
        },
      }"
      (changed)="change($event)"
    />
    @if (failed()) {
      <p role="alert">{{ T.GCF.MISC.WINDOWS_STARTUP_ERROR | translate }}</p>
    }
  `,
})
export class FormlyWindowsStartupComponent
  extends FieldType<FormlyFieldConfig>
  implements OnInit
{
  readonly T = T;
  readonly startupControl = new FormControl(false, { nonNullable: true });
  readonly enabled = signal(false);
  readonly supported = signal(false);
  readonly busy = signal(true);
  readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const state = await window.ea.getWindowsStartup();
      this.enabled.set(state.enabled);
      this.supported.set(state.supported);
    } catch {
      this.failed.set(true);
    } finally {
      this.startupControl.setValue(this.enabled(), { emitEvent: false });
      this.busy.set(false);
    }
  }

  async change(event: MatSlideToggleChange): Promise<void> {
    if (this.busy() || !this.supported()) return;
    this.busy.set(true);
    this.failed.set(false);
    try {
      const state = await window.ea.setWindowsStartup(event.checked);
      this.enabled.set(state.enabled);
      this.supported.set(state.supported);
    } catch {
      this.failed.set(true);
      try {
        const state = await window.ea.getWindowsStartup();
        this.enabled.set(state.enabled);
        this.supported.set(state.supported);
      } catch {
        this.supported.set(false);
      }
    } finally {
      event.source.checked = this.enabled();
      this.startupControl.setValue(this.enabled(), { emitEvent: false });
      this.busy.set(false);
    }
  }
}
