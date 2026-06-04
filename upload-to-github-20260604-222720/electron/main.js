const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

function readLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return {};

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return acc;
      const index = trimmed.indexOf("=");
      if (index === -1) return acc;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

const localEnv = readLocalEnv();

function getConfig() {
  return {
    webUrl: process.env.STATUS_WEB_URL || localEnv.STATUS_WEB_URL || "http://localhost:3000",
    adminToken: process.env.STATUS_ADMIN_TOKEN || localEnv.STATUS_ADMIN_TOKEN || ""
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 880,
    height: 680,
    minWidth: 760,
    minHeight: 580,
    title: "宝宝状态同步",
    backgroundColor: "#fff7f3",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "renderer.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("status:update", async (_event, payload) => {
    const config = getConfig();
    if (!config.adminToken) {
      throw new Error("缺少 STATUS_ADMIN_TOKEN，请先配置 electron/.env。");
    }

    const response = await fetch(`${config.webUrl.replace(/\/$/, "")}/api/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.adminToken}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `更新失败：${response.status}`);
    }

    return result;
  });

  ipcMain.handle("status:config", () => {
    const config = getConfig();
    return {
      webUrl: config.webUrl,
      hasAdminToken: Boolean(config.adminToken)
    };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
