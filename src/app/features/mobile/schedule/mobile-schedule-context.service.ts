import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MobileScheduleContextService {
  // Connect the native month selection to the existing global add-task bar.
  readonly selectedDay = signal<string | undefined>(undefined);
}
