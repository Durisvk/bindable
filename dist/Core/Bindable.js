"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Runtime_1 = require("./Runtime");
const Watcher_1 = require("./Watcher");
const WebSocket_1 = require("./WebSocket");
const Actor_1 = require("./Actor");
const defaultOptions = {
    runtime: {
        tickInterval: 500,
    },
    websocket: {
        port: 8000,
    }
};
class Bindable {
    constructor(model, options) {
        this.options = _.merge({}, defaultOptions, options);
        this.model = model;
        this.init();
    }
    init() {
        this.websocket = new WebSocket_1.WebSocket(this.options.websocket);
        this.actor = new Actor_1.Actor(this.websocket);
        this.watcher = new Watcher_1.Watcher(this.model);
        this.runtime = new Runtime_1.Runtime(this.options.runtime);
        this.runtime.everyTick((dt, i) => {
            const changes = this.watcher.getChanges();
            if (changes.length > 0) {
                this.actor.flush(changes, this.model);
                this.watcher.clearChanges();
            }
        });
        this.runtime.start();
    }
    destroy() {
        this.runtime.stop();
        this.websocket.destroy();
    }
    getModel() {
        return this.model;
    }
    getProxy() {
        return this.watcher.getProxy();
    }
}
exports.Bindable = Bindable;
