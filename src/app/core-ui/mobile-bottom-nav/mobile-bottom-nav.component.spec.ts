import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
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
});
