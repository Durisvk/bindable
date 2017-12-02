import { expect } from 'chai';

import * as WebSocket from 'ws';


import { Bindable, BindableOptions } from '../src/Core/Bindable';
import { guard, hidden, applyGuards } from '../src/Guards'

describe('Integration tests', () => {
    const mocha = this;
    const port = 9871;

    const defaultOptions : BindableOptions = {
        websocket: {
            port,
        },
    }

    function setupBindable(model : any, options : BindableOptions = defaultOptions) : Bindable<any> {
        return new Bindable<any>(model, options);
    }

    function clientConnect(onMessage : (data : any, ws : WebSocket, nthCall : number) => void) {
        return new Promise((resolve, reject) => {
            let counter = 0;
            const ws = new WebSocket('ws://localhost:' + port, {});
            ws.on('message', (data : any) =>
                onMessage(JSON.parse(data), ws, ++counter));
            ws.on('open', resolve.bind(mocha, ws));
            ws.on('error', reject);
        })
    }

    it('should create simple bindable without errors', () => {
        const b : Bindable<any> = setupBindable({
            someStuff: 'this is just a stuff',
            someObjStuff: {
                thisIsArray: [
                    {elemStuff: 0},
                    {elemStuff: 1},
                    {elemStuff: 2},
                ]
            }
        });
        b.destroy();
    });

    it('should do some basic changes', (done) => {
        const b : Bindable<any> = setupBindable({
            obj: {
                counter: 0,
            },
            counter: 0,
        });
        const model = b.getProxy();
        clientConnect((data : any, ws : WebSocket, nthCall : number) => {
            switch(nthCall) {
                case 1:
                    expect(data).to.have.key('counter');
                    expect(data.counter).to.equal(1);
                    model.obj.counter++;
                    break;
                case 2:
                    expect(data).to.have.key('obj');
                    expect(data.obj).to.have.key('counter');
                    expect(data.obj.counter).to.equal(1);
                default:
                    ws.close();
                    b.destroy();
                    done();
            }
        })
        .then(ws => model.counter++)
        .catch(done);
    });

    it('should change more than one data at once', (done) => {
        const b : Bindable<any> = setupBindable({
            obj: {
                counter: 0,
            },
            counter: 0,
        });
        const model = b.getProxy();
        clientConnect((data : any, ws : WebSocket, nthCall : number) => {
            switch(nthCall) {
                case 1:
                    expect(data).to.have.keys(['obj', 'counter']);
                    expect(data.counter).to.equal(1);
                    expect(data.obj).to.have.key('counter');
                    expect(data.obj.counter).to.equal(1);
                default:
                    ws.close();
                    b.destroy();
                    done();
            }
        })
        .then(ws => {
            model.counter++;
            model.obj.counter++;
        })
        .catch(done);
    });

    it('should protect the data with simple hidden guard', (done) => {

        const b : Bindable<any> = setupBindable({
            private: {
                counter: 0,
            },
            counter: 0,
        });

        const model = b.getProxy();
        applyGuards(model.private, 'counter', hidden);
        clientConnect((data : any, ws : WebSocket, nthCall : number) => {
            switch(nthCall) {
                case 1:
                    expect(data).to.have.key('counter');
                    expect(data.counter).to.equal(1);
                default:
                    ws.close();
                    b.destroy();
                    done();
            }
        })
        .then(ws => {
            model.counter++;
            model.obj.counter++;
        })
        .catch(done);
    });

})