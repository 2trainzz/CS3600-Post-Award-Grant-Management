/**
 * TypeScript type definitions for the Electron API exposed to the renderer
 * 
 * This file provides type safety when using window.electron in your React app
 * These types match what's exposed in preload.ts via contextBridge
 */

export interface ElectronAPI {
  /**
   * Operating system platform
   * Values: 'darwin' (macOS), 'win32' (Windows), 'linux'
   */
  platform: NodeJS.Platform;

  /**
   * Version information for Node.js, Chrome, and Electron
   */
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };

  /**
   * Window control functions
   * Use these if you implement custom window controls
   */
  windowControls: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };

  /**
   * Send a message to the main process
   * @param channel - The IPC channel name (must be whitelisted in preload)
   * @param data - The data to send
   */
  sendMessage: (channel: string, data: any) => void;

  /**
   * Listen for messages from the main process
   * @param channel - The IPC channel name (must be whitelisted in preload)
   * @param callback - Function to call when message is received
   */
  onMessage: (channel: string, callback: (data: any) => void) => void;

  /**
   * Remove a message listener
   * @param channel - The IPC channel name
   */
  removeListener: (channel: string) => void;
}

/**
 * Extend the Window interface to include electron API
 * This allows TypeScript to recognize window.electron
 */
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

//window.electron
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

//export for global augmentation
export {};