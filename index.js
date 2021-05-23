'use strict';
const path = require('path');
const { app, BrowserWindow, Menu, Tray, screen, ipcMain } = require('electron');
/// const {autoUpdater} = require('electron-updater');
const { is } = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const config = require('./config.js');
const menu = require('./menu.js');
const packageJson = require('./package.json');
const fetch = require('node-fetch');
// in the main process:
require('@electron/remote/main').initialize()

require('./loadConfig.js')


unhandled();
// debug();
contextMenu();

app.setAppUserModelId(packageJson.build.appId);

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow;

require('electron-reload')(__dirname);

const createMainWindow = async (width, height) => {
	let padding = 20;
	const win = new BrowserWindow({
		title: app.name,
		show: false,
		width: 400,
		height: 260,
		frame: false,
		x: width - (400 + padding),
		y: height - (260 + padding),
		transparent: true,
		alwaysOnTop: true,
		maximizable: false,
		resizable: false,
		movable: false,
		webPreferences: {
			preload: path.join(__dirname, 'main.js'),
			nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false
		},
	});

	win.on('ready-to-show', () => {
		win.setSkipTaskbar(true);
		if (tracking) {
			win.show();
		} else {
			tracking.start = new Date().toISOString();
			console.log(tracking);
		}
	});

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined;
	});

	let tray = null;

	win.on('close', (e) => {
		e.preventDefault();
		win.hide();
		win.setSkipTaskbar(true);
		tracking = {};
		tray = createTray();
	})

	win.on('show', () => {
		if (tray) {
			tray.destroy();
			mainWindow.webContents.executeJavaScript(`document.querySelector('#project').value = '${defaultProject}'`);
		}
	})

	if (clickIndex === 0) {
		tray = createTray(win);
	}

	return win;
};


let clickIndex = 0;

function createTray(win) {
	let appIcon = new Tray(path.join(__dirname, "./static/icon.png"));

	appIcon.on('click', () => {
		if (clickIndex === 0) {
			tracking.start = new Date().toISOString();
			console.log(tracking);
			clickIndex = 1;
		} else {
			tracking.end = new Date().toISOString();
			console.log('loading main window')
			if (win)
				win.loadFile(path.join(__dirname, 'index.html'));
			console.log('file loaded');
			mainWindow.show();
			mainWindow.webContents.executeJavaScript(`document.querySelector('#project').value = '${defaultProject}'`);
			mainWindow.webContents.send('times', tracking);
			clickIndex = 0;
		}
	})

	appIcon.on('double-click', () => {
		config.clear();
		require('./loadConfig.js');
	})
	appIcon.setToolTip('Stop Timer');
	console.log(clickIndex);
	return appIcon;
}

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

app.on('window-all-closed', () => {
	if (!is.macos) {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

ipcMain.on('report', (event, data) => {
	fetch(`https://api.clockify.me/api/v1/workspaces/${config.get('workspaces')[config.get('workspace')]}/time-entries/`, {
            method: 'POST',
            headers: {
                'X-Api-Key': config.get('apiKey'),
                'Content-Type': 'application/json'
            },
			body: JSON.stringify({
				start: data.start,
				billable: data.billable,
				description: data.description,
				projectId: config.get('projects')[data.project],
				end: data.end
			})
        })
            .then(res => res.text())
            .then(res => JSON.parse(res))
            .then(res => {
                console.log(res);
            })
})

let defaultProject = config.get('project');

let tracking = {};

(async () => {
	await app.whenReady();
	Menu.setApplicationMenu(menu);
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	mainWindow = await createMainWindow(width, height);

	mainWindow.webContents.executeJavaScript(`document.querySelector('#project').value = '${defaultProject}'`);
})();
