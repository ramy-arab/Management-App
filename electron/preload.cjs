const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getData: () => ipcRenderer.invoke("get-data"),

  // RH
  addEmployee: (data) => ipcRenderer.invoke("add-employee", data),
  deleteEmployee: (data) => ipcRenderer.invoke("delete-employee", data),
  updateEmployee: (data) => ipcRenderer.invoke("update-employee", data),

  // ENGINS
  addEngin: (data) => ipcRenderer.invoke("add-engin", data),
  deleteEngin: (data) => ipcRenderer.invoke("delete-engin", data),
  updateEngin: (data) => ipcRenderer.invoke("update-engin", data),

  // SUIVI
  addSuivi: (data) => ipcRenderer.invoke("add-suivi", data),
  updateSuivi: (data) => ipcRenderer.invoke("update-suivi", data),
  deleteSuivi: (data) => ipcRenderer.invoke("delete-suivi", data),

  // GÉNÉRIQUE (Pour PDF et autres)
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  addRendement: (data) => ipcRenderer.invoke("add-rendement", data),
  updateRendement: (data) => ipcRenderer.invoke("update-rendement", data),

});