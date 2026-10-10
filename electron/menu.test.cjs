const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require('ts-node/register/transpile-only');

// Resolve test-only TypeScript source through a computed path so the packaged
// runtime-require verifier does not treat it as an app.asar dependency.
const { createMenuTemplate } = require(path.resolve(__dirname, 'menu.ts'));

const buildTpl = () => {
  const calls = { close: 0, quit: 0, closeArgs: [] };
  const tpl = createMenuTemplate({
    onCloseWindow: (focusedWindow) => {
      calls.close++;
      calls.closeArgs.push(focusedWindow);
    },
    onQuit: () => calls.quit++,
  });
  return { tpl, calls };
};

const findMenu = (tpl, label) => tpl.find((item) => item.label === label);

test('has app, edit and window menus', () => {
  const { tpl } = buildTpl();
  assert.deepEqual(
    tpl.map((item) => item.label),
    ['Super Productivity', '编辑', '窗口'],
  );
});

test('Cmd+W is a custom Close Window item wired to onCloseWindow', () => {
  const { tpl, calls } = buildTpl();
  const windowMenu = findMenu(tpl, '窗口');
  assert.equal(windowMenu.submenu.length, 1);
  const closeItem = windowMenu.submenu[0];
  assert.equal(closeItem.label, '关闭窗口');
  assert.equal(closeItem.accelerator, 'CmdOrCtrl+W');
  assert.equal(closeItem.role, undefined);
  closeItem.click();
  assert.equal(calls.close, 1);
  assert.equal(calls.quit, 0);
});

// the accelerator is app-wide, so the handler must know which window was
// key when it fired (undefined during macOS menu tracking)
test('Close Window forwards the focused window to onCloseWindow', () => {
  const { tpl, calls } = buildTpl();
  const closeItem = findMenu(tpl, '窗口').submenu[0];
  const fakeMenuItem = { label: '关闭窗口' };
  const fakeFocusedWindow = { id: 42 };
  closeItem.click(fakeMenuItem, fakeFocusedWindow, {});
  closeItem.click(fakeMenuItem, undefined, {});
  assert.deepEqual(calls.closeArgs, [fakeFocusedWindow, undefined]);
});

// role 'close' would route Cmd+W into the window close handler, which quits
// the app when minimize-to-tray is off; roles also target the focused window
// (task widget, break blocker). Guard against them coming back.
test('window menu contains no close/minimize/zoom roles', () => {
  const { tpl } = buildTpl();
  const windowMenu = findMenu(tpl, '窗口');
  const roles = windowMenu.submenu.map((item) => item.role).filter(Boolean);
  assert.deepEqual(roles, []);
});

test('quit item keeps Cmd+Q and is wired to onQuit', () => {
  const { tpl, calls } = buildTpl();
  const appMenu = findMenu(tpl, 'Super Productivity');
  const quitItem = appMenu.submenu.find((item) => item.label === '退出');
  assert.equal(quitItem.accelerator, 'CmdOrCtrl+Q');
  quitItem.click();
  assert.equal(calls.quit, 1);
  assert.equal(calls.close, 0);
});

test('edit menu keeps the copy & paste roles', () => {
  const { tpl } = buildTpl();
  const editMenu = findMenu(tpl, '编辑');
  const roles = editMenu.submenu.map((item) => item.role).filter(Boolean);
  assert.deepEqual(roles, ['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll']);
});
