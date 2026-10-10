import { Component, For } from 'solid-js';
import { PromptCategory } from '../types';
import { PROMPT_CATEGORIES } from '../prompts';
import { Card } from './shared/Card';

interface HomeViewProps {
  onSelectCategory: (category: PromptCategory) => void;
  onCustomPromptsClick: () => void;
}

const HomeView: Component<HomeViewProps> = (props) => {
  return (
    <>
      <div class="intro page-fade">
        <h2>AI 效率提示词</h2>
        <p class="text-muted">选择您需要的帮助：</p>
      </div>

      <div class="category-grid page-fade">
        <For each={PROMPT_CATEGORIES}>
          {(category) => (
            <CategoryCard
              category={category}
              onClick={() => props.onSelectCategory(category)}
            />
          )}
        </For>

        <Card
          onClick={props.onCustomPromptsClick}
          class="custom-prompts-card"
        >
          <h3 class="text-primary">我的自定义提示词</h3>
          <p class="text-muted">创建和管理自己的提示词</p>
        </Card>
      </div>
    </>
  );
};

// Extracted CategoryCard component
const CategoryCard: Component<{
  category: PromptCategory;
  onClick: () => void;
}> = (props) => {
  return (
    <Card
      onClick={props.onClick}
      class="category-card"
    >
      <h3 class="text-primary">{props.category.title}</h3>
      <p class="text-muted">{props.category.prompts.length} 个提示词</p>
    </Card>
  );
};

export default HomeView;
