import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development';
const serverPort = 3001;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function startServer() {
  const serverPath = isDev 
    ? path.join(__dirname, '../server/server.ts')
    : path.join(__dirname, '../dist-server/server.js');

  if (isDev) {
    // Use ts-node for development
    serverProcess = fork(serverPath, [], {
      execArgv: ['-r', 'ts-node/register'],
      env: { ...process.env, PORT: serverPort.toString() }
    });
  } else {
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: serverPort.toString() }
    });
  }

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

app.whenReady().then(() => {
  startServer();
  
  // Give server a moment to start
  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
