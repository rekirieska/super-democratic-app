const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs").promises;
const storage = require("./storage");

const sessions = new Map();

function getSession(event) {
  return sessions.get(event.sender.id);
}

function isAdmin(event) {
  const session = getSession(event);
  return session !== undefined && session.role === "admin";
}

async function createDefaultTasksForUser(userId) {
  const defaultTasks = [
    {
      name: "Очистить индивидуальное рабочее пространство от скверны и пыли",
      description: "Навести порядок на столе",
      priority: 3,
      deadline: null,
      completed: false,
      userId,
    },
    {
      name: "Заполнить квартальный отчёт производства для Министерства Истины",
      description: "Отчёт за текущий квартал",
      priority: 5,
      deadline: null,
      completed: false,
      userId,
    },
    {
      name: "Пройти утреннюю ментально-идеологическую зарядку",
      description: "Прослушать гимн Супер-Земли",
      priority: 2,
      deadline: null,
      completed: false,
      userId,
    },
    {
      name: "Проверить исправность гражданской системы переработки бытовых отходов",
      description: "Осмотреть контейнеры",
      priority: 3,
      deadline: null,
      completed: false,
      userId,
    },
    {
      name: "Проверить лояльность сожителей и соседей посредством вежливой беседы",
      description: "Провести беседу",
      priority: 4,
      deadline: null,
      completed: false,
      userId,
    },
    {
      name: "Своевременно оплатить ежемесячный добровольный налог на патриотизм",
      description: "Перевести средства",
      priority: 5,
      deadline: null,
      completed: false,
      userId,
    },
  ];

  const tasks = await storage.readJSON(storage.files.tasksFile);
  for (const task of defaultTasks) {
    tasks.push({ id: crypto.randomUUID(), ...task });
  }
  await storage.writeJSON(storage.files.tasksFile, tasks);
}

