const { app, ipcMain } = require("electron");
const { PARAMS, VALUE, MicaBrowserWindow } = require("mica-electron");
const path = require("path");

app.commandLine.appendSwitch("enable-transparent-visuals");

app.on("ready", () => {
	const win = new MicaBrowserWindow({
		width: 1200,
		height: 800,
		effect: PARAMS.BACKGROUND.TABBED_MICA,
		theme: VALUE.THEME.AUTO,
		autoHideMenuBar: true,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webviewTag: true
		},
		minWidth: 900,
		minHeight: 640
	});

	// win.webContents.openDevTools();

	win.loadFile(path.join(__dirname, "src", "index.html"));

	win.webContents.once("dom-ready", () => {
		win.show();
	});

	ipcMain.on("minimize", () => {
		win.minimize();
	});
	ipcMain.on("maximize", () => {
		win.maximize();
	});
	ipcMain.on("restore", () => {
		win.restore();
	});
	ipcMain.on("close", () => {
		win.close();
	});
	function toggleMaxRestoreButtons() {
		if (win.isMaximized()) {
			win.webContents.executeJavaScript(`
            document.body.classList.add('maximized');
			`);
		} else {
			win.webContents.executeJavaScript(`
            document.body.classList.remove('maximized');
			`);
		}
	}
	win.on("maximize", toggleMaxRestoreButtons);
	win.on("unmaximize", toggleMaxRestoreButtons);

	ipcMain.on("tab-close", () => {
		win.webContents.executeJavaScript(`
		try {
			document.getElementById("window-title").lastElementChild.click();
		} catch {
			createNewTab()
		}
		`);
	});
});
