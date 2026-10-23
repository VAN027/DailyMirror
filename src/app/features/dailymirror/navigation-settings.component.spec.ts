import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { NavigationSettingsComponent } from './navigation-settings.component';
import { DisplayPreferencesService } from './display-preferences.service';
import { MagicNavConfigService } from '../../core-ui/magic-side-nav/magic-nav-config.service';
import { CollapsibleComponent } from '../../ui/collapsible/collapsible.component';

describe('NavigationSettingsComponent', () => {
  it('reuses the accordion and switches, saves selections without a reset button', async () => {
    const pinned = signal(true);
    const pin = jasmine
      .createSpy()
      .and.callFake((_id: string, value: boolean) => pinned.set(value));
    TestBed.configureTestingModule({
      imports: [
        NavigationSettingsComponent,
        FormlyModule.forRoot(),
        TranslateModule.forRoot(),
      ],
      providers: [
        provideNoopAnimations(),
        {
          provide: MagicNavConfigService,
          useValue: {
            configurableItems: signal([
              { id: 'dm-quadrants', label: 'Quadrants', icon: 'grid_view' },
            ]),
          },
        },
        {
          provide: DisplayPreferencesService,
          useValue: { isPinned: () => pinned(), pin },
        },
      ],
    });
    const fixture = TestBed.createComponent(NavigationSettingsComponent);
    fixture.detectChanges();
    const accordion = fixture.debugElement.query(By.directive(CollapsibleComponent))
      .componentInstance as CollapsibleComponent;
    expect(accordion.isExpanded).toBeFalse();
    fixture.nativeElement.querySelector('.collapsible-header').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(accordion.isExpanded).toBeTrue();
    const toggle = fixture.nativeElement.querySelector(
      'button[role=switch]',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    toggle.click();
    fixture.detectChanges();
    expect(pin).toHaveBeenCalledOnceWith('dm-quadrants', false);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(fixture.nativeElement.querySelector('button[mat-stroked-button]')).toBeNull();
    fixture.nativeElement.querySelector('.collapsible-header').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(accordion.isExpanded).toBeFalse();
  });
});
