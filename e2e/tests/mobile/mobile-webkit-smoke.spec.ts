import { expect, test } from '../../fixtures/test.fixture';

test.describe('Mobile WebKit smoke', () => {
  test('supports touch navigation and task creation', async ({ page, testPrefix }) => {
    const mobileNav = page.locator('mobile-bottom-nav');
    await expect(mobileNav).toBeVisible();

    const quadrants = mobileNav.getByRole('button', {
      name: /^(Four quadrants|四象限)$/,
    });
    await quadrants.tap();
    await expect(page).toHaveURL(/\/#\/quadrants/);
    await expect(page.locator('dm-quadrants')).toBeVisible();
    await expect(quadrants).toHaveClass(/active/);

    const schedule = mobileNav.getByRole('button', { name: /^(Schedule|日程)$/ });
    await schedule.tap();
    await expect(page).toHaveURL(/\/#\/schedule/);
    await expect(page.locator('schedule')).toBeVisible();
    await expect(schedule).toHaveClass(/active/);

    await mobileNav.getByRole('button', { name: /^(Today|今天)$/ }).tap();
    await expect(page).toHaveURL(/\/#\/tag\/TODAY\/tasks/);
    await expect(page.locator('task-list').first()).toBeVisible();

    await mobileNav.locator('.add-task-button').tap();
    const taskTitle = `${testPrefix}-MobileWebKit`;
    const addTaskInput = page.locator('add-task-bar.global .main-input');
    await expect(addTaskInput).toBeVisible();
    await addTaskInput.fill(taskTitle);
    await page.locator('.e2e-add-task-submit').tap();

    await expect(page.locator('task').filter({ hasText: taskTitle })).toHaveCount(1);
  });
});
