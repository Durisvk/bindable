"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.META_KEY = '__$_meta_$___';
exports.DIRECTION = {
    IN: '__in',
    OUT: '__in',
};
exports.default = (guard) => {
    return (target, key) => {
        let meta = target[exports.META_KEY];
        if (!meta) {
            target[exports.META_KEY] = { guards: [] };
            meta = target[exports.META_KEY];
        }
        if (!meta.guards) {
            meta.guards = [];
        }
        const g = {
            key,
            guard,
        };
        meta.guards.push(g);
    };
};
