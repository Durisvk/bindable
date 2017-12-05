import * as _ from "lodash";


export interface RuntimeOptions {
    tickInterval?: number; // Milliseconds for every tick
}

export type TickCallback = (dt?: number, i?: number) => void;

const defaultOptions: RuntimeOptions = {
    tickInterval: 500,
};


export class Runtime {

    private options: RuntimeOptions;

    private _stop = false;

    private nextTicks: TickCallback[] = [];
    private everyTicks: TickCallback[] = [];

    private ticksCount = 0;

    public constructor(options?: RuntimeOptions) {
        this.options = _.merge({}, defaultOptions, options);
    }

    public start(): void {
        this._stop = false;
        this.tick();
    }

    public stop(): void {
        this._stop = true;
    }

    private tick(): void {
        const tickStart: number = new Date().getTime();
        setTimeout(() => {
            if (!this._stop) {
                this.ticksCount += 1;
                this.runTicks(this.nextTicks, tickStart);
                this.nextTicks = [];

                this.runTicks(this.everyTicks, tickStart);
                this.tick();
            }
        }, this.options.tickInterval);
    }

    private runTicks(ticks: TickCallback[], tickStart: number) {
        _.forEach(ticks, (tick) => {
            tick(new Date().getTime() - tickStart, this.ticksCount);
        });
    }

    public nextTick(nextTick: TickCallback) {
        this.nextTicks.push(nextTick);
    }

    public everyTick(everyTick: TickCallback) {
        this.everyTicks.push(everyTick);
    }

}