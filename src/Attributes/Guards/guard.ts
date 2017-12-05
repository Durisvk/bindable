import * as _ from "lodash";
import * as WebSocket from "ws";
import { ValueInterpretation, AttributeMetaData, META_KEY, DEFAULT_META_DATA, BindingInfo, DIRECTION } from "../meta";
import { ChangedData } from "../../Core/Watcher";

export interface GuardMetaData extends AttributeMetaData {}
export type Guard = (value?: ValueInterpretation|any, model?: any, clientId?: string, ws?: WebSocket, metaData?: BindingInfo) => boolean | Promise<boolean>;

export interface GuardMeta {
    key: PropertyKey;
    guard: Guard;
    metaData: GuardMetaData;
}

export function guard(guardian: Guard, metaData: GuardMetaData = {
    ...DEFAULT_META_DATA,
}): PropertyDecorator {
    return (target: any, key: PropertyKey) => {
        applyGuards(guardian, target, key, metaData);
    };
}

function applyGuards(guardian: Guard, target: any, key: PropertyKey, metaData) {
    if (_.isPlainObject(target[key])) {
        _.forEach(target[key], (__, k) => {
            applyGuards(guardian, target[key], k, metaData);
        });
    }

    applyGuard(guardian, target, key, metaData);
}


function applyGuard(guardian: Guard, target: any, key: PropertyKey, metaData) {
    let meta = target[META_KEY];
    if (!meta) {
        target[META_KEY] = { guards: [] };
        meta = target[META_KEY];
    }
    if (!meta.guards) {
        meta.guards = [];
    }

    constructGuardMeta(guardian, key, metaData, meta);
}

function constructGuardMeta(guardian: Guard, key: PropertyKey, metaData, meta) {
    const g: GuardMeta = {
        key,
        guard: guardian,
        metaData,
    };
    meta.guards.push(g);
}

export function protectWithGuards(model: any, id: string, ws: WebSocket, obj: any, change: ChangedData): boolean {
    if (change.guards && change.guards.length > 0) {
        return _.some(change.guards, guardData => {
            const g = this.getGuardResult(model, id, ws, obj, change, guardData);
            if (g instanceof Promise) {
                // TODO: add asynchronous functionality for guards
            } else if (!g) {
                return true;
            }
        });
    }
    return false;
}

export function getGuardResult(model: any, id: string, ws: WebSocket, obj: any, change: ChangedData, guardData): boolean | Promise<boolean> {
    if (guardData.metaData.pureValue) {
        return guardData.guard(change.newValue, model, id, ws, { direction: DIRECTION.OUT });
    } else {
        const valInterp: ValueInterpretation = {
            value: change.newValue,
            target: change.target,
            key: change.key,
            oldValue: change.oldValue,
        };
        return guardData.guard(valInterp, model, id, ws, { direction: DIRECTION.OUT });
    }
}