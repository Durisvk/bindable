import * as _ from "lodash";
import * as WebSocket from "ws";
import { ValueInterpretation, AttributeMetaData, META_KEY, DEFAULT_META_DATA, BindingInfo } from "../meta";

export interface ModifierMetaData extends AttributeMetaData {}

export type Modifier = (value?: ValueInterpretation|any, model?: any, clientId?: string, ws?: WebSocket, metaData?: BindingInfo) => any;

export interface ModifierMeta {
    key: PropertyKey;
    modifier: Modifier;
    metaData: ModifierMetaData;
}

export function modifier(modifierator: Modifier, metaData: ModifierMetaData = {
    ...DEFAULT_META_DATA,
}): PropertyDecorator {
    return (target: any, key: PropertyKey) => {
        applyModifiers(modifierator, target, key, metaData);
    };
}

function applyModifiers(modifierator: Modifier, target: any, key: PropertyKey, metaData) {
    if (_.isPlainObject(target[key])) {
        _.forEach(target[key], (__, k) => {
            applyModifiers(modifierator, target[key], k, metaData);
        });
    }

    applyModifier(modifierator, target, key, metaData);
}

function applyModifier(modifierator: Modifier, target: any, key: PropertyKey, metaData) {
    let meta = target[META_KEY];
    if (!meta) {
        target[META_KEY] = { modifiers: [] };
        meta = target[META_KEY];
    }
    if (!meta.modifiers) {
        meta.modifiers = [];
    }

    constructModifierMeta(modifierator, key, metaData, meta);
}

function constructModifierMeta(modifierator: Modifier, key: PropertyKey, metaData, meta) {
    const g: ModifierMeta = {
        key,
        modifier: modifierator,
        metaData,
    };
    meta.modifiers.push(g);
}