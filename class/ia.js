importScripts('./../toolbox.min.js', 'Board.class.js', 'Case.class.js');

let called = 0;

self.onmessage = e => {
    const [p, currDepth] = e.data;
    const b = Board.createFrom(p);

    const res = getBestCoup(b, currDepth, -Infinity, Infinity);
    log(called.toLocaleString(), res[0]);
    self.postMessage(res[1]);
};

function getBestCoup(p, currDepth, alpha, beta) {

    called++;

    if (currDepth === 0)
        return [p.evalSituation(), null];
    else if (p.isFinished())
        return [p.cases.reduce((n, o) => n + o.reduce((n, c) => n + (c.tour === p.tour ? 1 : -1), 0), 0) * 100, null];

    const oldSituation = p.getSituation();
    const tCoups = p.getCoupsPossible();

    if (tCoups.length === 0) {
        p.tour = !p.tour;
        return getBestCoup(p, currDepth - 1, alpha, beta);
    }

    if (!p.tour) {
        let maxEval = [-Infinity, null];
        for (const coup of tCoups) {
            const [nX, nY] = coup;
            p.click(nX, nY);

            const eval = getBestCoup(p, currDepth - 1, alpha, beta);

            if (eval[0] > maxEval[0])
                maxEval = [eval[0], coup];
            alpha = max(alpha, eval[0]);
            if (beta <= alpha)
                break;

            p.setSituation(oldSituation);
        }
        return maxEval;
    } else {
        let minEval = [Infinity, null];
        for (const coup of tCoups) {
            const [nX, nY] = coup;
            p.click(nX, nY);

            const eval = getBestCoup(p, currDepth - 1, alpha, beta);

            if (eval[0] < minEval[0])
                minEval = [eval[0], coup];
            beta = min(beta, eval[0]);
            if (beta <= alpha)
                break;

            p.setSituation(oldSituation);
        }
        return minEval;
    }
}