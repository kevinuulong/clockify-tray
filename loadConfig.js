const config = require('./config.js');
const fetch = require('node-fetch');
const path = require('path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { constants } = require('buffer');

let configWindow;

const createConfigWindow = async () => {
    const win = new BrowserWindow({
        title: app.name,
        width: 400,
        height: 260,
        frame: false,
        transparent: true,
        maximizable: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'configRenderer.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
    });

    win.loadFile(path.join(__dirname, 'config.html'));

    win.on('ready-to-show', () => {
        win.show();
    });

    win.on('closed', () => {
        // Dereference the window
        // For multiple windows store them in an array
        configWindow = undefined;
    });

    win.on('close', () => {
        config.set('complete', false)
    })

    win.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    })


    return win;
}

ipcMain.on('close', () => {
    configWindow.close();
})

// Check Config
if (!config.get('complete')) {

    console.log(config.get('complete'));

    console.log('creating config window');

    (async () => {
        await app.whenReady();
        configWindow = await createConfigWindow();
        // config.clear();
        configSteps();
    })();

};

ipcMain.on('apiKey', (event, data) => {
    console.log(data);
    config.set('apiKey', data);
    configSteps();
})

ipcMain.on('workspace', (event, data) => {
    console.log(data);
    config.set('workspace', data);
    configSteps();
})

ipcMain.on('project', (event, data) => {
    console.log(data);
    config.set('project', data);
    configSteps();
})


function configSteps() {
    // config.clear();
    if (!config.has('apiKey')) {
        console.log('requesting API Key');
        configWindow.webContents.send('requestApiKey');
    } else if (!config.has('workspaces')) {
        fetch('https://api.clockify.me/api/v1/workspaces/', {
            method: 'GET',
            headers: {
                'X-Api-Key': config.get('apiKey'),
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.text())
            .then(res => JSON.parse(res))
            .then(res => {
                let workspaces = {};
                res.forEach(el => {
                    workspaces[el.name] = el.id;
                });
                config.set('workspaces', workspaces);
                configSteps();
            })
    } else if (!config.has('workspace')) {
        console.log('requesting workspace');
        configWindow.webContents.send('requestWorkspace', config.get('workspaces'));
    } else if (!config.has('projects')) {
        fetch(`https://api.clockify.me/api/v1/workspaces/${config.get('workspaces')[config.get('workspace')]}/projects/`, {
            method: 'GET',
            headers: {
                'X-Api-Key': config.get('apiKey'),
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.text())
            .then(res => JSON.parse(res))
            .then(res => {
                let projects = {};
                res.forEach(el => {
                    projects[el.name] = el.id;
                });
                config.set('projects', projects);
                console.log(config.get('projects'));
                configSteps();
            })
    } else if (!config.has('project')) {
        console.log('requesting project');
        configWindow.webContents.send('requestProject', config.get('projects'));
    } else {
        console.log('configuration complete');
        config.set('complete', true);
        configWindow.webContents.send('configComplete');
    }
}

