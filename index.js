import { app as electronApp, BrowserWindow } from 'electron';
import { app as expressApp, startServer } from './server.js';

let mainWindow;

const isWindows = process.platform === 'win32';
let needsFocusFix = false;
let triggeringProgrammaticBlur = false;

async function createWindow() {
    const port = await startServer(); // Garante que a porta seja obtida antes de usar

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 1024,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('blur', (event) => {
        if(!triggeringProgrammaticBlur) {
          needsFocusFix = true;
        }
    })

    mainWindow.maximize();
    mainWindow.loadURL(`http://localhost:${port}/`);

    mainWindow.on('focus', () => mainWindow.webContents.focus());
}

electronApp.on('browser-window-focus', function(event, win) {
    if (win) {
        win.webContents.send('window-focus');
    }
});

electronApp.disableHardwareAcceleration();

electronApp.whenReady().then(createWindow);

electronApp.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electronApp.quit();
    }
});

electronApp.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});