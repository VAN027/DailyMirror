import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ScheduleComponent } from '../../schedule/schedule/schedule.component';
import { ScheduleWeekComponent } from '../../schedule/schedule-week/schedule-week.component';
import { MobileScheduleMonthComponent } from './mobile-schedule-month.component';
import { MobileScheduleContextService } from './mobile-schedule-context.service';
import { parseDbDateStr } from '../../../util/parse-db-date-str';

@Component({
  selector: 'mobile-schedule',
  imports: [
    ScheduleWeekComponent,
    MobileScheduleMonthComponent,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip,
    MatMenuModule,
    TranslatePipe,
  ],
  templateUrl: './mobile-schedule.component.html',
  styleUrls: [
    '../../schedule/schedule/schedule.component.scss',
    './mobile-schedule.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileScheduleComponent extends ScheduleComponent {
  private readonly _mobileTranslate = inject(TranslateService);
  private readonly _mobileContext = inject(MobileScheduleContextService);
  private readonly _month = viewChild(MobileScheduleMonthComponent);
  readonly mobileLocale = toSignal(
    this._mobileTranslate.onLangChange.pipe(map((event) => event.lang)),
    {
      initialValue: this._mobileTranslate.currentLang || 'en',
    },
  );
  readonly mobileHeaderTitle = computed(() => {
    if (!this.isMonthView()) return this.headerTitle();
    const days = this.daysToShow();
    return days.length
      ? new Intl.DateTimeFormat(this.mobileLocale(), {
          year: 'numeric',
          month: 'long',
        }).format(parseDbDateStr(days[Math.floor(days.length / 2)]))
      : '';
  });
  constructor() {
    super();
    effect(() =>
      this._mobileContext.selectedDay.set(
        this.isMonthView() ? this._month()?.selectedDay() : undefined,
      ),
    );
    inject(DestroyRef).onDestroy(() => this._mobileContext.selectedDay.set(undefined));
  }
  override goToToday(): void {
    super.goToToday();
    this._month()?.resetSelection();
  }
}
