import { expect, test } from '../../fixtures/test.fixture';
import { waitForAngularStability } from '../../utils/waits';

// The mobile bottom bar opens the full schedule directly.
test.describe('Schedule on mobile', () => {
  test('opens the schedule day view from the bottom bar, scrolled to now', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/tag/TODAY/tasks');
    await waitForAngularStability(page);

    const scheduleButton = page
      .locator('mobile-bottom-nav')
      .getByRole('button', { name: /^(Schedule|日程)$/ });
    await scheduleButton.click();
    await expect(page).toHaveURL(/\/#\/schedule/);
    await expect(scheduleButton).toHaveClass(/active/);
    await page.locator('.e2e-day-view-btn').click();

    const dayPanel = page.locator('schedule');
    await expect(dayPanel).toBeVisible();
    await expect(dayPanel.locator('schedule-week .grid-container')).toBeVisible();

    const currentTime = dayPanel.locator('.current-time');
    await expect(currentTime).toBeAttached();
    await expect
      .poll(async () => {
        const panelBox = await dayPanel.boundingBox();
        const nowBox = await currentTime.boundingBox();
        if (!panelBox || !nowBox) return false;
        return nowBox.y >= panelBox.y && nowBox.y <= panelBox.y + panelBox.height;
      })
      .toBe(true);
  });
});
