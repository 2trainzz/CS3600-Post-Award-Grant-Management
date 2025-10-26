/**
 * Electron Main Process
 * 
 * This is the entry point for your Electron desktop application.
 * It manages:
 * - Creating and managing the application window
 * - Starting/stopping the Express server
 * - Application lifecycle events
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';

// ============================================================================
// CONFIGURATION
// ============================================================================

const isDev = process.env.NODE_ENV === 'development';
const serverPort = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// STATE
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

//main app window
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      // Security: Disable Node.js integration in renderer
      nodeIntegration: false,
      
      // Security: Isolate renderer context from Electron
      contextIsolation: true,
      
      // Load the preload script for secure IPC
      preload: path.join(__dirname, 'preload.js'),
      
      // Enable dev tools in development
      devTools: isDev,
    }
  });

  // Load the appropriate content based on environment
  if (isDev) {
    // Development: Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    
    // Open DevTools automatically in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Clean up when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// SERVER MANAGEMENT
// ============================================================================

/**
 * Starts the Express server process
 * 
 * In development: Server runs separately via npm script
 * In production: Electron spawns the server as a child process
 */
function startServer(): void {
  // Skip server startup in development (runs separately)
  if (isDev) {
    console.log('Development mode: Server runs separately via npm script');
    return;
  }

  // Production: Start the server process
  const serverPath = path.join(__dirname, '../dist-server/server.js');
  
  console.log(`Starting server from: ${serverPath}`);
  
  serverProcess = fork(serverPath, [], {
    env: { 
      ...process.env, 
      PORT: serverPort.toString(),
      NODE_ENV: 'production'
    },
    // Show server logs in console
    silent: false,
  });

  // Handle server process errors
  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
    // Optionally show error dialog to user
    // dialog.showErrorBox('Server Error', 'Failed to start server');
  });

  // Handle server process exit
  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
    serverProcess = null;
  });

  console.log(`Server started on port ${serverPort}`);
}

//stop express server
function stopServer(): void {
  if (serverProcess && !isDev) {
    console.log('Stopping server process...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// ============================================================================
// IPC HANDLERS (Optional - for window controls)
// ============================================================================

/**
 * Handle window control messages from renderer
 * Only needed if you implement custom window controls
 */
function setupIpcHandlers(): void {
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });

  // Example: Log messages from renderer
  ipcMain.on('app:log', (_event, data) => {
    console.log('[Renderer]:', data);
  });

  // Example: Handle errors from renderer
  ipcMain.on('app:error', (_event, error) => {
    console.error('[Renderer Error]:', error);
  });
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

//when ready, init app
app.whenReady().then(() => {
  console.log('Electron app is ready');
  
  // Start server first (only in production)
  startServer();
  
  // Setup IPC handlers
  setupIpcHandlers();
  
  // Wait for server to initialize before creating window
  const delay = isDev ? 2000 : 1000; // Longer wait in dev for Vite
  setTimeout(() => {
    createWindow();
  }, delay);

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  // Stop the server
  stopServer();
  
  // On macOS, apps typically stay open even with no windows
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

//clean before quit
app.on('before-quit', () => {
  console.log('App is quitting...');
  stopServer();
});

//for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

//for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

if (isDev) {
  console.log('Running in development mode');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    ELECTRON_VERSION: process.versions.electron,
    CHROME_VERSION: process.versions.chrome,
    NODE_VERSION: process.versions.node,
  });
}
