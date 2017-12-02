import * as _ from 'lodash';

import { ChangedData } from './Watcher'
import { WebSocket } from './WebSocket';
import * as WebSocket_ from 'ws';
import { DIRECTION } from '../Guards/guard';
import Obj from '../Utils/Obj';

export class Actor {

    private websocket : WebSocket;

    public constructor(websocket : WebSocket) {
        this.websocket = websocket;
    }


    public flush(changes : ChangedData[], model : any) : void {
        const copiedChanges = _.cloneDeep(changes);
        _.forEach(this.websocket.getActiveClients(), _.partial(this.applyChanges, model, copiedChanges).bind(this));
    }

    private applyChanges(model : any, changes : ChangedData[], ws : WebSocket_, id : string) : any {
        const obj = {};
        _.forEach(changes, _.partial(this.applyChange, model, id, ws, obj));
        this.websocket.send(id, obj);
    }

    private applyChange(model : any, id : string, ws : WebSocket_, obj : any, change : ChangedData) {
        if(change.guard) {
            const g : boolean | Promise<boolean> = change.guard(model, id, ws, { direction: DIRECTION.OUT });
            if(g instanceof Promise) {
                // TODO: add asynchronous functionality for guards
            } else if(!g) {
                return;
            }
        }

        Obj.walkAndCreateAPath(obj, change.path, (parent : any, key : string | symbol) => {
            parent[key] = change.newValue;
        });
    }

}