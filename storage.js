const { app } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const crypto = require("crypto");

const userDataPath = path.join(app.getPath("userData"), "data");
const logsPath = path.join(app.getPath("userData"), "logs");

const files = {
  usersFile: path.join(userDataPath, "users.json"),
  rolesFile: path.join(userDataPath, "roles.json"),
  tasksFile: path.join(userDataPath, "tasks.json"),
  missionsFile: path.join(userDataPath, "missions.json"),
  weaponsFile: path.join(userDataPath, "weapons.json"),
  logFile: path.join(logsPath, "actions.log"),
};

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function verifyPassword(password, combined) {
  return new Promise((resolve, reject) => {
    const parts = combined.split(":");
    const salt = parts[0];
    const key = parts[1];
    if (!salt || !key) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString("hex") === key);
    });
  });
}

function initDataFiles() {
  if (!fsSync.existsSync(userDataPath)) {
    fsSync.mkdirSync(userDataPath, { recursive: true });
  }
  if (!fsSync.existsSync(logsPath)) {
    fsSync.mkdirSync(logsPath, { recursive: true });
  }

  if (!fsSync.existsSync(files.rolesFile)) {
    fsSync.writeFileSync(
      files.rolesFile,
      JSON.stringify(
        [
          { id: 1, name: "admin", label: "Администратор" },
          { id: 2, name: "user", label: "Гражданин" },
        ],
        null,
        2,
      ),
    );
  }

  if (!fsSync.existsSync(files.usersFile)) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = crypto.scryptSync("Admin123!", salt, 64);
    const hash = `${salt}:${derivedKey.toString("hex")}`;
    fsSync.writeFileSync(
      files.usersFile,
      JSON.stringify(
        [
          {
            id: crypto.randomUUID(),
            username: "admin",
            passwordHash: hash,
            email: "admin@superearth.gov",
            rank: "Старший Офицер Демократии",
            roleId: 1,
            darkMode: true,
          },
        ],
        null,
        2,
      ),
    );
  }

  if (!fsSync.existsSync(files.tasksFile)) {
    fsSync.writeFileSync(files.tasksFile, JSON.stringify([], null, 2));
  }
  if (!fsSync.existsSync(files.missionsFile)) {
    fsSync.writeFileSync(files.missionsFile, JSON.stringify([], null, 2));
  }
  if (!fsSync.existsSync(files.weaponsFile)) {
    fsSync.writeFileSync(files.weaponsFile, JSON.stringify([], null, 2));
  }
}

async function readJSON(file) {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function logAction(username, role, action, result) {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const logLine = `[${timestamp}] [${username}] [${role}] [${action}] [${result}]\n`;
  await fs.appendFile(files.logFile, logLine, "utf8");
}

module.exports = {
  initDataFiles,
  readJSON,
  writeJSON,
  logAction,
  hashPassword,
  verifyPassword,
  files,
};
