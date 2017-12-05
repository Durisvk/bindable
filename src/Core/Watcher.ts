import SerializableUtils from "../Utils/Serializable";

import * as _ from "lodash";
import { META_KEY } from "../Attributes/meta";
import { Guard, GuardMeta, GuardMetaData } from "../Attributes/Guards/guard";

export interface ChangedData {
    target: any;
    key: PropertyKey;
    oldValue: any;
    newValue: any;
    path: string;
    guards?: { guard: Guard, metaData: GuardMetaData }[];
}
type NotifyChanged = (data: ChangedData) => any;

export class Watcher {

    private changedProps: ChangedData[] = [];

    private proxy: any;

    public constructor(obj: any) {
        const copy = SerializableUtils.copy(obj);
        if (!(copy instanceof Error)) {
            this.proxy = this.createNestedProxyObject(copy, (changeData: ChangedData) => this.changedProps.push(changeData));
        }
    }

    private createNestedProxyObject(obj: any, notifyChanged: NotifyChanged, path = "", parent = undefined): any {
        Object.keys(obj).forEach((key) => {
            if ((_.isPlainObject(obj[key]) || _.isArray(obj[key])) && key !== META_KEY) {
                obj[key] = this.createNestedProxyObject(obj[key], notifyChanged, path + key + ".", obj);
            }
        });
        return this.createProxyObject(obj, notifyChanged, path, parent);
    }

    private createProxyObject(obj: any, notifyChanged: NotifyChanged, path = "", parent = undefined) {
        return new Proxy(obj, {
            set: this.proxySetMethod(notifyChanged, path, parent),
            get: (target, key) => {
                return target[key];
            }
        });
    }

    private applyMetaGuardToChange(change: ChangedData, target: any, key: PropertyKey, parent: any = undefined) {
        let metaGuards: GuardMeta[] = undefined;
        if (target[META_KEY]) {
            metaGuards = _.filter(target[META_KEY].guards, (g: GuardMeta) => g.key === key);
        } else if (parent && parent[META_KEY]) {
            metaGuards = _.filter(parent[META_KEY].guards, (g: GuardMeta) => g.key === key);
        }

        if (metaGuards) {
            change.guards = _.map(metaGuards, (g: GuardMeta) => ({ guard: g.guard, metaData: g.metaData }));
        }
    }

    public getChanges(): ChangedData[] {
        return this.changedProps;
    }

    public clearChanges(): void {
        this.changedProps = [];
    }

    public getProxy(): any {
        return this.proxy;
    }

    private proxySetMethod(notifyChanged: NotifyChanged, path = "", parent = undefined) {
        return (target, key, value, receiver) => {
            const nPath = path + key.toString();
            const oldValue = target[key];
            target[key] = value;

            if (key !== META_KEY) {
                const change: ChangedData = { target, key, oldValue, newValue: value, path: nPath };
                this.applyMetaGuardToChange(change, target, key, parent);

                notifyChanged(change);
            }
            return true;
        };
    }
}