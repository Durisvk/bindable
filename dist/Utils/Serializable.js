"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
exports.default = {
    isSerializable: (obj) => {
        return !(_.attempt(JSON.stringify, obj) instanceof Error);
    },
    copy: (obj) => {
        const str = _.attempt(JSON.stringify, obj);
        if (str instanceof Error) {
            return str;
        }
        return JSON.parse(str);
    }
};
