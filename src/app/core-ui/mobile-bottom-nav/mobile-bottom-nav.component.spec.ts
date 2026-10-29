import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { MobileBottomNavComponent } from './mobile-bottom-nav.component';
import { LayoutService } from '../layout/layout.service';
import { WorkContextService } from '../../features/work-context/work-context.service';

@Component({ template: '' })
class NavigationTargetComponent {}

describe('MobileBottomNavComponent', () => {
  let fixture: ComponentFixture<MobileBottomNavComponent>;
  let showAddTaskBar: jasmine.Spy;

  beforeEach(async () => {
    showAddTaskBar = jasmine.createSpy('showAddTaskBar');
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        NoopAnimationsModule,
        MobileBottomNavComponent,
      ],
      providers: [
        provideRouter([
          { path: 'tag/TODAY/tasks', component: NavigationTargetComponent },
          { path: 'quadrants', component: NavigationTargetComponent },
          { path: 'schedule', component: NavigationTargetComponent },
        ]),
        { provide: LayoutService, useValue: { showAddTaskBar } },
        {
          provide: WorkContextService,
          useValue: { activeWorkContext$: of({ isEnableBacklog: false }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileBottomNavComponent);
    fixture.detectChanges();
  });

  it('navigates between Today, quadrants and schedule with one active button', async () => {
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('nav button');
    expect(buttons.length).toBe(5);
    const router = TestBed.inject(Router);

    for (const [index, route] of [
      [0, '/tag/TODAY/tasks'],
      [1, '/quadrants'],
      [3, '/schedule'],
      [0, '/tag/TODAY/tasks'],
    ] as const) {
      (buttons[index] as HTMLButtonElement).click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(router.url).toBe(route);
      expect(buttons[index].classList.contains('active')).toBeTrue();
      expect(
        (fixture.nativeElement as HTMLElement).querySelectorAll('nav button.active')
          .length,
      ).toBe(1);
    }
  });

  it('keeps the central add button and the final sidebar button working', () => {
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('nav button');
    const toggleSidebar = jasmine.createSpy('toggleSidebar');
    fixture.componentInstance.toggleMobileNavEvent.subscribe(toggleSidebar);

    (buttons[2] as HTMLButtonElement).click();
    expect(showAddTaskBar).toHaveBeenCalledTimes(1);
    (buttons[4] as HTMLButtonElement).click();
    expect(toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('keeps native capsule icons, accessible names, routes and actions in the same order', async () => {
    Object.defineProperty(fixture.componentInstance, 'isNative', { value: true });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('zh', {
      G: { TODAY_TAG_TITLE: '今天' },
      DM: { QUADRANTS: '四象限', CALENDAR: '日程', MORE: '更多' },
    });
    translate.use('zh');
    fixture.detectChanges();
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav.capsule')!;
    const buttons = nav.querySelectorAll('button');
    expect(buttons.length).toBe(5);
    expect([0, 1, 3, 4].map((i) => buttons[i].getAttribute('aria-label'))).toEqual([
      '今天',
      '四象限',
      '日程',
      '更多',
    ]);
    expect(
      Array.from(nav.querySelectorAll('mat-icon'), (icon) => icon.textContent?.trim()),
    ).toEqual(['wb_sunny', 'grid_view', 'add', 'calendar_month', 'more_horiz']);

    const router = TestBed.inject(Router);
    for (const [index, route] of [
      [0, '/tag/TODAY/tasks'],
      [1, '/quadrants'],
      [3, '/schedule'],
    ] as const) {
      buttons[index].click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(router.url).toBe(route);
      expect(buttons[index].getAttribute('aria-current')).toBe('page');
      expect(nav.querySelectorAll('button.active').length).toBe(1);
    }

    const toggleSidebar = jasmine.createSpy('toggleSidebar');
    fixture.componentInstance.toggleMobileNavEvent.subscribe(toggleSidebar);
    buttons[2].click();
    buttons[4].click();
    expect(showAddTaskBar).toHaveBeenCalledTimes(1);
    expect(toggleSidebar).toHaveBeenCalledTimes(1);
  });
});
