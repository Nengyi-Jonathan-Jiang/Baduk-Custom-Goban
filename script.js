function setCurrScreen(screen){
    document.querySelectorAll('body>div.screen').forEach(screenDiv => {
        if(screenDiv.id === `${screen}-screen`) screenDiv.classList.add('active');
        else screenDiv.classList.remove('active')
    })
}

setCurrScreen('home');

document.getElementById('play-button').onclick = _ => {
    setCurrScreen('join-game');
}

document.getElementById('create-game-button').onclick = _ => {
    setCurrScreen('create-game');
}
document.getElementById('create-game').onclick = _ => {
    const data = {
        komi: +document.getElementById('komi').value,
        board: +document.getElementById('game-board-type').value
    };
    fetch("/create-game", {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {"Content-Type": "application/json"},
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(data),
    }).then(res => res.json().then(({code}) => {
        window.location.assign(`/play?code=${code}`);
    }));
}

document.getElementById('game-code').addEventListener('change', ({target}) => {
    const code = target.value;
    if(code.length === 5) {
        fetch("/join-game", {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {"Content-Type": "application/json"},
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify({code}),
        }).then(res => res.json().then(({status}) => {
            if(status !== 'Bad code') {
                window.location.assign(`/play?code=${code}`);
            }
            else {
                alert(`Could not find board with code ${code}`)
                target.value = '';
            }
        }));
    }
})