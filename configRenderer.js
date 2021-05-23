const { ipcRenderer } = require('electron');
const confetti = require('canvas-confetti');

window.onload = () => {

    document.querySelector("#close").addEventListener('click', () => {
        ipcRenderer.send('close');
    })

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.querySelector("#next").click();
    })
}

ipcRenderer.on('requestApiKey', () => {

    console.log('request received');

    document.querySelector("#instruction").textContent = "Clockify API Key";
    document.querySelector("#next").title = 'apiKey';
    document.querySelector("#apiKey").style.display = 'block';

    document.querySelector("#next[title='apiKey']").addEventListener('click', () => {
        ipcRenderer.send('apiKey', document.querySelector("#apiKeyInput").value);
        document.querySelector("#apiKey").style.display = 'none';
        removeButtonListeners();
    })

})

ipcRenderer.on('requestWorkspace', (e, data) => {

    console.log('request received');

    document.querySelector("#instruction").textContent = "Clockify Workspace";
    document.querySelector("#next").title = 'workspace';
    document.querySelector("#workspace").style.display = 'block';

    Object.keys(data).forEach((el) => {
        document.querySelector("#workspace").innerHTML += `<p class="workspaceOption">${el}</p>`;
    })

    document.querySelectorAll(".workspaceOption").forEach((el) => {
        el.addEventListener('click', () => {
            current = document.querySelector(".workspaceOption.selected");
            if (current) current.classList.remove('selected');
            el.classList.toggle('selected');
        })
    })



    document.querySelector("#next[title='workspace']").addEventListener('click', () => {
        console.log('sending workspace')
        ipcRenderer.send('workspace', document.querySelector(".workspaceOption.selected").textContent);
        document.querySelector("#workspace").style.display = 'none';
        removeButtonListeners();
    })
})

ipcRenderer.on('requestProject', (e, data) => {

    console.log('request received');

    document.querySelector("#instruction").textContent = "Default Project";
    document.querySelector("#next").title = 'project';
    document.querySelector("#project").style.display = 'block';

    Object.keys(data).forEach((el) => {
        document.querySelector("#project").innerHTML += `<p class="projectOption">${el}</p>`;
    })

    document.querySelectorAll(".projectOption").forEach((el) => {
        el.addEventListener('click', () => {
            current = document.querySelector(".projectOption.selected");
            if (current) current.classList.remove('selected');
            el.classList.toggle('selected');
        })
    })



    document.querySelector("#next[title='project']").addEventListener('click', () => {
        console.log('sending project')
        ipcRenderer.send('project', document.querySelector(".projectOption.selected").textContent);
        document.querySelector("#project").style.display = 'none';
        removeButtonListeners();
    })
})

ipcRenderer.on('configComplete', (e, data) => {

    console.log('request received');

    document.querySelector("#instruction").textContent = "Configuration Completed";
    document.querySelector("#next").title = 'complete';
    document.querySelector("#next").textContent = 'Complete';
    document.querySelector("#complete").style.display = 'block';

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });

    document.querySelector("#next[title='complete']").addEventListener('click', () => {
        console.log('closing configuration')
        ipcRenderer.send('close');
    })
})

let count = 200;
let defaults = {
    origin: { y: 0.7 }
};

function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio)
    }));
}


// I love but also hate event listeners
function removeButtonListeners() {
    let old = document.querySelector("#next");
    let next = old.cloneNode(true);
    old.parentNode.replaceChild(next, old);
}
