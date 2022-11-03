const createWindowsInstaller = require("electron-winstaller").createWindowsInstaller;
const path = require("path");
const version = "0.1.0";

getInstallerConfig()
	.then(createWindowsInstaller)
	.catch((error) => {
		console.error(error.message || error);
		process.exit(1);
	});

function getInstallerConfig() {
	console.log("creating windows installer");
	const rootPath = path.join("./");
	const outPath = path.join(rootPath, "release-builds");

	return Promise.resolve({
		appDirectory: path.join(outPath, "FluentBrowser-win32-x64/"),
		authors: "Pi",
		description: "Fluent themed browser, made with ElectronJS",
		noMsi: true,
		outputDirectory: path.join(outPath, "windows-installer"),
		exe: "FluentBrowser.exe",
		setupExe: "FluentBrowser-setup-v" + version + ".exe",
		setupIcon: path.join(rootPath, "src", "icons", "win", "icon.ico"),
		iconUrl: "https://raw.githubusercontent.com/ThePiGuy3141/fluent-browser/master/src/icons/win/icon.ico",
		loadingGif: path.join(rootPath, "src", "icons", "png", "256x256.png")
	});
}
