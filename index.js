import { app as electronApp, BrowserWindow } from 'electron';
import { app as expressApp, startServer } from './server.js';

let mainWindow;

async function createWindow() {
    const port = await startServer();

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
        mainWindow.focus();
    });

    mainWindow.maximize();
    mainWindow.loadURL(`http://localhost:${port}/`);
}

electronApp.on('browser-window-focus', (event, win) => {
    if (win) {
        win.webContents.focus();
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
