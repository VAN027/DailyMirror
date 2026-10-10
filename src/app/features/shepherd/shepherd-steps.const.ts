import type Shepherd from 'shepherd.js';
type StepOptions = Shepherd.Step.StepOptions;
import { nextOnObs, twoWayObs } from './shepherd-helper';
import { LayoutService } from '../../core-ui/layout/layout.service';
import { TaskService } from '../tasks/task.service';
import { filter, switchMap } from 'rxjs/operators';
import { ofType } from '@ngrx/effects';
import { TaskSharedActions } from '../../root-store/meta/task-shared.actions';
import { GlobalConfigState } from '../config/global-config.model';
import { promiseTimeout } from '../../util/promise-timeout';
import { hideAddTaskBar } from '../../core-ui/layout/store/layout.actions';
import { KeyboardConfig } from '@sp/keyboard-config';
import { WorkContextService } from '../work-context/work-context.service';
import { ShepherdService } from './shepherd.service';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

const PRIMARY_CLASSES =
  'mdc-button mdc-button--unelevated mat-mdc-unelevated-button mat-primary mat-mdc-button-base';

const NEXT_BTN = {
  classes: PRIMARY_CLASSES,
  text: '下一步',
  type: 'next',
};

export enum TourId {
  CreateTask = 'CreateTask',
  KeyboardNav = 'KeyboardNav',
}

