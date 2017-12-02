"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const defaultOptions = {
    tickInterval: 500,
};
class Runtime {
    constructor(options) {
        this._stop = false;
        this.nextTicks = [];
        this.everyTicks = [];
        this.ticksCount = 0;
        this.options = _.merge({}, defaultOptions, options);
    }
    start() {
        this._stop = false;
        this.tick();
    }
    stop() {
        this._stop = true;
    }
    tick() {
        const tickStart = new Date().getTime();
        setTimeout(() => {
            if (!this._stop) {
                this.ticksCount++;
                this.runTicks(this.nextTicks, tickStart);
                this.nextTicks = [];
                this.runTicks(this.everyTicks, tickStart);
                this.tick();
            }
        }, this.options.tickInterval);
    }
    runTicks(ticks, tickStart) {
        _.forEach(ticks, (tick) => {
            tick(new Date().getTime() - tickStart, this.ticksCount);
        });
    }
    nextTick(nextTick) {
        this.nextTicks.push(nextTick);
    }
    everyTick(everyTick) {
        this.everyTicks.push(everyTick);
    }
}
exports.Runtime = Runtime;
