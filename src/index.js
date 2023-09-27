const {app, BrowserWindow, ipcMain, shell} = require('electron')
const path = require('path')
const generator = require("./generator");

function createMainWindow() {
  const window = new BrowserWindow({
    width: app.isPackaged ? 450 : 1200,
    height: app.isPackaged ? 300 : 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    resizable: !app.isPackaged,
    icon: path.join(__dirname, '../lib/img/icon/icon64.png')
  })

  window.setMenuBarVisibility(false);

  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, 'view/build/index.html'));
  } else {
    window.webContents.openDevTools();
    window.loadURL('http://localhost:3000');
  }

  window.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: 'deny'};
  });
}

app.whenReady().then(async () => {
  createMainWindow();

  ipcMain.handle(
    'generate',
    async (e, fileString, password) => await generator.fromBuffer(BrowserWindow, fileString, password)
  );
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
