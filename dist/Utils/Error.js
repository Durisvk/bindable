"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    prependMessage(err, messageToPrepend) {
        err.message = messageToPrepend + err.message;
        return err;
    }
};
