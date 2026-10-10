import { Injectable, signal } from '@angular/core';
import { lsGetJSON, lsSetJSON } from '../../util/ls-util';

export const DM_DISPLAY_KEY = 'DAILYMIRROR_DISPLAY_V3';
export interface DisplayPreferences {
  navigation?: Record<string, boolean>;
  hideCompleted?: boolean;
  calendarView?: 'month' | 'week' | 'day';
}

@Injectable({ providedIn: 'root' })
export class DisplayPreferencesService {
  readonly preferences = signal<DisplayPreferences>(lsGetJSON(DM_DISPLAY_KEY, {}));

  isPinned(id: string): boolean {
    return (
      this.preferences().navigation?.[id] ?? ['dm-quadrants', 'dm-calendar'].includes(id)
    );
  }

  pin(id: string, value: boolean): void {
    this.update({ navigation: { ...this.preferences().navigation, [id]: value } });
  }

  resetNavigation(): void {
    this.update({ navigation: {} });
  }

  update(changes: Partial<DisplayPreferences>): void {
    const next = { ...this.preferences(), ...changes };
    lsSetJSON(DM_DISPLAY_KEY, next);
    this.preferences.set(next);
  }
}
