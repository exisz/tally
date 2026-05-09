/**
 * Tally — main process entrypoint (PLANET-1471 / S1.1).
 *
 * Stage 0 goal: a minimum viable BrowserWindow that launches in <5s on a
 * cold boot and shows a DaisyUI dark hero. No supervisor, no watchers,
 * no cloud sync yet — those land in later stories under PLANET-1470.
 */
import { app, BrowserWindow } from 'electron';
import path from 'node:path';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    title: 'Tally',
    backgroundColor: '#0b0f17',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setTitle('Tally');

  // Show as soon as the renderer reports ready — keeps perceived launch <5s.
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const indexHtml = path.join(__dirname, '..', 'renderer', 'index.html');
  void mainWindow.loadFile(indexHtml);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
