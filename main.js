import { app, BrowserWindow, Tray, Menu, session } from "electron";
import { ElectronBlocker } from "@cliqz/adblocker-electron";
import fetch from "cross-fetch";
import { join } from "node:path";

ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
  blocker.enableBlockingInSession(session.defaultSession);
});

let isQuitting = false;
let win = null;

const assetsPath = app.isPackaged
  ? path.join(process.resourcesPath, "assets")
  : "assets";

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Focus window if a second instance is attempted to be ran
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      win.show();
    }
  });

  const createWindow = () => {
    win = new BrowserWindow({
      title: "YouTube Music",
      icon: join(assetsPath, "tray.ico"),
      width: 800,
      height: 600,
      webPreferences: {
        preload: join(__dirname, "preload.js"),
      },
    });
    win.setMenu(null);
    // Persist cookies
    var cookies = session.defaultSession.cookies;
    cookies.on("changed", function (event, cookie, cause, removed) {
      if (cookie.session && !removed) {
        var url = `${
          cookie.secure ? "https" : "http"
        }://${cookie.domain.substring(1)}${cookie.path}`;
        console.log("url", url);
        cookies.set(
          {
            url: url,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            expirationDate: Math.floor(new Date().getTime() / 1000) + 1209600,
          },
          function (err) {
            if (err) {
              log.error("Error trying to persist cookie", err, cookie);
            }
          }
        );
      }
    });
    win.loadURL("https://music.youtube.com");
    return win;
  };

  app.whenReady().then(() => {
    const win = createWindow();
    win.on("close", function (event) {
      console.log(isQuitting);
      if (!isQuitting) {
        event.preventDefault();
        win.hide();
      }
    });
    let tray = new Tray(join(__dirname, "tray.ico"));
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Show App",
          click: function () {
            win.show();
          },
        },
        {
          label: "Quit",
          click: function () {
            isQuitting = true;
            app.quit();
          },
        },
      ])
    );
    tray.setToolTip("Youtube Music");

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
