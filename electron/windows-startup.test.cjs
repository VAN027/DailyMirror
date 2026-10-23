const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
const file = path.resolve(__dirname, 'windows-startup.ts');
const load = Module._load;
const platform = Object.getOwnPropertyDescriptor(process, 'platform');
const portable = process.env.PORTABLE_EXECUTABLE_FILE;
let calls, app, handlers, contents;
test.beforeEach(() => {
  Object.defineProperty(process, 'platform', { value: 'win32' });
  delete process.env.PORTABLE_EXECUTABLE_FILE;
  calls = [];
  handlers = new Map();
  contents = { mainFrame: {} };
  app = {
    isPackaged: true,
    getLoginItemSettings: (options) => {
      calls.push(['get', options]);
      return { openAtLogin: false, executableWillLaunchAtLogin: false, launchItems: [] };
    },
    setLoginItemSettings: (options) => {
      calls.push(['set', options]);
      app.getLoginItemSettings = () => ({
        // Electron reads openAtLogin using the AppUserModelID, not our custom name.
        openAtLogin: false,
        executableWillLaunchAtLogin: options.openAtLogin && options.enabled,
        launchItems: options.openAtLogin
          ? [
              {
                name: options.name,
                path: options.path,
                args: options.args,
                scope: 'user',
                enabled: options.enabled,
              },
            ]
          : [],
      });
    },
  };
  Module._load = function (request, parent, isMain) {
    if (request === 'electron')
      return { app, ipcMain: { handle: (name, fn) => handlers.set(name, fn) } };
    if (request === './main-window') return { getWin: () => ({ webContents: contents }) };
    return load.call(this, request, parent, isMain);
  };
  delete require.cache[file];
});
test.afterEach(() => {
  Module._load = load;
  Object.defineProperty(process, 'platform', platform);
  if (portable === undefined) delete process.env.PORTABLE_EXECUTABLE_FILE;
  else process.env.PORTABLE_EXECUTABLE_FILE = portable;
  delete require.cache[file];
});
test('reads system state without writing startup entries', () => {
  assert.deepEqual(require(file).getWindowsStartup(), {
    supported: true,
    enabled: false,
  });
  assert.equal(calls.length, 1);
});
test('installed app uses its executable and can enable and disable', () => {
  const api = require(file);
  assert.equal(api.setWindowsStartup(true).enabled, true);
  assert.deepEqual(calls.find((c) => c[0] === 'set')[1], {
    path: process.execPath,
    args: [],
    name: 'DailyMirror',
    openAtLogin: true,
    enabled: true,
  });
  assert.equal(api.setWindowsStartup(false).enabled, false);
});
test('portable app registers original launcher even when path contains spaces', () => {
  process.env.PORTABLE_EXECUTABLE_FILE = 'D:\\My Apps\\DailyMirror 便携版.exe';
  require(file).setWindowsStartup(true);
  assert.equal(calls[0][1].path, process.env.PORTABLE_EXECUTABLE_FILE);
  assert.equal(
    calls.find((c) => c[0] === 'set')[1].path,
    process.env.PORTABLE_EXECUTABLE_FILE,
  );
});
test('system-disabled entry renders as disabled', () => {
  app.getLoginItemSettings = () => ({
    openAtLogin: true,
    executableWillLaunchAtLogin: false,
    launchItems: [
      {
        name: 'DailyMirror',
        path: process.execPath,
        args: [],
        scope: 'user',
        enabled: false,
      },
    ],
  });
  assert.equal(require(file).getWindowsStartup().enabled, false);
});
test('development and non-Windows builds never write startup entries', () => {
  const api = require(file);
  app.isPackaged = false;
  assert.equal(api.getWindowsStartup().supported, false);
  assert.throws(() => api.setWindowsStartup(true));
  app.isPackaged = true;
  Object.defineProperty(process, 'platform', { value: 'linux' });
  assert.equal(api.getWindowsStartup().supported, false);
  assert.throws(() => api.setWindowsStartup(true));
  assert.equal(calls.length, 0);
});
test('invalid input and rejected OS writes do not report success', () => {
  const api = require(file);
  assert.throws(() => api.setWindowsStartup('true'));
  app.setLoginItemSettings = () => {};
  assert.throws(() => api.setWindowsStartup(true), /not applied/);
});
test('only the main application frame may access startup IPC', () => {
  require(file).initWindowsStartupIpc();
  const get = handlers.get('GET_WINDOWS_STARTUP');
  assert.throws(() => get({ sender: {}, senderFrame: {} }));
  assert.throws(() => get({ sender: contents, senderFrame: {} }));
  assert.equal(
    get({ sender: contents, senderFrame: contents.mainFrame }).supported,
    true,
  );
});

test('does not mistake another startup entry for the switch it manages', () => {
  app.getLoginItemSettings = () => ({
    openAtLogin: true,
    executableWillLaunchAtLogin: true,
    launchItems: [
      { name: 'Other', path: process.execPath, args: [], scope: 'user', enabled: true },
      {
        name: 'DailyMirror',
        path: process.execPath,
        args: [],
        scope: 'machine',
        enabled: true,
      },
      {
        name: 'DailyMirror',
        path: process.execPath,
        args: ['--other'],
        scope: 'user',
        enabled: true,
      },
    ],
  });
  assert.equal(require(file).getWindowsStartup().enabled, false);
});
