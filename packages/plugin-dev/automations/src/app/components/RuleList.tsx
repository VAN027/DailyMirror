import { automationLabel } from '../labels';
import { For } from 'solid-js';
import { AutomationRule } from '../../types';

interface RuleListProps {
  rules: AutomationRule[];
  onEdit: (rule: AutomationRule) => void;
  onDelete: (rule: AutomationRule) => void;
  onToggleStatus: (rule: AutomationRule) => void;
  onCreate: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
}

export function RuleList(props: RuleListProps) {
  let fileInputRef: HTMLInputElement | undefined;

  const handleImportClick = () => {
    fileInputRef?.click();
  };

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      props.onImport(target.files[0]);
      target.value = ''; // Reset
    }
  };

  return (
    <div class="rule-list-container">
      <div class="grid">
        <div>
          <h2>自动化规则</h2>
        </div>
        <div class="warning-box">
          <strong>警告：</strong>{' '}
          此插件权限较大，使用不当可能破坏数据。请谨慎配置，使用风险需自行承担。
        </div>

        <div style={{ 'text-align': 'right' }}>
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            ref={fileInputRef!}
            onChange={handleFileChange}
          />
          <button
            class="btn-outline"
            onClick={handleImportClick}
            style={{ 'margin-right': '0.5rem' }}
          >
            导入
          </button>
          <button class="btn-outline" onClick={props.onExport} style={{ 'margin-right': '0.5rem' }}>
            导出
          </button>
          <button class="btn-primary" onClick={props.onCreate}>
            + 新建规则
          </button>
        </div>
      </div>

      <figure>
        <table role="grid">
          <thead>
            <tr>
              <th scope="col">名称</th>
              <th scope="col">触发条件</th>
              <th scope="col">状态</th>
              <th scope="col" style={{ 'text-align': 'right' }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <For
              each={props.rules}
              fallback={
                <tr>
                  <td colspan={4}>暂无规则，创建一个规则开始使用。</td>
                </tr>
              }
            >
              {(rule) => (
                <tr>
                  <td>{rule.name}</td>
                  <td>
                    {automationLabel(rule.trigger.type)}
                    {rule.trigger.value ? ` (${rule.trigger.value})` : ''}
                  </td>
                  <td style={{ 'text-align': 'right', 'white-space': 'nowrap' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={rule.isEnabled}
                        onChange={() => props.onToggleStatus(rule)}
                      />
                      {rule.isEnabled ? ' 已启用' : ' 已停用'}
                    </label>
                  </td>
                  <td style={{ 'text-align': 'right', 'white-space': 'nowrap' }}>
                    <button
                      class="btn-outline"
                      onClick={() => props.onEdit(rule)}
                      style={{ 'margin-right': '0.5rem' }}
                    >
                      编辑
                    </button>
                    <button onClick={() => props.onDelete(rule)}>删除</button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </figure>
    </div>
  );
}
