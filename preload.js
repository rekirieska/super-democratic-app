const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (data) => ipcRenderer.invoke("auth:login", data),
  register: (data) => ipcRenderer.invoke("auth:register", data),
  getTasks: () => ipcRenderer.invoke("data:getTasks"),
  getMissions: () => ipcRenderer.invoke("data:getMissions"),
  getWeapons: () => ipcRenderer.invoke("data:getWeapons"),
  getUsers: () => ipcRenderer.invoke("data:getUsers"),
  createTask: (data) => ipcRenderer.invoke("task:create", data),
  updateTask: (id, data) => ipcRenderer.invoke("task:update", { id, ...data }),
  deleteTask: (id) => ipcRenderer.invoke("task:delete", id),
  createMission: (data) => ipcRenderer.invoke("mission:create", data),
  updateMission: (id, data) =>
    ipcRenderer.invoke("mission:update", { id, ...data }),
  deleteMission: (id) => ipcRenderer.invoke("mission:delete", id),
  createWeapon: (data) => ipcRenderer.invoke("weapon:create", data),
  updateWeapon: (id, data) =>
    ipcRenderer.invoke("weapon:update", { id, ...data }),
  deleteWeapon: (id) => ipcRenderer.invoke("weapon:delete", id),
  exportCSV: (entityName, data) =>
    ipcRenderer.invoke("export:csv", { entityName, data }),
  exportReport: (data) => ipcRenderer.invoke("export:report", data),
  updateTheme: (userId, darkMode) =>
    ipcRenderer.invoke("user:updateTheme", { userId, darkMode }),
  updateUserRole: (userId, roleId) =>
    ipcRenderer.invoke("user:updateRole", { userId, roleId }),
  deleteUser: (userId) => ipcRenderer.invoke("user:delete", userId),
  updateUserSettings: (userId, settings) =>
    ipcRenderer.invoke("user:updateSettings", { userId, ...settings }),
});
