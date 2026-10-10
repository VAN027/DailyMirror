import { Component, createSignal, Show, For, onMount } from 'solid-js';
import { PromptCategory } from '../types';
import {
  renderPrompt,
  formatTasksAsMarkdown,
  copyToClipboard,
  createChatGPTUrl,
  isValidProjectSelection,
} from '../utils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTaskData } from '../hooks/useApi';
import { Button } from './shared/Button';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface SelectedPrompt {
  category: PromptCategory;
  prompt: { title: string; template: string };
}

interface PromptViewProps {
  selectedPrompt: SelectedPrompt;
  onUpdatePrompt: (prompt: string) => void;
}

const TASK_SELECTION_KEY = 'ai-productivity-task-selection';

const PromptView: Component<PromptViewProps> = (props) => {
  const [taskSelection, setTaskSelection] = useLocalStorage(TASK_SELECTION_KEY, 'none');
  const [taskCounts, setTaskCounts] = createSignal<Record<string, number>>({});
  const [taskPreviews, setTaskPreviews] = createSignal<Record<string, string[]>>({});
  const [projects, setProjects] = createSignal<Array<{ id: string; title: string }>>([]);
  const [generatedPrompt, setGeneratedPrompt] = createSignal<string>('');
  const [copyButtonText, setCopyButtonText] = createSignal('📋 复制到剪贴板');

  const { isLoading, loadTaskCounts, getTasksForSelection } = useTaskData();

  const loadAllTaskData = async () => {
    const { counts, previews, projects: loadedProjects } = await loadTaskCounts();
    setTaskCounts(counts);
    setTaskPreviews(previews);
    setProjects(loadedProjects);
  };

  const validateAndUpdateSelection = () => {
    const currentSelection = taskSelection();
    if (!isValidProjectSelection(currentSelection, projects())) {
      setTaskSelection('none');
    }
  };

  const regeneratePrompt = async () => {
    const prompt = props.selectedPrompt?.prompt;
    if (!prompt) return;

    let tasksMd = '';
    const selection = taskSelection();

    if (selection !== 'none') {
      const tasks = await getTasksForSelection(selection);
      if (tasks.length > 0) {
        tasksMd = formatTasksAsMarkdown(tasks);
      }
    }

    const rendered = renderPrompt(prompt.template, tasksMd);
    setGeneratedPrompt(rendered);
    props.onUpdatePrompt(rendered);
  };

  const handleTaskSelectionChange = async (newSelection: string) => {
    setTaskSelection(newSelection);
    await regeneratePrompt();
  };

  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard(generatedPrompt());

    if (success) {
      setCopyButtonText('已复制！');
      setTimeout(() => setCopyButtonText('📋 复制到剪贴板'), 1500);
    }
  };

  const getSelectionDisplayName = () => {
    const selection = taskSelection();
    if (selection === 'today') return '今日任务';
    if (selection === 'context') return '当前工作区任务';
    if (selection === 'all') return '全部任务';
    if (selection.startsWith('project-')) {
      const project = projects().find((p) => `project-${p.id}` === selection);
      return project?.title || '项目';
    }
    return '';
  };

  onMount(async () => {
    await loadAllTaskData();
    validateAndUpdateSelection();
    await regeneratePrompt();
  });

  return (
    <div class="page-fade">
      <div class="selected-prompt-header">
        <h2 class="text-primary">{props.selectedPrompt.prompt.title}</h2>
      </div>

      <div class="prompt-options">
        <label class="dropdown-label">
          在提示词中包含任务：
          <select
            class="task-dropdown"
            value={taskSelection()}
            onChange={(e) => handleTaskSelectionChange(e.target.value)}
          >
            <option value="none">不包含任务</option>
            <option value="today">今日任务（{taskCounts().today || 0} 个任务）</option>
            <option value="context">
              当前项目 / 工作区（{taskCounts().context || 0} 个任务）
            </option>
            <optgroup label="各个项目">
              <For each={projects()}>
                {(project) => (
                  <option value={`project-${project.id}`}>
                    {project.title}（{taskCounts()[`project-${project.id}`] || 0} 个任务）
                  </option>
                )}
              </For>
            </optgroup>
            <option value="all">全部任务（{taskCounts().all || 0} 个任务）</option>
          </select>
        </label>

        <div class="task-preview">
          <Show when={isLoading()}>
            <LoadingSpinner message="正在加载任务…" />
          </Show>

          <Show when={!isLoading()}>
            <Show when={taskSelection() === 'none'}>
              <span class="task-count-info text-muted">不会包含任务</span>
            </Show>

            <Show when={taskSelection() !== 'none'}>
              <TaskPreview
                selection={taskSelection()}
                previews={taskPreviews()}
                counts={taskCounts()}
                displayName={getSelectionDisplayName()}
              />
            </Show>
          </Show>
        </div>
      </div>

      <textarea
        class="prompt-text"
        value={generatedPrompt()}
        readonly
        rows="15"
      />

      <div class="prompt-actions">
        <Button onClick={handleCopyToClipboard}>{copyButtonText()}</Button>
        <a
          class="chatgpt-button"
          href={createChatGPTUrl(generatedPrompt())}
          target="_blank"
          rel="noopener noreferrer"
        >
          🤖 在 ChatGPT 中打开
        </a>
      </div>
    </div>
  );
};

// Extracted TaskPreview component
const TaskPreview: Component<{
  selection: string;
  previews: Record<string, string[]>;
  counts: Record<string, number>;
  displayName: string;
}> = (props) => {
  const tasks = () => props.previews[props.selection] || [];
  const hasNoTasks = () => tasks().length === 0;

  return (
    <div class="task-preview-content">
      <Show when={hasNoTasks()}>
        <span class="task-count-info text-muted">所选范围内暂无任务</span>
      </Show>

      <Show when={!hasNoTasks()}>
        <div class="task-count-header">
          {props.displayName}（{props.counts[props.selection] || 0}):
        </div>
        <div class="task-preview-list">
          <For each={tasks().slice(0, 3)}>
            {(taskTitle) => <div class="task-preview-item">• {taskTitle}</div>}
          </For>
          <Show when={tasks().length > 3}>
            <div class="task-preview-more">…还有 {tasks().length - 3} 个</div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default PromptView;
