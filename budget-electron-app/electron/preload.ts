/**
 * Preload Script - IPC Bridge
 * 
 * This file runs in a privileged context and exposes safe APIs to the renderer process.
 * It acts as a secure bridge between Electron's main process and your React app.
 * 
 * Security: 
 * - Runs with Node.js access but in renderer's context
 * - Only exposes explicitly defined APIs via contextBridge
 * - Prevents direct Node.js/Electron access from React
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose protected methods that allow the renderer process to use
 * ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electron', {
  /**
   * Platform information
   * Useful for showing different UI on different operating systems
   */
  platform: process.platform,
  
  /**
   * App version from package.json
   * Can be displayed in your app's "About" section
   */
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },

  /**
   * Window controls (optional)
   * If you want custom window controls instead of native ones
   */
  windowControls: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },

  /**
   * Example: Send messages to main process
   * Usage in React: window.electron.sendMessage('channel-name', data)
   */
  sendMessage: (channel: string, data: any) => {
    // Whitelist of allowed channels
    const validChannels = ['app:log', 'app:error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  /**
   * Example: Receive messages from main process
   * Usage in React: window.electron.onMessage('channel-name', (data) => {...})
   */
  onMessage: (channel: string, callback: (data: any) => void) => {
    const validChannels = ['app:notification', 'app:update'];
    if (validChannels.includes(channel)) {
      // Remove any existing listeners to prevent memory leaks
      ipcRenderer.removeAllListeners(channel);
      // Add new listener
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  },

  /**
   * Remove listener
   * Important for cleanup when components unmount
   */
  removeListener: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

/**
 * Type definitions for window.electron
 * Add this to a separate electron.d.ts file or at the end of this file
 */
declare global {
  interface Window {
    electron: {
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
      windowControls: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
      sendMessage: (channel: string, data: any) => void;
      onMessage: (channel: string, callback: (data: any) => void) => void;
      removeListener: (channel: string) => void;
    };
  }
}

/**
 * NOTE: For your current app, you may not need IPC communication yet
 * since your React app communicates directly with the Express server via HTTP.
 * 
 * This preload is here for:
 * 1. Security (required by contextIsolation: true)
 * 2. Future features that might need main process access
 * 3. Platform detection and window controls
 */