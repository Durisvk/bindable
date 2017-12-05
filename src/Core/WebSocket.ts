import * as WebSocket_ from "ws";
import * as _ from "lodash";

import ErrorUtils from "../Utils/Error";

const SERVER_EVENTS = {
    CONNECT: "connection",
};

const CLIENT_EVENTS = {
    CLOSE: "CLOSE",
    MESSAGE: "message",
};

export type ServerOptions = WebSocket_.ServerOptions;

export class WebSocket {

    private wss: WebSocket_.Server;
    private activeClients: { [ id: string ]: WebSocket_ } = {};

    private onMessage: (id: string | Symbol, data: {}) => any = _.noop;
    private onError: (error: Error) => any = _.noop;


    public constructor(options: WebSocket_.ServerOptions) {
        this.wss = new WebSocket_.Server(options);
        this.init();
    }

    public OnMessage(callback: (id: string | Symbol, data: {}) => any): void {
        this.onMessage = callback;
    }

    public OnError(callback: (error: Error) => any): void {
        this.onError = callback;
    }

    private init(): void {
        this.wss.on(SERVER_EVENTS.CONNECT, (ws: WebSocket_) => {
            let id: string;
            while (!id || _.has(this.activeClients, id)) {
                id = _.uniqueId("wsc_");
            }
            this.activeClients[id] = ws;

            ws.on(CLIENT_EVENTS.CLOSE, (code: number, reason: string) => {
                delete this.activeClients[id];
            });

            this.wsBindOnMessage(ws, id);
        });
    }

    private wsBindOnMessage(ws: WebSocket_, id: string) {
        ws.on(CLIENT_EVENTS.MESSAGE, (data: string | Buffer | ArrayBuffer) => {
            const possibleJson = _.attempt(JSON.parse, data.toString());
            possibleJson instanceof Error
                ? this.onError(ErrorUtils.prependMessage(possibleJson, "ws-bindable:Core/WebSockets Failed to parse received message: "))
                : this.onMessage(id, possibleJson);
        });
    }

    public broadcast(data: object, predicate?: (id: string, client: WebSocket_) => boolean): void {
        const _p: (id: string, client: WebSocket_) => boolean = predicate || (() => true);
        _.forEach(this.activeClients, (client: WebSocket_, id: string) =>
            client.readyState === WebSocket_.OPEN && _p(id, client)
                ? client.send(this.formatData(data))
                : _.noop());
    }

    public send(id: string, data: object) {
        this.activeClients[id].send(this.formatData(data), (err: Error) => {
            if (err) {
                this.onError(ErrorUtils.prependMessage(err, "ws-bindable:Core/WebSockets Failed to send a message: "));
            }
        });
    }

    public getActiveClients(): { [ id: string ]: WebSocket_ } {
        return { ...this.activeClients };
    }

    public destroy(): void {
        this.wss.close();
    }

    public formatData(data: any): any {
        if (_.isPlainObject(data)) {
            return JSON.stringify(data);
        }
        return data;
    }

}