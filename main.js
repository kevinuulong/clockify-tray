window.onload = () => {
    const { BrowserWindow } = require('@electron/remote');
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.on('times', (event, data) => {
        console.log('times received');
        times = data;
        console.log(times);
    });

    let times;

    document.querySelector("#close").addEventListener('click', () => {
        BrowserWindow.getFocusedWindow().close();
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
            document.querySelectorAll("input").forEach(el => {
                el.value = '';
            })
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