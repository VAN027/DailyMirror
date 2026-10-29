import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTab, MatTabContent, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CdkScrollable } from '@angular/cdk/overlay';
import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { TranslatePipe } from '@ngx-translate/core';
import { BoardsComponent } from '../../boards/boards.component';
import { BoardComponent } from '../../boards/board/board.component';
import { BoardEditComponent } from '../../boards/board-edit/board-edit.component';
import { DEFAULT_BOARDS } from '../../boards/boards.const';
import { MobileQuadrantBoardComponent } from './mobile-quadrant-board.component';

@Component({
  selector: 'mobile-boards',
  imports: [
    MatMenuModule,
    MatTabGroup,
    MatTab,
    MatIcon,
    MatTabContent,
    MatTabLabel,
    BoardComponent,
    CdkScrollable,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    TranslatePipe,
    BoardEditComponent,
    MobileQuadrantBoardComponent,
  ],
  templateUrl: './mobile-boards.component.html',
  styleUrl: '../../boards/boards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileBoardsComponent extends BoardsComponent {
  readonly matrixId = DEFAULT_BOARDS[0].id;
}
