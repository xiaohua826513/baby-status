const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("statusApi", {
  update: (payload) => ipcRenderer.invoke("status:update", payload),
  getConfig: () => ipcRenderer.invoke("status:config")
});
