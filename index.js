// checks if the app is being run as an installer
const setupEvents = require("./installers/setupEvents");
if (setupEvents.handleSquirrelEvent()) {
	return;
}

const { app, ipcMain, globalShortcut, session } = require("electron");
const { PARAMS, VALUE, MicaBrowserWindow } = require("mica-electron");
const contextMenu = require("electron-context-menu");
const path = require("path");
const { promises: fs } = require("fs");
const { ElectronChromeExtensions } = require("electron-chrome-extensions");

app.commandLine.appendSwitch("enable-transparent-visuals");

const manifestExists = async (dirPath) => {
	if (!dirPath) return false;
	const manifestPath = path.join(dirPath, "manifest.json");
	try {
		return (await fs.stat(manifestPath)).isFile();
	} catch {
		return false;
	}
};

async function loadExtensions(session, extensionsPath) {
	const subDirectories = await fs.readdir(extensionsPath, {
		withFileTypes: true
	});

	const extensionDirectories = await Promise.all(
		subDirectories
			.filter((dirEnt) => dirEnt.isDirectory())
			.map(async (dirEnt) => {
				const extPath = path.join(extensionsPath, dirEnt.name);

				if (await manifestExists(extPath)) {
					return extPath;
				}

				const extSubDirs = await fs.readdir(extPath, {
					withFileTypes: true
				});

				const versionDirPath = extSubDirs.length === 1 && extSubDirs[0].isDirectory() ? path.join(extPath, extSubDirs[0].name) : null;

				if (await manifestExists(versionDirPath)) {
					return versionDirPath;
				}
			})
	);

	const results = [];

	for (const extPath of extensionDirectories.filter(Boolean)) {
		console.log(`Loading extension from ${extPath}`);
		try {
			const extensionInfo = await session.loadExtension(extPath);
			results.push(extensionInfo);
		} catch (e) {
			console.error(e);
		}
	}

	return results;
}

app.on("ready", () => {
	const extensions = new ElectronChromeExtensions();
	const win = new MicaBrowserWindow({
		width: 1200,
		height: 800,
		effect: PARAMS.BACKGROUND.AUTO,
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

	extensions.addTab(win.webContents, win);

	win.removeMenu();

	loadExtensions(session.defaultSession, path.join(app.getPath("userData"), "Extensions"));

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
