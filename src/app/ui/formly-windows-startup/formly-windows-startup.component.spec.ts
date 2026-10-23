import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { FormlyWindowsStartupComponent } from './formly-windows-startup.component';

describe('FormlyWindowsStartupComponent', () => {
  const originalEa = window.ea;
  let get: jasmine.Spy;
  let set: jasmine.Spy;
  beforeEach(() => {
    get = jasmine.createSpy().and.resolveTo({ supported: true, enabled: false });
    set = jasmine.createSpy().and.resolveTo({ supported: true, enabled: true });
    (window as unknown as { ea: unknown }).ea = {
      getWindowsStartup: get,
      setWindowsStartup: set,
    };
    TestBed.configureTestingModule({
      imports: [
        FormlyWindowsStartupComponent,
        FormlyModule.forRoot(),
        TranslateModule.forRoot(),
      ],
    });
  });
  afterEach(() => {
    window.ea = originalEa;
  });
  const create = (): ComponentFixture<FormlyWindowsStartupComponent> => {
    const fixture = TestBed.createComponent(FormlyWindowsStartupComponent);
    fixture.componentInstance.field = { props: {} };
    return fixture;
  };
  const event = (checked: boolean): MatSlideToggleChange => ({
    checked,
    source: { checked } as MatSlideToggle,
  });
  it('reads Windows state without enabling it merely by opening Settings', async () => {
    const fixture = create();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(set).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement
        .querySelector('button[role=switch]')
        .getAttribute('aria-checked'),
    ).toBe('false');
    expect(
      fixture.nativeElement.querySelector('formly-field-mat-slide-toggle mat-form-field'),
    ).not.toBeNull();
  });
  it('shows the switch enabled when reopening settings after Windows enabled startup', async () => {
    get.and.resolveTo({ supported: true, enabled: true });
    const fixture = create();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('button[role=switch]')
        .getAttribute('aria-checked'),
    ).toBe('true');
    expect(set).not.toHaveBeenCalled();
  });
  it('saves the toggle immediately and displays the returned state', async () => {
    const fixture = create();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[role=switch]').click();
    await fixture.whenStable();
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(set).toHaveBeenCalledOnceWith(true);
    expect(c.enabled()).toBeTrue();
    expect(c.busy()).toBeFalse();
  });
  it('recovers the actual Windows state and reports write failure', async () => {
    set.and.rejectWith(new Error('denied'));
    const c = create().componentInstance;
    await c.ngOnInit();
    const change = event(true);
    await c.change(change);
    expect(c.failed()).toBeTrue();
    expect(c.enabled()).toBeFalse();
    expect(change.source.checked).toBeFalse();
  });
  it('disables the control when this build is unsupported', async () => {
    get.and.resolveTo({ supported: false, enabled: false });
    const fixture = create();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('button[role=switch]').disabled,
    ).toBeTrue();
    await fixture.componentInstance.change(event(true));
    expect(set).not.toHaveBeenCalled();
  });
});
