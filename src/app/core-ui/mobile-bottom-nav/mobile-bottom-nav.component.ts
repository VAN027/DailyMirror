import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { LayoutService } from '../layout/layout.service';
import { TODAY_TAG } from '../../features/tag/tag.const';
import { T } from '../../t.const';
import { WorkContextService } from '../../features/work-context/work-context.service';
import { IS_ANDROID_NATIVE } from '../../util/is-native-platform';

// Latches true after the first cold-start entrance fires in this JS session,
// so resume/back/remount paths never re-hide the FAB.
let _hasFiredColdStartEntrance = false;

@Component({
  selector: 'mobile-bottom-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatButtonModule, TranslateModule],
  templateUrl: './mobile-bottom-nav.component.html',
  styleUrls: ['./mobile-bottom-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileBottomNavComponent {
  private readonly _layoutService = inject(LayoutService);
  private readonly _workContextService = inject(WorkContextService);

  isEntrance = input(false);
  readonly isAndroid = IS_ANDROID_NATIVE;

  // Tracks whether the slide-up entrance animation is actively running.
  // On Android, the web FAB is hidden only during this animation, and only on
  // a true cold start — remounts from back/resume/focus-mode toggle must not
  // re-trigger the hide.
  readonly isEntranceAnimating = signal(false);
  private _entranceAnimationTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this._entranceAnimationTimeout));

    effect(() => {
      if (!_hasFiredColdStartEntrance && this.isAndroid && this.isEntrance()) {
        _hasFiredColdStartEntrance = true;
        this.isEntranceAnimating.set(true);
        // Safety fallback: clear if animationend doesn't fire
        // (e.g. prefers-reduced-motion: reduce → animation: none).
        // Timeout = 250ms delay + 400ms duration + 50ms buffer = 700ms
        this._entranceAnimationTimeout = setTimeout(() => {
          this.isEntranceAnimating.set(false);
        }, 700);
      }
    });
  }

  onEntranceAnimationEnd(event: AnimationEvent): void {
    if (event.animationName === 'slide-up-from-bottom') {
      this.isEntranceAnimating.set(false);
      clearTimeout(this._entranceAnimationTimeout);
    }
  }

  readonly T = T;
  readonly TODAY_TAG = TODAY_TAG;
  readonly todayTagId = TODAY_TAG.id;
  readonly todayRoute = `/tag/${TODAY_TAG.id}/tasks`;

  // Services for template access
  readonly layoutService = this._layoutService;

  // Output events
  toggleMobileNavEvent = output<void>();

  readonly hasProjectBacklog = toSignal(
    this._workContextService.activeWorkContext$.pipe(map((ac) => ac.isEnableBacklog)),
  );

  // Navigation methods
  showAddTaskBar(): void {
    this._layoutService.showAddTaskBar();
  }

  toggleMobileNav(): void {
    this.toggleMobileNavEvent.emit();
  }
}
