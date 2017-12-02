"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
exports.default = {
    walkOnPath: (obj, path, cb) => {
        const pathKeys = path.split('.');
        let current = obj;
        _.forEach(pathKeys, (key, i) => {
            if (i === pathKeys.length - 1) {
                cb(current, key);
            }
            else {
                current[key] = {};
                current = current[key];
            }
        });
    }
};
