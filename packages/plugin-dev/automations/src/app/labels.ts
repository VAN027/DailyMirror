// Labels are separate from the stable identifiers stored in automation rules.
const LABELS: Record<string, string> = {
  taskCreated: '任务创建时',
  taskUpdated: '任务更新时',
  taskCompleted: '任务完成时',
  taskStarted: '任务开始时',
  taskStopped: '任务停止时',
  timeBased: '指定时间',
  shortcut: '键盘快捷键',
  titleContains: '标题包含',
  titleStartsWith: '标题开头为',
  projectIs: '所属项目为',
  hasTag: '包含标签',
  weekdayIs: '星期为',
  createTask: '创建任务',
  deleteTask: '删除任务',
  addTag: '添加标签',
  removeTag: '移除标签',
  moveToProject: '移动到项目',
  displaySnack: '显示提示',
  displayDialog: '显示弹窗',
  webhook: '调用 Webhook',
};

export const automationLabel = (id: string): string => LABELS[id] ?? id;
