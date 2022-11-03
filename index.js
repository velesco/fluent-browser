// checks if the app is being run as an installer
const setupEvents = require("./installers/setupEvents");
if (setupEvents.handleSquirrelEvent()) {
	return;
}

const { app, ipcMain, globalShortcut } = require("electron");
const { PARAMS, VALUE, MicaBrowserWindow } = require("mica-electron");
const contextMenu = require("electron-context-menu");
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
		minHeight: 640,
		icon: path.join(__dirname, "src", "icons", "win", "icon.ico")
	});

	win.removeMenu();

	// win.webContents.openDevTools();

	win.loadFile(path.join(__dirname, "src", "index.html"));

	win.webContents.once("dom-ready", () => {
		win.show();
	});

	win.on("focus", () => {
		globalShortcut.register("F11", () => {
			if (win.isFocused()) {
				win.webContents.executeJavaScript(`
				toggleFullscreen()
				`);
			}
		});
		globalShortcut.register("Ctrl+Shift+I", (e) => {
			if (win.isFocused()) {
				win.webContents.toggleDevTools();
			}
		});
		globalShortcut.register("Ctrl+E", () => {
			if (win.isFocused()) {
				win.webContents.executeJavaScript(`
				document.getElementById("url-input").click()
				`);
			}
		});
		globalShortcut.register("Ctrl+R", () => {
			if (win.isFocused()) {
				win.webContents.executeJavaScript(`
				document.getElementById("reload-button").click()
				`);
			}
		});
		globalShortcut.register("Ctrl+T", () => {
			if (win.isFocused()) {
				win.webContents.executeJavaScript(`
				document.getElementById("newtab-button").click()
				`);
			}
		});
		globalShortcut.register("Ctrl+W", () => {
			if (win.isFocused()) {
				win.webContents.executeJavaScript(`
				document.querySelector(".tab.active-tab > button").click()
				`);
			}
		});
	});
	win.on("blur", () => {
		globalShortcut.unregisterAll();
	});

	app.on("web-contents-created", (_e, contents) => {
		contextMenu({
			window: contents,
			showSelectAll: false,
			showSaveImageAs: true,
			showInspectElement: true,
			showSearchWithGoogle: false,
			showCopyImageAddress: true,
			showSaveImage: true,
			showSaveImageAs: true,
			showCopyVideoAddress: true,
			showSaveVideo: true,
			showSaveVideoAs: true,
			showSaveLinkAs: true,
			prepend: (defaultActions, parameters, browserWindow) => [
				{
					label: "Open link in new tab",
					visible: parameters.linkURL != "",
					click: () => {
						win.webContents.executeJavaScript(`createNewTab('${parameters.linkURL}')`);
					}
				},
				{
					label: "Search Google for “{selection}”",
					visible: parameters.selectionText.trim().length > 0,
					click: () => {
						win.webContents.executeJavaScript(`createNewTab('https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}')`);
					}
				},
				{
					label: "Print...",
					click: () => {
						win.webContents.executeJavaScript(`
						document.querySelector(".webview.active-tab").printToPDF({});
						`);
					}
				}
			]
		});
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