function setupIPC() {
  ipcMain.handle("auth:login", async (event, { username, password }) => {
    const users = await storage.readJSON(storage.files.usersFile);
    const user = users.find((u) => u.username === username);
    if (!user) return { success: false, message: "Гражданин не найден" };

    const isValid = await storage.verifyPassword(password, user.passwordHash);
    if (!isValid) return { success: false, message: "Неверный пароль" };

    const roles = await storage.readJSON(storage.files.rolesFile);
    const role = roles.find((r) => r.id === user.roleId);
    const roleName = role ? role.name : "user";

    sessions.set(event.sender.id, {
      id: user.id,
      username: user.username,
      role: roleName,
    });

    await storage.logAction(username, roleName, "LOGIN", "SUCCESS");

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: roleName,
        darkMode: user.darkMode || false,
      },
    };
  });

  ipcMain.handle(
    "auth:register",
    async (event, { username, password, email, rank }) => {
      const users = await storage.readJSON(storage.files.usersFile);
      if (users.find((u) => u.username === username)) {
        return { success: false, message: "Логин уже занят" };
      }

      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(password)) {
        return {
          success: false,
          message: "Пароль не соответствует требованиям",
        };
      }

      const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: "Неверный формат email" };
      }

      if (email.toLowerCase().includes("admin")) {
        return {
          success: false,
          message: "Email не должен содержать 'admin' ни в каком регистре",
        };
      }

      const hash = await storage.hashPassword(password);
      const newUser = {
        id: crypto.randomUUID(),
        username,
        passwordHash: hash,
        email,
        rank: rank || "Новобранец",
        roleId: 2,
        darkMode: false,
      };

      users.push(newUser);
      await storage.writeJSON(storage.files.usersFile, users);
      await createDefaultTasksForUser(newUser.id);
      await storage.logAction(username, "user", "REGISTER", "SUCCESS");

      return { success: true };
    },
  );

  // Возвращаем ТОЛЬКО задачи текущего пользователя (если не админ)
  ipcMain.handle("data:getTasks", async (event) => {
    const session = getSession(event);
    if (!session) return [];
    let tasks = await storage.readJSON(storage.files.tasksFile);
    if (!isAdmin(event)) {
      tasks = tasks.filter((t) => t.userId === session.id);
    }
    return tasks;
  });

  ipcMain.handle("data:getMissions", () =>
    storage.readJSON(storage.files.missionsFile),
  );
  ipcMain.handle("data:getWeapons", () =>
    storage.readJSON(storage.files.weaponsFile),
  );

  ipcMain.handle("data:getUsers", async (event) => {
    if (!isAdmin(event)) return [];
    const users = await storage.readJSON(storage.files.usersFile);
    const roles = await storage.readJSON(storage.files.rolesFile);
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      rank: u.rank,
      roleId: u.roleId,
      roleName: roles.find((r) => r.id === u.roleId)?.name || "user",
    }));
  });

  ipcMain.handle("user:updateRole", async (event, { userId, roleId }) => {
    if (!isAdmin(event)) return { success: false, message: "Доступ запрещен" };

    const users = await storage.readJSON(storage.files.usersFile);
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.roleId = roleId;
      await storage.writeJSON(storage.files.usersFile, users);
      const adminSession = getSession(event);
      await storage.logAction(
        adminSession.username,
        "admin",
        "UPDATE_USER_ROLE",
        "SUCCESS",
      );
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle("user:delete", async (event, userId) => {
    if (!isAdmin(event)) return { success: false, message: "Доступ запрещен" };

    let users = await storage.readJSON(storage.files.usersFile);
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser && targetUser.username === "admin") {
      return {
        success: false,
        message: "Нельзя удалить главного администратора",
      };
    }

    users = users.filter((u) => u.id !== userId);
    await storage.writeJSON(storage.files.usersFile, users);

    const tasks = await storage.readJSON(storage.files.tasksFile);
    const newTasks = tasks.filter((t) => t.userId !== userId);
    await storage.writeJSON(storage.files.tasksFile, newTasks);

    const adminSession = getSession(event);
    await storage.logAction(
      adminSession.username,
      "admin",
      "DELETE_USER",
      "SUCCESS",
    );
    return { success: true };
  });

  // Универсальный CRUD с проверкой прав для задач
  function handleCrud(file, entityName) {
    ipcMain.handle(`${entityName}:create`, async (event, data) => {
      const session = getSession(event);
      if (!session) return { success: false, message: "Ошибка авторизации" };

      let items = await storage.readJSON(file);

      // Для задач – дополнительная логика
      if (file === storage.files.tasksFile) {
        // Не-админ может создавать задачи только для себя
        if (!isAdmin(event)) {
          data.userId = session.id;
        }
        // Проверка уникальности имени в рамках пользователя
        const conflict = items.some(
          (i) =>
            i.userId === data.userId &&
            i.name.toLowerCase() === data.name.toLowerCase(),
        );
        if (conflict) {
          return {
            success: false,
            message: `У пользователя уже есть задача с названием "${data.name}"`,
          };
        }
      } else {
        // Для других сущностей – проверка уникальности имени глобально
        if (
          items.some((i) => i.name.toLowerCase() === data.name.toLowerCase())
        ) {
          return {
            success: false,
            message: `Название "${data.name}" уже существует`,
          };
        }
      }

      const newItem = { id: crypto.randomUUID(), ...data };
      items.push(newItem);
      await storage.writeJSON(file, items);
      await storage.logAction(
        session.username,
        session.role,
        `CREATE_${entityName.toUpperCase()}`,
        "SUCCESS",
      );
      return { success: true, item: newItem };
    });

    ipcMain.handle(`${entityName}:update`, async (event, { id, ...data }) => {
      const session = getSession(event);
      if (!session) return { success: false, message: "Ошибка авторизации" };

      let items = await storage.readJSON(file);
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return { success: false, message: "Запись не найдена" };

      const item = items[index];

      // Проверка прав для задач
      if (file === storage.files.tasksFile) {
        if (!isAdmin(event) && item.userId !== session.id) {
          await storage.logAction(
            session.username,
            session.role,
            `UPDATE_${entityName.toUpperCase()}_DENIED`,
            "FAIL",
          );
          return {
            success: false,
            message: "Нет прав на редактирование этой задачи",
          };
        }
        // Проверка уникальности имени среди задач того же пользователя
        if (data.name) {
          const conflict = items.some(
            (i) =>
              i.id !== id &&
              i.userId === item.userId &&
              i.name.toLowerCase() === data.name.toLowerCase(),
          );
          if (conflict) {
            return {
              success: false,
              message: `У пользователя уже есть задача с названием "${data.name}"`,
            };
          }
        }
      } else {
        // Для других сущностей – глобальная уникальность имени
        if (
          data.name &&
          items.some(
            (i) =>
              i.id !== id && i.name.toLowerCase() === data.name.toLowerCase(),
          )
        ) {
          return {
            success: false,
            message: `Название "${data.name}" уже существует`,
          };
        }
      }

      items[index] = { ...item, ...data };
      await storage.writeJSON(file, items);
      await storage.logAction(
        session.username,
        session.role,
        `UPDATE_${entityName.toUpperCase()}`,
        "SUCCESS",
      );
      return { success: true, item: items[index] };
    });

    ipcMain.handle(`${entityName}:delete`, async (event, id) => {
      const session = getSession(event);
      if (!session) return { success: false, message: "Ошибка авторизации" };

      let items = await storage.readJSON(file);
      const item = items.find((i) => i.id === id);
      if (!item) return { success: false, message: "Запись не найдена" };

      // Проверка прав для задач
      if (file === storage.files.tasksFile) {
        if (!isAdmin(event) && item.userId !== session.id) {
          await storage.logAction(
            session.username,
            session.role,
            `DELETE_${entityName.toUpperCase()}_DENIED`,
            "FAIL",
          );
          return {
            success: false,
            message: "Нет прав на удаление этой задачи",
          };
        }
      }

      const newItems = items.filter((i) => i.id !== id);
      await storage.writeJSON(file, newItems);
      await storage.logAction(
        session.username,
        session.role,
        `DELETE_${entityName.toUpperCase()}`,
        "SUCCESS",
      );
      return { success: true };
    });
  }

  handleCrud(storage.files.tasksFile, "task");
  handleCrud(storage.files.missionsFile, "mission");
  handleCrud(storage.files.weaponsFile, "weapon");

  ipcMain.handle("export:csv", async (event, { entityName, data }) => {
    const session = getSession(event);
    if (!session) return { success: false, message: "Ошибка авторизации" };
    if (!data.length)
      return { success: false, message: "Нет данных для экспорта" };

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];
    for (const row of data) {
      const values = headers.map(
        (h) => `"${String(row[h] || "").replace(/"/g, '""')}"`,
      );
      csvRows.push(values.join(","));
    }
    const csvString = csvRows.join("\n");
    const result = await dialog.showSaveDialog({
      title: `Экспорт ${entityName}`,
      defaultPath: `${entityName}_${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });

    if (!result.canceled) {
      await fs.writeFile(result.filePath, csvString, "utf8");
      await storage.logAction(
        session.username,
        session.role,
        `EXPORT_${entityName.toUpperCase()}`,
        "SUCCESS",
      );
      return { success: true, path: result.filePath };
    }
    return { success: false, message: "Экспорт отменён" };
  });

  ipcMain.handle("user:updateTheme", async (event, { userId, darkMode }) => {
    const session = getSession(event);
    if (!session || session.id !== userId)
      return { success: false, message: "Доступ запрещен" };

    const users = await storage.readJSON(storage.files.usersFile);
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.darkMode = darkMode;
      await storage.writeJSON(storage.files.usersFile, users);
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle("export:report", async (event, data) => {
    const session = getSession(event);
    if (!session) return { success: false, message: "Ошибка авторизации" };
    return { success: true, message: "Отчет успешно сформирован" };
  });

  ipcMain.handle(
    "user:updateSettings",
    async (event, { userId, ...settings }) => {
      const session = getSession(event);
      if (!session || session.id !== userId)
        return { success: false, message: "Доступ запрещен" };

      const users = await storage.readJSON(storage.files.usersFile);
      const user = users.find((u) => u.id === userId);
      if (user) {
        Object.assign(user, settings);
        await storage.writeJSON(storage.files.usersFile, users);
        return { success: true };
      }
      return { success: false };
    },
  );
}

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 576,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#0b0c0d",
    show: false,
    frame: true,
    titleBarStyle: "default",
  });
  mainWindow.setMenu(null);
  mainWindow.loadFile("index.html");
  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.on("destroyed", () => {
    sessions.delete(mainWindow.webContents.id);
  });
}

app.whenReady().then(() => {
  storage.initDataFiles();
  setupIPC();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
