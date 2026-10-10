import { automationLabel } from '../labels';
import { createEffect, createSignal } from 'solid-js';
import { Action, ActionType } from '../../types';
import { Dialog } from './Dialog';

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (action: Action) => void;
  initialAction?: Action;
  projects?: { id: string; title: string }[];
  allowedTypes?: ActionType[];
}

export function ActionDialog(props: ActionDialogProps) {
  const [action, setAction] = createSignal<Action>({ type: 'createTask', value: '' });

  const allTypes: ActionType[] = [
    'createTask',
    'deleteTask',
    'addTag',
    'removeTag',
    'moveToProject',
    'displaySnack',
    'displayDialog',
    'webhook',
  ];
  const availableTypes = () =>
    props.allowedTypes ? allTypes.filter((t) => props.allowedTypes!.includes(t)) : allTypes;

  createEffect(() => {
    if (props.isOpen) {
      if (props.initialAction) {
        setAction({ ...props.initialAction });
      } else {
        const firstType = availableTypes()[0] || 'createTask';
        setAction({ type: firstType, value: '' });
      }
    }
  });

  const getPlaceholder = () => {
    switch (action().type) {
      case 'createTask':
        return '例如“跟进任务”';
      case 'deleteTask':
        return '删除触发此规则的任务';
      case 'addTag':
      case 'removeTag':
        return 'e.g. "review-needed"';
      case 'moveToProject':
        return '例如“项目 A”';
      case 'displaySnack':
        return '例如“任务已完成！”';
      case 'displayDialog':
        return '例如“请记得……”';
      case 'webhook':
        return 'e.g. "https://hooks.slack.com/..."';
      default:
        return '';
    }
  };

  const handleTypeChange = (type: ActionType) => {
    setAction({
      ...action(),
      type,
      value: type === 'deleteTask' ? '' : action().value,
    });
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.initialAction ? '编辑操作' : '添加操作'}
      footer={
        <div class="grid">
          <button class="btn-outline" onClick={props.onClose}>
            取消
          </button>
          <button
            class="btn-primary"
            disabled={action().type !== 'deleteTask' && !action().value.trim()}
            onClick={() => props.onSave(action())}
          >
            保存
          </button>
        </div>
      }
    >
      <label>
        类型
        <select
          value={action().type}
          onChange={(e) => handleTypeChange(e.currentTarget.value as ActionType)}
        >
          {availableTypes().map((t) => (
            <option value={t}>{automationLabel(t)}</option>
          ))}
        </select>
      </label>
      <label>
        内容
        {action().type === 'moveToProject' && props.projects?.length ? (
          <select
            value={action().value}
            onChange={(e) => setAction({ ...action(), value: e.currentTarget.value })}
          >
            <option value="">选择项目</option>
            {props.projects.map((p) => (
              <option value={p.id}>{p.title}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={action().value}
            disabled={action().type === 'deleteTask'}
            onInput={(e) => setAction({ ...action(), value: e.currentTarget.value })}
            placeholder={getPlaceholder()}
          />
        )}
      </label>
      {action().type === 'webhook' && (
        <p
          style={{
            color: 'var(--color-warning)',
            'font-size': '0.875em',
            'margin-top': 'var(--s)',
          }}
        >
          ⚠️ 警告：完整任务数据（包括标题、描述等）将发送到此地址，请确认接收端可信。
        </p>
      )}
    </Dialog>
  );
}
