import { DisplayPreferencesService, DM_DISPLAY_KEY } from './display-preferences.service';

describe('DailyMirror display preferences', () => {
  beforeEach(() => localStorage.removeItem(DM_DISPLAY_KEY));
  afterEach(() => localStorage.removeItem(DM_DISPLAY_KEY));

  it('pins quadrants and schedule, leaving review in More by default', () => {
    const service = new DisplayPreferencesService();
    expect(service.isPinned('dm-quadrants')).toBeTrue();
    expect(service.isPinned('dm-calendar')).toBeTrue();
    expect(service.isPinned('dm-review')).toBeFalse();
    expect(service.isPinned('timeline')).toBeFalse();
  });
  it('persists hidden pages, calendar view and completed visibility across instances', () => {
    const service = new DisplayPreferencesService();
    service.pin('dm-calendar', false);
    service.update({ calendarView: 'week', hideCompleted: false });
    const restored = new DisplayPreferencesService();
    expect(restored.isPinned('dm-calendar')).toBeFalse();
    expect(restored.preferences().calendarView).toBe('week');
    expect(restored.preferences().hideCompleted).toBeFalse();
  });
  it('preserves an explicit review pin across reloads', () => {
    const service = new DisplayPreferencesService();
    service.pin('dm-review', true);
    expect(new DisplayPreferencesService().isPinned('dm-review')).toBeTrue();
  });
  it('restores navigation without resetting other preferences', () => {
    const service = new DisplayPreferencesService();
    service.pin('dm-review', true);
    service.update({ calendarView: 'day', hideCompleted: false });
    service.resetNavigation();
    expect(service.isPinned('dm-review')).toBeFalse();
    expect(service.preferences().calendarView).toBe('day');
    expect(service.preferences().hideCompleted).toBeFalse();
  });
});
