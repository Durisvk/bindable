import { expect } from 'chai';

import * as WebSocket from 'ws';


import { Bindable, BindableOptions } from '../src/Core/Bindable';
import { guard, hidden, applyGuards } from '../src/Guards'

describe('Integration tests', () => {
    const mocha = this;
    const port = 9870;

    const defaultOptions : BindableOptions = {
        websocket: {
            port,
        },
        runtime: {
            tickInterval: 1,
        },
    }

    let testNumber : number = 1;
    let globalBindable : Bindable<any> = null;
    let globalWs : WebSocket = null;

    beforeEach(() => console.time(testNumber.toString()));

    afterEach(() => {
        console.timeEnd(testNumber.toString());
        testNumber++;
        if(globalBindable) {
            globalBindable.destroy();
        }
        if(globalWs) {
            globalWs.close();
        }
    })

    function setupBindable(model : any, options : BindableOptions = defaultOptions) : Bindable<any> {
        return new Bindable<any>(model, options);
    }

    function clientConnect(onMessage : (data : any, ws : WebSocket, nthCall : number) => void) {
        return new Promise((resolve, reject) => {
            let counter = 0;
            globalWs = new WebSocket('ws://localhost:' + port, {});
            globalWs.on('message', (data : any) =>
                onMessage(JSON.parse(data), globalWs, ++counter));
            globalWs.on('open', resolve.bind(mocha, globalWs));
            globalWs.on('error', reject);
        })
    }

    it('should create simple bindable without errors', () => {
        globalBindable = setupBindable({
            someStuff: 'this is just a stuff',
            someObjStuff: {
                thisIsArray: [
                    {elemStuff: 0},
                    {elemStuff: 1},
                    {elemStuff: 2},
                ]
            }
        });
    });

    it('should do some basic changes', (done) => {
        globalBindable = setupBindable({
            obj: {
                counter: 0,
            },
            counter: 0,
        });
        const model = globalBindable.getProxy();
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
                    done();
            }
        })
        .then(ws => model.counter++)
        .catch(done);
    });

    it('should change more than one data at once', (done) => {
        globalBindable = setupBindable({
            obj: {
                counter: 0,
            },
            counter: 0,
        });
        const model = globalBindable.getProxy();
        clientConnect((data : any, ws : WebSocket, nthCall : number) => {
            switch(nthCall) {
                case 1:
                    expect(data).to.have.keys(['obj', 'counter']);
                    expect(data.counter).to.equal(1);
                    expect(data.obj).to.have.key('counter');
                    expect(data.obj.counter).to.equal(1);
                default:
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

        globalBindable = setupBindable({
            private: {
                counter: 0,
            },
            counter: 0,
        });

        const model = globalBindable.getProxy();
        applyGuards(model.private, 'counter', hidden);
        clientConnect((data : any, ws : WebSocket, nthCall : number) => {
            switch(nthCall) {
                case 1:
                    expect(data).to.have.key('counter');
                    expect(data.counter).to.equal(1);
                default:
                    done();
            }
        })
        .then(ws => {
            model.counter++;
            model.private.counter++;
        })
        .catch(done);
    });


    it('should protect the data with hidden guard on upper key of deep nested object', (done) => {
        globalBindable = setupBindable({
            private: {
                some: {
                    deep: {
                        nested: {
                            obj: {
                                counter: 0,
                            }
                        }
                    }
                }
            },
            counter: 0,
        });

        const model = globalBindable.getProxy();
        applyGuards(model, 'private', hidden);
        clientConnect((data : any, ws : WebSocket, nthCall : number) => {
            switch(nthCall) {
                case 1:
                    expect(data).to.have.key('counter');
                    expect(data.counter).to.equal(1);
                default:
                    done();
            }
        })
        .then(ws => {
            model.counter++;
            model.private.some.deep.nested.obj.counter++;
        })
        .catch(done);
    });

})