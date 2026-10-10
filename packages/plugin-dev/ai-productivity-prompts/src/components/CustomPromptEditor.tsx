import { Component, createSignal, onMount } from 'solid-js';
import { CustomPrompt } from '../types';
import { CustomPromptStore } from '../customPromptStore';

interface CustomPromptEditorProps {
  prompt: CustomPrompt | null;
  index?: number;
  onSave: () => void;
  onCancel: () => void;
}

const CustomPromptEditor: Component<CustomPromptEditorProps> = (props) => {
  const [promptTitle, setPromptTitle] = createSignal<string>('');
  const [promptText, setPromptText] = createSignal<string>('');
  const [isSaving, setIsSaving] = createSignal<boolean>(false);

  const store = CustomPromptStore.getInstance();
  const isEditing = () => props.prompt !== null;

  onMount(() => {
    if (props.prompt) {
      setPromptTitle(props.prompt.title);
      setPromptText(props.prompt.template);
    }
  });

  const handleSave = async () => {
    const title = promptTitle().trim();
    const text = promptText().trim();

    if (!title) {
      alert('请输入提示词标题。');
      return;
    }

    if (!text) {
      alert('请输入提示词模板。');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing() && props.index !== undefined) {
        await store.updatePrompt(props.index, title, text);
      } else {
        await store.addPrompt(title, text);
      }
      props.onSave();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('保存提示词失败，请重试。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div class="page-fade">
      <div class="editor-header">
        <h2 class="text-primary">
          {isEditing() ? '编辑自定义提示词' : '创建自定义提示词'}
        </h2>
      </div>

      <div class="editor-container">
        <div class="editor-instructions">
          <p class="text-muted">
            创建自定义提示词模板。使用时，当前任务会自动附加到提示词中。
          </p>
          <p class="text-muted">
            <strong>提示：</strong> 按 Ctrl+Enter（或 Cmd+Enter）快速保存。
          </p>
        </div>

        <div class="editor-field">
          <label
            for="prompt-title"
            class="field-label"
          >
            提示词标题：
          </label>
          <input
            id="prompt-title"
            type="text"
            class="prompt-title-input"
            value={promptTitle()}
            onInput={(e) => setPromptTitle(e.currentTarget.value)}
            placeholder="例如：每日优先级规划"
            autocomplete="off"
          />
        </div>

        <div class="editor-field">
          <label
            for="prompt-textarea"
            class="field-label"
          >
            提示词模板：
          </label>
          <textarea
            id="prompt-textarea"
            class="prompt-textarea"
            value={promptText()}
            onInput={(e) => setPromptText(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="在此输入自定义提示词…

例如：
请根据紧急程度、重要程度、任务依赖、当前精力和可用时间，帮我安排今天的任务优先级，并给出包含预计用时的具体行动计划。"
            rows="12"
            autocomplete="off"
            spellcheck={true}
          />
        </div>

        <div class="editor-actions">
          <button
            class="btn-outline"
            onClick={props.onCancel}
            disabled={isSaving()}
          >
            取消
          </button>
          <button
            class="btn-primary"
            onClick={handleSave}
            disabled={isSaving() || !promptTitle().trim() || !promptText().trim()}
          >
            {isSaving() ? '正在保存…' : isEditing() ? '更新提示词' : '保存提示词'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomPromptEditor;
