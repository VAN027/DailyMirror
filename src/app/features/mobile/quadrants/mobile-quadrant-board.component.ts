import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { BoardComponent } from '../../boards/board/board.component';
import { BoardPanelComponent } from '../../boards/board-panel/board-panel.component';
import { doesTaskMatchPanel } from '../../boards/boards.util';
import { selectAllTasksInActiveProjects } from '../../tasks/store/task.selectors';
import { selectUnarchivedProjects } from '../../project/store/project.selectors';
import { TaskMultiSelectService } from '../../tasks/task-multi-select.service';
import { setSelectedTask } from '../../tasks/store/task.actions';
import { TaskCopy } from '../../tasks/task.model';

@Component({
  selector: 'mobile-quadrant-board',
  imports: [BoardPanelComponent, MatIcon, MatButton, TranslatePipe, CdkDropList],
  templateUrl: './mobile-quadrant-board.component.html',
  styleUrl: './mobile-quadrant-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileQuadrantBoardComponent extends BoardComponent {
  private readonly _mobileStore = inject(Store);
  private readonly _multiSelect = inject(TaskMultiSelectService);
  private readonly _tasks = this._mobileStore.selectSignal(
    selectAllTasksInActiveProjects,
  );
  private readonly _projects = this._mobileStore.selectSignal(selectUnarchivedProjects);
  readonly selectedPanelId = signal<string | null>(null);
  readonly isDropping = signal(false);
  private readonly _destinationPanels = viewChildren(BoardPanelComponent);

  readonly panels = computed(() => {
    const backlog = new Set(
      this._projects().flatMap((project) => project.backlogTaskIds),
    );
    const tasks = this._tasks().filter((task) => !this.hideCompleted() || !task.isDone);
    return this.boardCfg().panels.map((panel) => ({
      panel,
      count: tasks.filter((task) =>
        doesTaskMatchPanel(task, panel, (candidate) =>
          backlog.has(candidate.parentId || candidate.id),
        ),
      ).length,
    }));
  });

  readonly selectedPanel = computed(
    () =>
      this.panels().find(({ panel }) => panel.id === this.selectedPanelId()) ||
      this.panels()[0],
  );

  selectPanel(id: string): void {
    this._multiSelect.clear();
    this._mobileStore.dispatch(setSelectedTask({ id: null }));
    this.selectedPanelId.set(id);
  }

  async dropOnQuadrant(
    event: CdkDragDrop<TaskCopy[], TaskCopy[], TaskCopy>,
    panelId: string,
  ): Promise<void> {
    if (
      !event.isPointerOverContainer ||
      this.isDropping() ||
      panelId === this.selectedPanel()?.panel.id
    )
      return;
    const destination = this._destinationPanels().find(
      (panel) => panel.panelCfg().id === panelId,
    );
    if (!destination) return;
    this.isDropping.set(true);
    try {
      await destination.drop(event);
    } finally {
      this.isDropping.set(false);
    }
  }
}
