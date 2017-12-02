import * as WebSocket from 'ws';
export const META_KEY : string = '__$_meta_$___';

export const DIRECTION = {
    IN: '__in',
    OUT: '__in',
}

export type GuardMetaData = { direction : string };
export type Guard = (model? : any, clientId? : string, ws? : WebSocket, metaData? : GuardMetaData) => boolean | Promise<boolean>

export type GuardMeta = {
    key : string | symbol,
    guard : Guard,
}

export function guard(guardian : Guard) : PropertyDecorator {
    return (target : any, key : string | symbol) => {
        let meta = target[META_KEY];
        if(!meta) {
            target[META_KEY] = { guards: [] };
            meta = target[META_KEY];
        }
        if(!meta.guards) {
            meta.guards = [];
        }

        const g : GuardMeta = {
            key,
            guard: guardian,
        }
        meta.guards.push(g);
    };
}