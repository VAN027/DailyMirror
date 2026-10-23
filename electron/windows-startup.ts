import { app, ipcMain, IpcMainInvokeEvent } from 'electron';
import { IPC } from './shared-with-frontend/ipc-events.const';
import { WindowsStartupState } from './shared-with-frontend/windows-startup.model';
import { getWin } from './main-window';

const STARTUP_ENTRY_NAME = 'DailyMirror';

const getOptions = (): { path: string; args: string[] } => ({
  // The portable launcher extracts Electron into a temporary directory.
  // Windows must launch the original portable EXE, not that temporary binary.
  path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath,
  args: [],
});

export const getWindowsStartup = (): WindowsStartupState => {
  if (process.platform !== 'win32' || !app.isPackaged) {
    return { supported: false, enabled: false };
  }
  const settings = app.getLoginItemSettings(getOptions());
  return {
    supported: true,
    // openAtLogin looks up AppUserModelID, even when setLoginItemSettings used
    // a custom name. launchItems is filtered by the executable path by Electron.
    enabled: settings.launchItems.some(
      (item) =>
        item.name === STARTUP_ENTRY_NAME &&
        item.scope === 'user' &&
        item.args.length === 0 &&
        item.enabled,
    ),
  };
};

export const setWindowsStartup = (enabled: unknown): WindowsStartupState => {
  if (typeof enabled !== 'boolean') throw new Error('Expected a boolean');
  if (!getWindowsStartup().supported) throw new Error('Windows packaged app required');
  app.setLoginItemSettings({
    ...getOptions(),
    name: STARTUP_ENTRY_NAME,
    openAtLogin: enabled,
    enabled,
  });
  const state = getWindowsStartup();
  if (state.enabled !== enabled)
    throw new Error('Windows startup setting was not applied');
  return state;
};

export const initWindowsStartupIpc = (): void => {
  const validateSender = (event: IpcMainInvokeEvent): void => {
    const contents = getWin()?.webContents;
    if (event.sender !== contents || event.senderFrame !== contents?.mainFrame) {
      throw new Error('Invalid startup settings sender');
    }
  };
  ipcMain.handle(IPC.GET_WINDOWS_STARTUP, (event) => {
    validateSender(event);
    return getWindowsStartup();
  });
  ipcMain.handle(IPC.SET_WINDOWS_STARTUP, (event, enabled: unknown) => {
    validateSender(event);
    return setWindowsStartup(enabled);
  });
};
