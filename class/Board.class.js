"use strict";

const tabVec = [
    [0, 1], //0: Right
    [0, -1], //1: Left
    [1, 0], //2: Down
    [-1, 0], //3: Up
    [1, 1], //4: Diag down right
    [1, -1], //5: Diag down left
    [-1, 1], //6: Diag up right
    [-1, -1] //7: Diag up left
];

class Board extends Rectangle {
    constructor(n) {
        super(0, 0, 0, 0, 'green');
        this.b = new Rectangle(0, 0, 0, 0, 'black');
        this.tour = false;
        this.playedCases = 0;
        this.nbCase = n;
        this.generateCases(n);
    }

    generateCases(n) {
        this.cases = generateArray(n, n)
            .map((c, y) =>
                c.map((_, x) => new Case(x, y, x + "|" + y))
            );

        const m = n - 1;
        const mid = n / 2;
        this.evalPlat = generateArray(n, n)
            .map((c, y) =>
                c.map((_, x) => {
                    if ((y === 0 && x === 0) ||
                        (y === m && x === 0) ||
                        (y === 0 && x === m) ||
                        (y === x && y === m))
                        return 32;

                    if (y === 0 ||
                        x === 0 ||
                        x === m ||
                        y === m)
                        return 16;

                    if (y === mid && x === mid ||
                        y === mid && x === mid - 1 ||
                        y === mid - 1 && x === mid ||
                        y === mid - 1 && x === mid - 1)
                        return 0;

                    return 5;
                }));
    }

