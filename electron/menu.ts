import type { BaseWindow, MenuItemConstructorOptions } from 'electron';

// macOS-only application menu template (built by createMenu in
// main-window.ts). Kept as a pure function so menu.test.cjs can assert on
// the template without loading main-window's import graph.
export const createMenuTemplate = ({
  onCloseWindow,
  onQuit,
}: {
  // receives the key window: the app-wide accelerator also fires while
  // e.g. the break blocker or task widget is focused, and the handler
  // must decide based on which window that is
  onCloseWindow: (focusedWindow: BaseWindow | undefined) => void;
  onQuit: () => void;
}): MenuItemConstructorOptions[] => [
  {
    label: 'Super Productivity',
    submenu: [
      { role: 'about', label: '关于 Super Productivity' },
      { type: 'separator' },
      { role: 'hide', label: '隐藏 Super Productivity' },
      { role: 'hideOthers', label: '隐藏其他窗口' },
      { role: 'unhide', label: '显示全部' },
      { type: 'separator' },
      {
        label: '退出',
        accelerator: 'CmdOrCtrl+Q',
        click: onQuit,
      },
    ],
  },
  {
    label: '编辑',
    submenu: [
      { role: 'undo', label: '撤销' },
      { role: 'redo', label: '重做' },
      { type: 'separator' },
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' },
      { role: 'selectAll', label: '全选' },
    ],
  },
  {
    label: '窗口',
    submenu: [
      {
        // NOT role 'close': close would run the quit path when
        // minimize-to-tray is off, and as a raw accelerator on the focused
        // window it could destroy the task widget or the break blocker.
        label: '关闭窗口',
        accelerator: 'CmdOrCtrl+W',
        click: (_menuItem, focusedWindow) => onCloseWindow(focusedWindow),
      },
    ],
  },
];
