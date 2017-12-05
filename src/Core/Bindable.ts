import * as _ from "lodash";
import { Runtime } from "./Runtime";
import { Watcher } from "./Watcher";
import { WebSocket, ServerOptions } from "./WebSocket";
import { Communicator } from "./Communicator";

export interface BindableOptions {
    runtime?: {
        tickInterval?: number,
    };
    websocket?: ServerOptions;
}

const defaultOptions: BindableOptions = {
    runtime: {
        tickInterval: 500,
    },
    websocket: {
        port: 8000,
    }
};

export class Bindable<T extends object> {

    private options: BindableOptions;

    private model: T;

    // Internals
    private runtime: Runtime;
    private watcher: Watcher;
    private websocket: WebSocket;
    private actor: Communicator;

    public constructor(model: T, options?: BindableOptions) {
        this.options = _.merge({}, defaultOptions, options);
        this.model = model;
        this.init();
    }

    private init() {
        this.websocket = new WebSocket(this.options.websocket);
        this.actor = new Communicator(this.websocket);
        this.watcher = new Watcher(this.model);
        this.runtime = new Runtime(this.options.runtime);

        this.runtime.everyTick((dt?: number, i?: number) => {
            const changes = this.watcher.getChanges();
            if (changes.length > 0) {
                this.actor.flush(changes, this.model);
                this.watcher.clearChanges();
            }
        });

        this.runtime.start();
    }

    public destroy(): void {
        this.runtime.stop();
        this.websocket.destroy();
    }

    public getModel(): T {
        return this.model;
    }

    public getProxy(): any {
        return this.watcher.getProxy();
    }
}