export const SHEPHERD_STEPS = (
  shepherdService: ShepherdService,
  cfg: GlobalConfigState,
  actions$: Observable<Action>,
  layoutService: LayoutService,
  taskService: TaskService,
  workContextService: WorkContextService,
): Array<StepOptions> => {
  const KEY_COMBO = (action: keyof KeyboardConfig): string =>
    `<kbd>${cfg.keyboard[action]}</kbd>`;

  return [
    {
      id: TourId.CreateTask,
      title: '创建任务',
      text: [
        '<p>您可以在任务输入栏创建任务。',
        '输入栏支持快捷语法，您可以在输入标题时',
        '同时设置任务详情。</p>',
      ].join(''),
      buttons: [
        {
          classes: PRIMARY_CLASSES,
          text: '打开任务输入栏',
          action: () => {
            layoutService.showAddTaskBar();
            window.setTimeout(() => shepherdService.next());
          },
        },
      ],
    },
    {
      title: '创建任务',
      text: [
        '尝试创建一个包含计划日期和预计用时的任务：<br><br>',
        '<code>准备演示 @tomorrow 30m</code><br><br>',
        '在任务输入栏输入上述内容，然后按 <kbd>Enter</kbd>。',
      ].join(''),
      attachTo: {
        element: 'add-task-bar',
        on: 'bottom',
      },
      beforeShowPromise: () => promiseTimeout(200),
      when: twoWayObs(
        {
          obs: actions$.pipe(ofType(TaskSharedActions.addTask)),
        },
        { obs: actions$.pipe(ofType(hideAddTaskBar)) },
        shepherdService,
      ),
    },
    {
      title: '关闭任务输入栏',
      text: '按 <kbd>Escape</kbd> 关闭任务输入栏。',
      attachTo: {
        element: 'add-task-bar',
        on: 'bottom',
      },
      beforeShowPromise: () => promiseTimeout(200),
      when: nextOnObs(actions$.pipe(ofType(hideAddTaskBar)), shepherdService),
    },
    {
      title: '快捷语法',
      text: [
        '<p>任务标题中的快捷语法会自动转换。',
        '使用默认快捷语法设置时，',
        '<code>@tomorrow</code> 将任务安排到明天，',
        '<code>30m</code> 将预计用时设为 30 分钟。</p>',
        '<p>您还可以使用：</p>',
        '<ul>',
        '<li><code>#标签</code>：添加标签</li>',
        '<li><code>+项目</code>：指定项目</li>',
        '<li><code>@friday</code> 或 <code>@16:00</code>：安排任务</li>',
        '<li><code>!friday</code> 或 <code>!14:30</code>：设置截止时间</li>',
        '</ul>',
      ].join(''),
      buttons: [NEXT_BTN],
    },
    {
      title: '快捷语法设置',
      text: '<p>您可以在<strong>设置 / 任务 / 快捷语法</strong>中分别启用或关闭这些选项。</p><p>需要时，可随时从帮助菜单重新打开此引导。</p>',
      buttons: [
        {
          text: '结束引导',
          classes: PRIMARY_CLASSES,
          action: () => {
            shepherdService.complete();
          },
        },
      ],
    },
    {
      id: TourId.KeyboardNav,
      title: '键盘操作',
      text: `<p>熟悉几个常用快捷键，可以更高效地使用 Super Productivity。</p><p>大部分快捷键都可以在<strong>设置 / 键盘快捷键</strong>中调整。现在先来实际操作。</p>`,
      buttons: [NEXT_BTN],
    },
    {
      title: '键盘操作',
      text: `先添加几个任务。请按 ${KEY_COMBO('addNewTask')}。`,
      when: nextOnObs(
        layoutService.isShowAddTaskBar$.pipe(filter((v) => v)),
        shepherdService,
      ),
    },
    {
      title: '输入任务标题',
      text: '输入任务标题，然后按 <kbd>Enter</kbd>。<strong>重复操作，创建至少 4 个不同标题的任务。</strong>',
      attachTo: {
        element: 'add-task-bar',
        on: 'bottom',
      },
      beforeShowPromise: () => promiseTimeout(200),
      when: twoWayObs(
        {
          obs: actions$.pipe(
            ofType(TaskSharedActions.addTask),
            switchMap(() =>
              workContextService.mainListTasks$.pipe(
                filter((tasks) => tasks.length >= 4),
              ),
            ),
          ),
        },
        { obs: actions$.pipe(ofType(hideAddTaskBar)) },
        shepherdService,
      ),
    },
    {
      title: '关闭任务输入栏',
      text: '按 <kbd>Escape</kbd> 关闭任务输入栏。',
      attachTo: {
        element: 'add-task-bar',
        on: 'bottom',
      },
      beforeShowPromise: () => promiseTimeout(200),
      when: nextOnObs(
        actions$.pipe(ofType(hideAddTaskBar)),
        // delay because other hide should trigger first
        shepherdService,
      ),
    },
    {
      title: '当前选中的任务',
      text: '第一个任务周围的<span class="shepherd-colored-border">彩色边框</span>表示它已被选中。点击页面其他位置即可取消选中。',
      when: {
        show: () => taskService.focusFirstTaskIfVisible(),
      },
      buttons: [NEXT_BTN],
    },
    {
      title: '选中任务',
      text: `如果没有选中的任务，可以按 ${KEY_COMBO(
        'goToWorkView',
      )} 回到主任务列表并选中第一个任务。`,
      buttons: [NEXT_BTN],
    },
    {
      title: '切换任务',

      text: `<p>选中任务后，按方向键 <kbd>↑</kbd> 和 <kbd>↓</kbd> 可以切换到其他任务。</p>`,
      when: {
        show: () => taskService.focusFirstTaskIfVisible(),
      },
      buttons: [NEXT_BTN],
      attachTo: {
        element: 'task-list',
        on: 'bottom',
      },
      highlightClass: '',
    },
    {
      title: '移动任务',
      text: `按 ${KEY_COMBO(
        'moveTaskUp',
      )} 和 ${KEY_COMBO('moveTaskDown')} 可以调整选中任务的位置。`,
      when: {
        show: () => taskService.focusFirstTaskIfVisible(),
      },
      buttons: [NEXT_BTN],
      attachTo: {
        element: 'task-list',
        on: 'bottom',
      },
      highlightClass: '',
    },
    {
      title: '编辑任务标题',
      text: `按 <kbd>Enter</kbd> 可以编辑任务。`,
      when: {
        show: () => taskService.focusFirstTaskIfVisible(),
      },
      buttons: [NEXT_BTN],
      attachTo: {
        element: 'task-list',
        on: 'bottom',
      },
      highlightClass: '',
    },
    {
      title: '打开、关闭和浏览任务详情',
      text: [
        '<p>选中任务后，按 <kbd>→</kbd> 打开任务详情，按 <kbd>←</kbd> 关闭。</p>',
        '<p>使用 <kbd>→</kbd>、<kbd>↑</kbd> 和 <kbd>↓</kbd> 浏览并操作详情中的项目。</p>',
        '<p>大多数面板都可以按 <kbd>Escape</kbd> 退出。</p>',
      ].join(''),
      when: {
        show: () => taskService.focusFirstTaskIfVisible(),
      },
      buttons: [NEXT_BTN],
      attachTo: {
        element: 'task-list',
        on: 'bottom',
      },
      highlightClass: '',
    },
    {
      title: '更多任务快捷键',
      when: {
        show: () => taskService.focusFirstTaskIfVisible(),
      },
      text: `<p>在<strong>设置 / 键盘快捷键 / 任务</strong>中可以查看选中任务后可用的全部快捷键。常用操作有：</p>
          <ul>
          <li>${KEY_COMBO('taskSchedule')}: 安排任务</li>
          <li>${KEY_COMBO('taskDelete')}: 删除任务</li>
          <li>${KEY_COMBO('taskToggleDone')}: 切换完成状态</li>
          <li>${KEY_COMBO('taskAddSubTask')}: 添加子任务</li>
          <li>${KEY_COMBO('taskAddAttachment')}: 添加文件或链接附件</li>
          <li>${KEY_COMBO('togglePlay')}: 开始或暂停计时</li>
          </ul>

      `,
      buttons: [NEXT_BTN],
      attachTo: {
        element: 'task-list',
        on: 'bottom',
      },
      highlightClass: '',
    },
    {
      title: '🎉 恭喜完成！🎉',
      text: '<p>键盘操作引导已结束。您随时可以通过菜单中的帮助按钮重新开始。</p><p>接下来亲自试试，让这些操作逐渐熟悉起来。😄</p>',
      buttons: [
        {
          text: '结束引导',
          classes: PRIMARY_CLASSES,
          action: () => {
            shepherdService.complete();
          },
        },
      ],
    },
  ];
};
