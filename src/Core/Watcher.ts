import SerializableUtils from '../Utils/Serializable';
import { META_KEY, GuardMeta, Guard } from "../Guards/guard";

import * as _ from 'lodash';

export type ChangedData = { target : any, key : PropertyKey, oldValue : any, newValue : any, path : string, guard? : Guard };
type NotifyChanged = (data : ChangedData) => any

export class Watcher {

    private changedProps : ChangedData[] = [];

    private proxy : any;

    public constructor(obj : any) {
        const copy = SerializableUtils.copy(obj);
        if(!(copy instanceof Error)) {
            this.proxy = this.createNestedProxyObject(copy, (changeData : ChangedData) => this.changedProps.push(changeData));
        }
    }

    private createNestedProxyObject(obj : any, notifyChanged : NotifyChanged, path : string = '') : any {
        Object.keys(obj).forEach((key) => {
            if(typeof obj[key] === 'object' && key !== META_KEY) {
                obj[key] = this.createNestedProxyObject(obj[key], notifyChanged, path + key + '.');
            }
        });
        return this.createProxyObject(obj, notifyChanged, path);
    }

    private createProxyObject(obj : any, notifyChanged : NotifyChanged, path : string = '') {
        return new Proxy(obj, {
            set: (target, key, value, receiver) => {
                const nPath = path + key.toString();
                const oldValue = target[key];
                target[key] = value;

                if(key !== META_KEY) {
                    const change : ChangedData = { target, key, oldValue, newValue: value, path: nPath };
                    
                    let metaGuard : GuardMeta;
                    if(target[META_KEY]) {
                        metaGuard = _.find(target[META_KEY].guards, (g : GuardMeta) => g.key === key);
                    }
                    
                    if(metaGuard) {
                        change.guard = metaGuard.guard;
                    }
                    notifyChanged(change);
                }
                return true;
            },
            get: (target, key) => {
                return target[key];
            }
        });
    }

    public getChanges() : ChangedData[] {
        return this.changedProps;
    }

    public clearChanges() : void {
        this.changedProps = [];
    }

    public getProxy() : any {
        return this.proxy;
    }
}