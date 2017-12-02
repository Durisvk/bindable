"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket_ = require("ws");
const _ = require("lodash");
const Error_1 = require("../Utils/Error");
const ServerEvents = {
    CONNECT: 'connect',
};
const ClientEvents = {
    CLOSE: 'CLOSE',
    MESSAGE: 'message',
};
class WebSocket {
    //private onConnect : (id : string | Symbol, )
    constructor(options) {
        this.activeClients = {};
        this.onMessage = () => { };
        this.onError = () => { };
        this.wss = new WebSocket_.Server(options);
        this.init();
    }
    OnMessage(callback) {
        this.onMessage = callback;
    }
    OnError(callback) {
        this.onError = callback;
    }
    init() {
        this.wss.on(ServerEvents.CONNECT, (ws) => {
            let id;
            while (id && _.has(this.activeClients, id)) {
                id = _.uniqueId('wsc_');
            }
            this.activeClients[id] = ws;
            ws.on(ClientEvents.CLOSE, (code, reason) => {
                delete this.activeClients[id];
            });
            ws.on(ClientEvents.MESSAGE, (data) => {
                const possibleJson = _.attempt(JSON.parse, data.toString());
                possibleJson instanceof Error
                    ? this.onError(Error_1.default.prependMessage(possibleJson, 'ws-bindable:Core/WebSockets Failed to parse received message: '))
                    : this.onMessage(id, possibleJson);
            });
        });
    }
    broadcast(data, predicate) {
        const _p = predicate || (() => true);
        _.forEach(this.activeClients, (client, id) => client.readyState === WebSocket_.OPEN && _p(id, client)
            ? client.send(data)
            : _.noop());
    }
    send(id, data) {
        this.activeClients[id].send(data, (err) => {
            this.onError(Error_1.default.prependMessage(err, 'ws-bindable:Core/WebSockets Failed to send a message: '));
        });
    }
    getActiveClientsIds() {
        return Object.assign({}, this.activeClients);
    }
    destroy() {
        this.wss.close();
    }
}
exports.WebSocket = WebSocket;
