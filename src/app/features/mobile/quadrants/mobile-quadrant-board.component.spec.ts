import { Component, forwardRef, input, output } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MobileQuadrantBoardComponent } from './mobile-quadrant-board.component';
import { BoardPanelComponent } from '../../boards/board-panel/board-panel.component';
import { BoardPanelCfg } from '../../boards/boards.model';
import { DEFAULT_BOARDS } from '../../boards/boards.const';
import { DEFAULT_TASK, Task, TaskCopy } from '../../tasks/task.model';
import { selectAllTasksInActiveProjects } from '../../tasks/store/task.selectors';
import { selectUnarchivedProjects } from '../../project/store/project.selectors';
import { selectAllTagIds } from '../../tag/store/tag.reducer';
import { IMPORTANT_TAG, URGENT_TAG } from '../../tag/tag.const';
import { TaskMultiSelectService } from '../../tasks/task-multi-select.service';
import { setSelectedTask } from '../../tasks/store/task.actions';

@Component({
  selector: 'board-panel',
  template: '{{ panelCfg().id }}',
  providers: [
    { provide: BoardPanelComponent, useExisting: forwardRef(() => PanelStubComponent) },
  ],
})
class PanelStubComponent {
  panelCfg = input.required<BoardPanelCfg>();
  hideCompleted = input(false);
  editBoard = output<void>();
  drop = jasmine.createSpy('drop').and.resolveTo();
}

describe('MobileQuadrantBoardComponent', () => {
  let fixture: ComponentFixture<MobileQuadrantBoardComponent>;
  let store: MockStore;
  const clear = jasmine.createSpy('clear');
  const board = DEFAULT_BOARDS[0];
  const task = (id: string, tagIds: string[], extra: Partial<Task> = {}): Task => ({
    ...DEFAULT_TASK,
    id,
    projectId: 'project',
    tagIds,
    ...extra,
  });
  const tasks = [
    task('both', [IMPORTANT_TAG.id, URGENT_TAG.id]),
    task('important', [IMPORTANT_TAG.id]),
    task('urgent', [URGENT_TAG.id]),
    task('neither', []),
    task('done', [IMPORTANT_TAG.id, URGENT_TAG.id], { isDone: true }),
    task('child', [IMPORTANT_TAG.id], { parentId: 'important' }),
  ];

  beforeEach(async () => {
    clear.calls.reset();
    await TestBed.configureTestingModule({
      imports: [MobileQuadrantBoardComponent, TranslateModule.forRoot()],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAllTasksInActiveProjects, value: tasks },
            { selector: selectUnarchivedProjects, value: [] },
            { selector: selectAllTagIds, value: [IMPORTANT_TAG.id, URGENT_TAG.id] },
          ],
        }),
        { provide: MatDialog, useValue: {} },
        { provide: TaskMultiSelectService, useValue: { clear } },
      ],
    })
      .overrideComponent(MobileQuadrantBoardComponent, {
        remove: { imports: [BoardPanelComponent] },
        add: { imports: [PanelStubComponent] },
      })
      .compileComponents();
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(MobileQuadrantBoardComponent);
    fixture.componentRef.setInput('boardCfg', board);
    fixture.componentRef.setInput('hideCompleted', true);
    fixture.detectChanges();
  });

  it('counts matching parent tasks and reacts to completion visibility', () => {
    expect(fixture.componentInstance.panels().map((item) => item.count)).toEqual([
      1, 1, 1, 1,
    ]);
    fixture.componentRef.setInput('hideCompleted', false);
    fixture.detectChanges();
    expect(fixture.componentInstance.panels().map((item) => item.count)).toEqual([
      2, 1, 1, 1,
    ]);
    store.overrideSelector(selectAllTasksInActiveProjects, []);
    store.refreshState();
    fixture.detectChanges();
    expect(fixture.componentInstance.panels().map((item) => item.count)).toEqual([
      0, 0, 0, 0,
    ]);
  });

  it('switches the single task panel without modifying board or task data', () => {
    const dispatch = spyOn(store, 'dispatch');
    const tiles: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.quadrant-tile');
    tiles[1].click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('board-panel:not([hidden])').length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelector('board-panel:not([hidden])').textContent,
    ).toBe(board.panels[1].id);
    expect(tiles[1].getAttribute('aria-pressed')).toBe('true');
    expect(clear).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledOnceWith(setSelectedTask({ id: null }));
  });

  it('falls back to an existing panel when the selected panel is removed', () => {
    fixture.componentInstance.selectPanel(board.panels[1].id);
    fixture.componentRef.setInput('boardCfg', { ...board, panels: [board.panels[0]] });
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedPanel()?.panel.id).toBe(board.panels[0].id);
  });

  it('delegates a tile drop to the destination panel and blocks overlapping drops', async () => {
    const destination: PanelStubComponent = fixture.debugElement.queryAll(
      By.directive(PanelStubComponent),
    )[0].componentInstance;
    fixture.componentInstance.selectPanel(board.panels[3].id);
    const event = { isPointerOverContainer: true } as CdkDragDrop<
      TaskCopy[],
      TaskCopy[],
      TaskCopy
    >;
    let finish!: () => void;
    destination.drop.and.returnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const pending = fixture.componentInstance.dropOnQuadrant(event, board.panels[0].id);
    expect(fixture.componentInstance.isDropping()).toBeTrue();
    await fixture.componentInstance.dropOnQuadrant(event, board.panels[0].id);
    expect(destination.drop).toHaveBeenCalledOnceWith(event);
    finish();
    await pending;
    expect(fixture.componentInstance.isDropping()).toBeFalse();
  });

  it('ignores a cancelled drop or a drop onto the current quadrant', async () => {
    const destinations = fixture.debugElement.queryAll(By.directive(PanelStubComponent));
    const event = { isPointerOverContainer: false } as CdkDragDrop<
      TaskCopy[],
      TaskCopy[],
      TaskCopy
    >;
    await fixture.componentInstance.dropOnQuadrant(event, board.panels[1].id);
    await fixture.componentInstance.dropOnQuadrant(
      { ...event, isPointerOverContainer: true },
      board.panels[0].id,
    );
    destinations.forEach((destination) =>
      expect(destination.componentInstance.drop).not.toHaveBeenCalled(),
    );
  });

  it('releases the drop lock if the existing move operation fails', async () => {
    const destination: PanelStubComponent = fixture.debugElement.queryAll(
      By.directive(PanelStubComponent),
    )[1].componentInstance;
    destination.drop.and.rejectWith(new Error('move failed'));
    const event = { isPointerOverContainer: true } as CdkDragDrop<
      TaskCopy[],
      TaskCopy[],
      TaskCopy
    >;
    await expectAsync(
      fixture.componentInstance.dropOnQuadrant(event, board.panels[1].id),
    ).toBeRejectedWithError('move failed');
    expect(fixture.componentInstance.isDropping()).toBeFalse();
  });
});
