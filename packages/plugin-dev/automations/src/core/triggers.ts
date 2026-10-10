import { IAutomationTrigger } from './definitions';

export const TriggerTaskCompleted: IAutomationTrigger = {
  id: 'taskCompleted',
  name: '任务完成时',
  matches: (event) => event.type === 'taskCompleted',
};

export const TriggerTaskCreated: IAutomationTrigger = {
  id: 'taskCreated',
  name: '任务创建时',
  matches: (event) => event.type === 'taskCreated',
};

export const TriggerTaskUpdated: IAutomationTrigger = {
  id: 'taskUpdated',
  name: '任务更新时',
  matches: (event) => event.type === 'taskUpdated',
};

export const TriggerTaskStarted: IAutomationTrigger = {
  id: 'taskStarted',
  name: '任务开始时',
  description: '任务开始计时时触发。切换任务时，新任务触发开始事件，原任务触发停止事件。',
  matches: (event) => event.type === 'taskStarted',
};

export const TriggerTaskStopped: IAutomationTrigger = {
  id: 'taskStopped',
  name: '任务停止时',
  description: '任务暂停或停止计时但未完成时触发。切换任务时，也会为原任务触发此事件。',
  matches: (event) => event.type === 'taskStopped',
};

export const TriggerTimeBased: IAutomationTrigger = {
  id: 'timeBased',
  name: '指定时间',
  matches: (event) => event.type === 'timeBased',
};

export const TriggerShortcut: IAutomationTrigger = {
  id: 'shortcut',
  name: '键盘快捷键',
  description:
    '按此规则的快捷键时触发。可在“设置 → 键盘快捷键”中指定按键。操作作用于当前选中的任务。',
  matches: (event) => event.type === 'shortcut',
};
