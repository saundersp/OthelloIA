"use strict";

class Case extends Rectangle {
    constructor(x, y, n) {
        super(x, y, 0, 0, 'green');
        this.n = n;
        this.tour = -1;
        this.o = -1;
        this.m = false;
    }

    mark(val) {
        this.m = val;
    }

    over(tour) {
        this.o = tour;
    }

    changeTour(tour) {
        this.tour = tour;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.strokeStyle = 'grey';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.w / 2, 0);
        ctx.lineTo(this.w / 2, this.h);
        ctx.moveTo(0, this.h / 2);
        ctx.lineTo(this.w, this.h / 2);
        ctx.stroke();
        ctx.lineWidth = 1;

        if (this.o !== -1 || this.tour !== -1) {
            ctx.beginPath();
            ctx.translate(this.w / 2, this.h / 2);
            ctx.arc(0, 0, this.w / 2 * 0.85, 0, 2 * Math.PI, false);

            if (this.o !== -1)
                ctx.fillStyle = !this.o ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
            else
                ctx.fillStyle = !this.tour ? 'black' : 'white';

            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.translate(-this.w / 2, -this.h / 2);
        }

        if (this.m) {
            ctx.beginPath();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 5;
            const size = 0.8;
            const left = 1 - size;
            ctx.moveTo(this.w * left, this.h * left);
            ctx.lineTo(this.w * size, this.h * size);
            ctx.moveTo(this.w * size, this.h * left);
            ctx.lineTo(this.w * left, this.h * size);
            ctx.closePath();
            ctx.stroke();
            ctx.lineWidth = 1;
        }

        if (__debug) {
            ctx.fillStyle = 'yellow';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = 'yellow';
            ctx.strokeRect(0, 0, this.w, this.h);
            ctx.translate(this.w / 2, this.h / 2);
            ctx.fillText(this.n, 0, 0);
        }

        ctx.restore();
    }

    static createFrom(o) {
        o.mark = Case.prototype.mark;
        o.changeTour = Case.prototype.changeTour;
        o.over = Case.prototype.over;
        return o;
    }
}