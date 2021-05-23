window.onload = () => {
    const { BrowserWindow } = require('@electron/remote');
    const { ipcRenderer } = require('electron');

    if (ipcRenderer.sendSync('darkMode')) document.querySelector("link[rel='stylesheet']").setAttribute('href', 'dark.css');

    ipcRenderer.on('times', (event, data) => {
        console.log('times received');
        times = data;
        console.log(times);
    });

    document.querySelector('#project').value = ipcRenderer.sendSync('defaultProject');


    let times;

    document.querySelector("#close").addEventListener('click', () => {
        BrowserWindow.getFocusedWindow().close();
        location.reload();
    })

    let session = null;
    document.querySelector("#submit").addEventListener('click', () => {
        session = {
            description: document.querySelector("#title").value,
            project: document.querySelector("#project").value,
            billable: document.querySelector("#billable").checked,
            start: times.start,
            end: times.end
        }
        if (!Object.values(session).includes("")) {
            BrowserWindow.getFocusedWindow().close();
            location.reload();
            ipcRenderer.send('report', session);
        }
        console.log(session);
    })

    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            document.querySelector("#submit").click();
        }
    })
}