"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Serializable_1 = require("../Utils/Serializable");
const guard_1 = require("../Guards/guard");
const _ = require("lodash");
class Watcher {
    constructor(obj) {
        this.changedProps = [];
        const copy = Serializable_1.default.copy(obj);
        if (!(copy instanceof Error)) {
            this.proxy = this.createNestedProxyObject(copy, (changeData) => this.changedProps.push(changeData));
        }
    }
    createNestedProxyObject(obj, notifyChanged, path = '') {
        Object.keys(obj).forEach((key) => {
            if (typeof obj[key] === 'object' && key !== guard_1.META_KEY) {
                obj[key] = this.createNestedProxyObject(obj[key], notifyChanged, path + key + '.');
            }
        });
        return this.createProxyObject(obj, notifyChanged, path);
    }
    createProxyObject(obj, notifyChanged, path = '') {
        return new Proxy(obj, {
            set: (target, key, value, receiver) => {
                const nPath = path + key.toString();
                const oldValue = target[key];
                target[key] = value;
                const change = { target, key, oldValue, newValue: value, path: nPath };
                let metaGuard;
                if (target[guard_1.META_KEY]) {
                    metaGuard = _.find(target[guard_1.META_KEY].guards, (g) => g.key === key);
                }
                if (metaGuard) {
                    change.guard = metaGuard;
                }
                notifyChanged(change);
                return true;
            },
            get: (target, key) => {
                return target[key];
            }
        });
    }
    getChanges() {
        return this.changedProps;
    }
    clearChanges() {
        this.changedProps = [];
    }
    getProxy() {
        return this.proxy;
    }
}
exports.Watcher = Watcher;
