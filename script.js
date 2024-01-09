"use strict";

function calculateCoor(e) {
    const {
        left,
        top
    } = canvas.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    if (y >= p.h ||
        x >= p.w)
        return {
            ignore: true
        };

    //Get coordinates of cases
    const nX = floor(x / p.cw);
    const nY = floor(y / p.ch);

    if (nX >= p.nbCase ||
        nY >= p.nbCase) {
        error("Error at ", nX, nY, x, y);
        return {
            ignore: true
        };
    }

    return {
        nX: nX,
        nY: nY
    };
}

//Global Canvas
const canvas = $('canvas#myCanvas')[0];
const ctx = canvas.getContext('2d');

canvas.onmousedown = e => {

    const {
        nX,
        nY,
        ignore
    } = calculateCoor(e);

    if (ignore) return;

    if (!iaThinking && !p.tour) {
        if (p.click(nX, nY)) {
            if (p.isFinished())
                finishedGame();
            else {
                if (p.getCoupsPossible().length === 0) {
                    let msg = `Pas de coup possible pour joueur ${p.tour ? 2 : 1}`;
                    p.tour = !p.tour;
                    if (p.getCoupsPossible().length === 0)
                        msg = `Fin du jeu, conquête de joueur ${p.tour ? 2 : 1}`;
                    alert(msg);
                } else
                    iaPlay();
            }
        }
    }
};

function finishedGame() {
    const win = p.getWinner();
    const res = win === 0 ? "Egalité" : `Victoire de Joueur ${win}`;
    alert(`Fin du jeu ! ${res}`);
}

canvas.onmousemove = e => {

    const {
        nX,
        nY,
        ignore
    } = calculateCoor(e);

    if (ignore) return;

    if (!iaThinking) {
        p.cases.forEach(y => {
            y.forEach(x => {
                if (x.o !== -1 &&
                    y !== nY &&
                    x !== nX)
                    return x.over(-1);
            });
        });

        p.over(nX, nY);
    }
};

//Global Board
let p;
//For N*N board
const nbCase = 8;

//IA depth of the minimax tree
const depth = 5;

//Enable showing case number
const __debug = false;

window.onload = _ => {
    if (!window.Worker ||
        typeof Worker === undefined) {
        const msg = "Worker not supported on your browser";
        alert(msg);
        throw new Error(msg);
    }

    resetGame();
    requestAnimationFrame(anime);
};

window.onresize = resize;

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    p.setSize(min(innerWidth, innerHeight));
    ctx.font = `${p.cw / 3}pt bold Arial`;
}

function resetGame() {
    p = new Board(nbCase);

    //First state
    const nF = floor(p.nbCase / 2);
    p.cases[nF - 1][nF - 1].changeTour(true);
    p.cases[nF - 1][nF].changeTour(false);
    p.cases[nF][nF - 1].changeTour(false);
    p.cases[nF][nF].changeTour(true);
    p.playedCases = 4;

    p.getCoupsPossible();
    resize();
}

let oldTime = 0;
let ccTime = 0;
let loadingAni = 0;
const aniSpeed = 100;

function anime(currentTime) {

    const delta = currentTime - oldTime;
    ccTime += delta;
    oldTime = currentTime;
    if (ccTime > aniSpeed) {
        ccTime -= aniSpeed;
        loadingAni++;
        if (loadingAni > 7)
            loadingAni = 0;
    }

    ctx.clearRect(0, 0, p.w, p.h + p.b.h);
    p.draw(ctx);
    if (iaThinking) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, p.w, p.h);

        ctx.save();
        ctx.translate(p.w / 2, p.h / 2);
        ctx.lineWidth = 5;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,255,255,${constrain(abs(i-loadingAni), 0, 8, 0, 100)/5}`;
            ctx.rotate(45 * Math.PI / 180);
            ctx.moveTo(60, 0);
            ctx.lineTo(120, 0);
            ctx.stroke();
        }
        ctx.restore();
    }
    requestAnimationFrame(anime);
}

let iaThinking = false;
async function iaPlay() {
    iaThinking = true;
    let p1CantPlay;
    let played = 0;
    do {
        p1CantPlay = false;
        const r = await getBestCoup();
        p.click(...r.data);
        played++;
        if (p.isFinished())
            finishedGame();
        else {
            if (p.getCoupsPossible() === 0) {
                p.tour = !p.tour;
                p1CantPlay = true;
            }
        }
    } while (p1CantPlay);
    if (played > 1)
        alert('Joueur 2 a pu jouer ' + played + ' fois');

    iaThinking = false;
}

function getBestCoup() {
    const ai = new Worker('class/ia.js');
    return new Promise((resolve, reject) => {
        ai.onerror = e => {
            reject(`${e.message} (${e.filename}:${e.lineno})`);
        };
        ai.onmessage = function (m) {
            resolve(m);
            this.terminate();
        };
        ai.postMessage([p, depth]);
    });
}