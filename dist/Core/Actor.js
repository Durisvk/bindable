"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const guard_1 = require("../Guards/guard");
const Obj_1 = require("../Utils/Obj");
class Actor {
    constructor(websocket) {
        this.websocket = websocket;
    }
    flush(changes, model) {
        const copiedChanges = _.cloneDeep(changes);
        _.forEach(this.websocket.getActiveClientsIds(), (val, key) => this.applyChanges(model, copiedChanges, val, key));
    }
    applyChanges(model, changes, ws, id) {
        console.log(id);
        const obj = {};
        _.forEach(changes, _.partial(this.applyChange, model, id, obj));
        this.websocket.send(id, obj);
    }
    applyChange(model, id, obj, change) {
        if (change.guard) {
            const g = change.guard(model, id, { direction: guard_1.DIRECTION.OUT });
            if (g instanceof Promise) {
                // TODO: add asynchronous functionality for guards
            }
            else if (g) {
                return;
            }
        }
        Obj_1.default.walkOnPath(obj, change.path, (parent, key) => {
            parent[key] = change.newValue;
        });
    }
}
exports.Actor = Actor;
