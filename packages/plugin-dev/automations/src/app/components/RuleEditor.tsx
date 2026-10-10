import { automationLabel } from '../labels';
import { For, createSignal, createEffect } from 'solid-js';
import { AutomationRule, AutomationTriggerType, Condition, Action } from '../../types';
import { Dialog } from './Dialog';
import { ConditionDialog } from './ConditionDialog';
import { ActionDialog } from './ActionDialog';

interface RuleEditorProps {
  isOpen: boolean;
  rule: AutomationRule;
  projects?: { id: string; title: string }[];
  tags?: { id: string; title: string }[];
  onSave: (rule: AutomationRule) => void;
  onDelete: (rule: AutomationRule) => void;
  onCancel: () => void;
}

export function RuleEditor(props: RuleEditorProps) {
  // We need local state for the rule being edited to allow cancelling changes
  // But for simplicity in this MVP, we'll edit the prop directly or assume parent handles cloning.
  // To properly support "Cancel", we should clone on open.
  // Let's assume parent passes a clone, or we clone it here.
  // Since we can't easily clone in a functional component body without effects, let's rely on the parent passing a fresh object or clone.

  // However, we need to manage the state of child dialogs.
  const [isConditionDialogOpen, setIsConditionDialogOpen] = createSignal(false);
  const [editingConditionIndex, setEditingConditionIndex] = createSignal<number>(-1);

  const [isActionDialogOpen, setIsActionDialogOpen] = createSignal(false);
  const [editingActionIndex, setEditingActionIndex] = createSignal<number>(-1);

  // Actually, let's use a local signal for the rule to ensure reactivity and cancellation support
  const [localRule, setLocalRule] = createSignal<AutomationRule>(props.rule);

  // Sync local rule when prop changes (dialog opens)

  createEffect(() => {
    if (props.isOpen) {
      setLocalRule(JSON.parse(JSON.stringify(props.rule)));
    }
  });

  const saveLocalRule = () => {
    props.onSave(localRule());
  };

  const triggerTypes: AutomationTriggerType[] = [
    'taskCreated',
    'taskUpdated',
    'taskCompleted',
    'taskStarted',
    'taskStopped',
    'timeBased',
    'shortcut',
  ];

  const isTimeBased = () => localRule().trigger.type === 'timeBased';

  const allowedConditionTypes = (): import('../../types').ConditionType[] => {
    if (isTimeBased()) return [];
    return ['titleContains', 'titleStartsWith', 'projectIs', 'hasTag', 'weekdayIs'];
  };

  const allowedActionTypes = (): import('../../types').ActionType[] => {
    if (isTimeBased()) {
      return ['createTask', 'displaySnack', 'displayDialog', 'webhook'];
    }
    return [
      'createTask',
      'deleteTask',
      'addTag',
      'removeTag',
      'moveToProject',
      'displaySnack',
      'displayDialog',
      'webhook',
    ];
  };

  const formatActionLabel = (action: Action) => {
    if (action.type === 'deleteTask') {
      return automationLabel('deleteTask');
    }
    return `${automationLabel(action.type)}: ${action.value}`;
  };

  // Condition handlers
  const handleSaveCondition = (condition: Condition) => {
    const currentRule = localRule();
    const newConditions = [...currentRule.conditions];
    if (editingConditionIndex() >= 0) {
      newConditions[editingConditionIndex()] = condition;
    } else {
      newConditions.push(condition);
    }
    setLocalRule({ ...currentRule, conditions: newConditions });
    setIsConditionDialogOpen(false);
  };

  const handleRemoveCondition = (index: number) => {
    const currentRule = localRule();
    const newConditions = currentRule.conditions.filter((_, i) => i !== index);
    setLocalRule({ ...currentRule, conditions: newConditions });
  };

  // Action handlers
  const handleSaveAction = (action: Action) => {
    const currentRule = localRule();
    const newActions = [...currentRule.actions];
    if (editingActionIndex() >= 0) {
      newActions[editingActionIndex()] = action;
    } else {
      newActions.push(action);
    }
    setLocalRule({ ...currentRule, actions: newActions });
    setIsActionDialogOpen(false);
  };

  const handleRemoveAction = (index: number) => {
    const currentRule = localRule();
    const newActions = currentRule.actions.filter((_, i) => i !== index);
    setLocalRule({ ...currentRule, actions: newActions });
  };

  const formatConditionLabel = (condition: Condition) => {
    const regexSuffix = condition.isRegex ? '（正则表达式）' : '';
    return `${automationLabel(condition.type)}${regexSuffix}: ${condition.value}`;
  };

  return (
    <>
      <Dialog
        isOpen={props.isOpen}
        onClose={props.onCancel}
        title={localRule().id ? '编辑规则' : '新建规则'}
        footer={
          <div class="grid">
            <div style={{ 'text-align': 'left' }}>
              {localRule().id && (
                <button onClick={() => props.onDelete(localRule())}>删除规则</button>
              )}
            </div>
            <div style={{ 'text-align': 'right' }}>
              <button
                class="btn-outline"
                onClick={props.onCancel}
                style={{ 'margin-right': '0.5rem' }}
              >
                取消
              </button>
              <button class="btn-primary" onClick={saveLocalRule}>
                保存规则
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <label>
            规则名称
            <input
              type="text"
              value={localRule().name}
              onInput={(e) => setLocalRule({ ...localRule(), name: e.currentTarget.value })}
              placeholder="例如：自动给紧急任务加标签"
            />
          </label>

          <label>
            触发条件
            <select
              value={localRule().trigger.type}
              onChange={(e) =>
                setLocalRule({
                  ...localRule(),
                  trigger: { type: e.currentTarget.value as AutomationTriggerType },
                })
              }
            >
              {triggerTypes.map((t) => (
                <option value={t}>{automationLabel(t)}</option>
              ))}
            </select>
          </label>

          {localRule().trigger.type === 'shortcut' && (
            <p>
              <small>
                保存规则后，在<em>设置 → 键盘快捷键</em>的<em>自动化</em>
                分类中按规则名称指定按键。操作作用于当前选中的任务；没有选中任务时，仅执行创建任务、显示提示、弹窗和
                Webhook 等独立操作。
              </small>
            </p>
          )}

          {localRule().trigger.type === 'timeBased' && (
            <>
              <div class="warning-box">
                <small>
                  <strong>警告：</strong>{' '}
                  定时触发仅在应用运行时有效。应用处于后台时，触发可能不可靠。
                  <br />
                  <em>注意：定时触发可用的条件和操作有所限制。</em>
                </small>
              </div>

              <label>
                时间（24 小时制）
                <input
                  type="time"
                  value={localRule().trigger.value || ''}
                  onInput={(e) =>
                    setLocalRule({
                      ...localRule(),
                      trigger: { ...localRule().trigger, value: e.currentTarget.value },
                    })
                  }
                  required
                />
              </label>
            </>
          )}

          {allowedConditionTypes().length > 0 && (
            <>
              <hr />

              <div class="section">
                <div class="grid">
                  <div>
                    <h4>条件</h4>
                  </div>
                  <div style={{ 'text-align': 'right' }}>
                    <button
                      onClick={() => {
                        setEditingConditionIndex(-1);
                        setIsConditionDialogOpen(true);
                      }}
                    >
                      + 添加
                    </button>
                  </div>
                </div>

                <table role="grid">
                  <tbody>
                    <For
                      each={localRule().conditions}
                      fallback={
                        <tr>
                          <td colspan={2}>
                            <small>暂无条件</small>
                          </td>
                        </tr>
                      }
                    >
                      {(condition, i) => (
                        <tr>
                          <td>{formatConditionLabel(condition)}</td>
                          <td style={{ 'text-align': 'right' }}>
                            <button
                              class="btn-outline"
                              onClick={() => {
                                setEditingConditionIndex(i());
                                setIsConditionDialogOpen(true);
                              }}
                              style={{ 'margin-right': '0.5rem' }}
                            >
                              编辑
                            </button>
                            <button onClick={() => handleRemoveCondition(i())}>✕</button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <hr />

          <div class="section">
            <div class="grid">
              <div>
                <h4>操作</h4>
              </div>
              <div style={{ 'text-align': 'right' }}>
                <button
                  onClick={() => {
                    setEditingActionIndex(-1);
                    setIsActionDialogOpen(true);
                  }}
                >
                  + 添加
                </button>
              </div>
            </div>

            <table role="grid">
              <tbody>
                <For
                  each={localRule().actions}
                  fallback={
                    <tr>
                      <td colspan={2}>
                        <small>暂无操作</small>
                      </td>
                    </tr>
                  }
                >
                  {(action, i) => (
                    <tr>
                      <td>{formatActionLabel(action)}</td>
                      <td style={{ 'text-align': 'right' }}>
                        <button
                          class="btn-outline"
                          onClick={() => {
                            setEditingActionIndex(i());
                            setIsActionDialogOpen(true);
                          }}
                          style={{ 'margin-right': '0.5rem' }}
                        >
                          编辑
                        </button>
                        <button onClick={() => handleRemoveAction(i())}>✕</button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </form>
      </Dialog>

      <ConditionDialog
        isOpen={isConditionDialogOpen()}
        onClose={() => setIsConditionDialogOpen(false)}
        onSave={handleSaveCondition}
        projects={props.projects}
        tags={props.tags}
        initialCondition={
          editingConditionIndex() >= 0 ? localRule().conditions[editingConditionIndex()] : undefined
        }
        allowedTypes={allowedConditionTypes()}
      />

      <ActionDialog
        isOpen={isActionDialogOpen()}
        onClose={() => setIsActionDialogOpen(false)}
        onSave={handleSaveAction}
        initialAction={
          editingActionIndex() >= 0 ? localRule().actions[editingActionIndex()] : undefined
        }
        projects={props.projects}
        allowedTypes={allowedActionTypes()}
      />
    </>
  );
}