    draw(ctx) {
        super.draw(ctx);
        this.b.draw(ctx);
        ctx.save();

        //Tour
        ctx.fillStyle = !this.tour ? 'black' : 'white';
        ctx.fillRect(0, this.b.y, this.w, this.b.h);

        //Tour text
        ctx.translate(this.w / 2, this.h + this.b.h / 2);
        ctx.fillStyle = this.tour ? 'black' : 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Joueur ${this.tour ? 2 : 1}`, 0, 0);
        ctx.translate(-this.w / 2, -this.b.h / 2);
        ctx.strokeRect(0, 0, this.b.w, this.b.h);

        ctx.restore();

        this.cases.forEach(y => y.forEach(c => c.draw(ctx)));
    }

    setSize(wh) {
        this.b.w = this.w = wh;
        this.b.y = this.h = wh * 0.9;
        this.b.h = wh * 0.1;
        this.cw = wh / this.nbCase;
        this.ch = (wh / this.nbCase) * 0.9;
        this.cases.forEach((c, y) =>
            c.forEach((o, x) => {
                o.x = x * this.cw;
                o.y = y * this.ch;
                o.w = this.cw;
                o.h = this.ch;
            })
        );
    }

    isCoorIn(x, y) {
        return x >= 0 && x < this.cases[0].length &&
            y >= 0 && y < this.cases.length;
    }

    click(x, y) {
        //if case is empty
        if (this.cases[y][x].tour === -1 &&
            this.cases[y][x].m === true) {

            //Draw only when clicked
            this.cases.forEach(y => y.forEach(x => x.mark(false)));

            const aRemplacer = [];
            let tempMarked = [];

            tabVec.forEach(v => {
                let nY = y + v[0];
                let nX = x + v[1];
                if (this.isCoorIn(nX, nY) && this.cases[nY][nX].tour === !this.tour) {
                    tempMarked.push([nX, nY]);
                    do {
                        nY += v[0];
                        nX += v[1];
                        tempMarked.push([nX, nY]);
                    } while (this.isCoorIn(nX, nY) && this.cases[nY][nX].tour === !this.tour);

                    if (this.isCoorIn(nX, nY) && this.cases[nY][nX].tour === this.tour) {
                        tempMarked.forEach(e => {
                            for (let ar of aRemplacer) {
                                if (ar[0] === e[0] &&
                                    ar[1] === e[1])
                                    return;
                            }
                            aRemplacer.push(e);
                        });
                    }
                    tempMarked = [];
                }
            });

            aRemplacer.forEach(e => this.cases[e[1]][e[0]].changeTour(this.tour));

            this.cases[y][x].changeTour(this.tour);
            this.cases[y][x].over(-1);
            this.tour = !this.tour;

            this.playedCases++;
            return true;
        }
        return false;
    }

    over(x, y) {
        //if case is empty
        if (this.cases[y][x].tour === -1 &&
            this.cases[y][x].m === true) {
            this.cases[y][x].over(this.tour);
        }
    }

    leave(x, y) {
        //if case is empty
        if (this.cases[y][x].tour !== -1 &&
            this.cases[y][x].m === true) {
            this.cases[y][x].over(-1);
        }
    }

    getCoupsPossible(tour = this.tour) {
        return this.cases.reduce((tabTest, cY, y) => {
            cY.forEach((c, x) => {
                if (c.tour !== tour)
                    return;

                tabVec.forEach(v => {
                    let nY = y + v[0];
                    let nX = x + v[1];
                    if (this.isCoorIn(nY, nX) && this.cases[nY][nX].tour === !tour) {
                        do {
                            nY += v[0];
                            nX += v[1];
                        } while (this.isCoorIn(nY, nX) && this.cases[nY][nX].tour === !tour);

                        if (this.isCoorIn(nY, nX) && this.cases[nY][nX].tour === -1) {
                            const res = [nX, nY];
                            let inArray = false;
                            for (let ar of tabTest)
                                if (ar[0] === res[0] &&
                                    ar[1] === res[1]) {
                                    inArray = true;
                                    break;
                                }
                            if (!inArray)
                                tabTest.push(res);
                            this.cases[nY][nX].mark(true);
                        }
                    }
                });
            });
            return tabTest;
        }, []);
    }

    isFinished() {
        return this.playedCases === this.cases.length * this.cases[0].length;
    }

    //0 => equality
    //1 => black win
    //2 => white win
    getWinner() {
        const diff = this.cases
            .reduce((n, o) => {
                o.forEach(o => {
                    if (o.tour !== -1)
                        n += !o.tour ? 1 : -1;
                });
                return n;
            }, 0);
        if (diff === 0)
            return 0;
        else
            return diff < 0 ? 2 : 1;
    }

    evalSituation(tour = this.tour) {
        return this.cases
            .reduce((n1, e, y) =>
                n1 + e.reduce((n2, f, x) => {
                    if (f.tour !== -1) {
                        if (f.tour === tour)
                            n2 += this.evalPlat[y][x];
                        else
                            n2 -= this.evalPlat[y][x];
                    }
                    return n2;
                }, 0), 0);
    }

    getSituation() {
        //return JSON.stringify(
        return {
            tour: this.tour,
            playedCases: this.playedCases,
            cols: this.cases.reduce((t, s) => t.concat(s.map(x => x.tour)), []),
            nbCase: this.nbCase
        };
        //);
    }

    setSituation(s) {
        //s = JSON.parse(s);
        this.tour = s.tour;
        this.playedCases = s.playedCases;
        let nbCase;
        if (s.nbCase === this.nbCase)
            nbCase = this.nbCase;
        else {
            nbCase = s.nbCase;
            this.generateCases(nbCase);
        }

        s.cols.forEach((val, i) => {
            const x = i % nbCase;
            const y = floor(i / nbCase);
            this.cases[y][x].mark(false);
            this.cases[y][x].changeTour(val);
        });
        this.getCoupsPossible();
    }

    static createFrom(o) {
        o.isFinished = Board.prototype.isFinished;
        o.setSituation = Board.prototype.setSituation;
        o.getSituation = Board.prototype.getSituation;
        o.click = Board.prototype.click;
        o.getCoupsPossible = Board.prototype.getCoupsPossible;
        o.evalSituation = Board.prototype.evalSituation;
        o.isCoorIn = Board.prototype.isCoorIn;
        o.getWinner = Board.prototype.getWinner;
        o.cases.forEach(c => c.forEach(o => Case.createFrom(o)));
        return o;
    }
}