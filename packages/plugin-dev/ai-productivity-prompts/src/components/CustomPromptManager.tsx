import { Component, createSignal, For, onMount } from 'solid-js';
import { CustomPrompt } from '../types';
import { CustomPromptStore } from '../customPromptStore';
import { truncateText } from '../utils';
import { Button } from './shared/Button';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { EmptyState } from './shared/EmptyState';
import { Card } from './shared/Card';

interface CustomPromptManagerProps {
  onSelectPrompt: (prompt: CustomPrompt, index: number) => void;
  onEditPrompt: (prompt: CustomPrompt | null, index?: number) => void;
}

const CustomPromptManager: Component<CustomPromptManagerProps> = (props) => {
  const [prompts, setPrompts] = createSignal<CustomPrompt[]>([]);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const store = CustomPromptStore.getInstance();

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const loadedPrompts = await store.loadPrompts();
      setPrompts(loadedPrompts);
    } catch (error) {
      console.error('Error loading custom prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrompt = async (index: number) => {
    const prompt = prompts()[index];

    if (!confirm(`确定删除提示词“${prompt.title}”吗？此操作无法撤销。`)) {
      return;
    }

    try {
      await store.deletePrompt(index);
      await loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('删除提示词失败，请重试。');
    }
  };

  const CreatePromptButton = () => (
    <Button onClick={() => props.onEditPrompt(null)}>➕ 添加自定义提示词</Button>
  );

  onMount(loadPrompts);

  return (
    <div class="page-fade">
      <div class="custom-prompts-header">
        <h2 class="text-primary">我的自定义提示词</h2>
        <CreatePromptButton />
      </div>

      {isLoading() ? (
        <LoadingSpinner message="正在加载自定义提示词…" />
      ) : prompts().length === 0 ? (
        <EmptyState
          title="暂无自定义提示词。"
          message="创建第一个自定义提示词开始使用。"
          action={<CreatePromptButton />}
        />
      ) : (
        <div class="custom-prompts-list">
          <For each={prompts()}>
            {(prompt, index) => (
              <PromptCard
                prompt={prompt}
                index={index()}
                onSelect={() => props.onSelectPrompt(prompt, index())}
                onEdit={() => props.onEditPrompt(prompt, index())}
                onDelete={() => handleDeletePrompt(index())}
              />
            )}
          </For>
        </div>
      )}
    </div>
  );
};

// Extracted PromptCard component
const PromptCard: Component<{
  prompt: CustomPrompt;
  index: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = (props) => {
  return (
    <div class="custom-prompt-card card">
      <div class="custom-prompt-header">
        <h3 class="prompt-title">{props.prompt.title}</h3>
        <div class="prompt-actions">
          <Button
            variant="secondary"
            onClick={props.onEdit}
            title="编辑提示词"
          >
            ✏️
          </Button>
          <Button
            variant="secondary"
            onClick={props.onDelete}
            title="删除提示词"
          >
            🗑️
          </Button>
        </div>
      </div>

      <div class="prompt-preview">
        <p class="text-muted">{truncateText(props.prompt.template)}</p>
      </div>

      <div class="prompt-card-actions">
        <Button onClick={props.onSelect}>使用此提示词</Button>
      </div>
    </div>
  );
};

export default CustomPromptManager;
