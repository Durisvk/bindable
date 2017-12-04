"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const WebSocket = require("ws");
const Bindable_1 = require("../src/Core/Bindable");
const Guards_1 = require("../src/Guards");
describe('Integration tests', () => {
    const mocha = this;
    const port = 9870;
    const defaultOptions = {
        websocket: {
            port,
        },
        runtime: {
            tickInterval: 1,
        },
    };
    let testNumber = 1;
    let globalBindable = null;
    let globalWs = null;
    beforeEach(() => console.time(testNumber.toString()));
    afterEach(() => {
        console.timeEnd(testNumber.toString());
        testNumber++;
        if (globalBindable) {
            globalBindable.destroy();
        }
        if (globalWs) {
            globalWs.close();
        }
    });
    function setupBindable(model, options = defaultOptions) {
        return new Bindable_1.Bindable(model, options);
    }
    function clientConnect(onMessage) {
        return new Promise((resolve, reject) => {
            let counter = 0;
            globalWs = new WebSocket('ws://localhost:' + port, {});
            globalWs.on('message', (data) => onMessage(JSON.parse(data), globalWs, ++counter));
            globalWs.on('open', resolve.bind(mocha, globalWs));
            globalWs.on('error', reject);
        });
    }
    it('should create simple bindable without errors', () => {
        globalBindable = setupBindable({
            someStuff: 'this is just a stuff',
            someObjStuff: {
                thisIsArray: [
                    { elemStuff: 0 },
                    { elemStuff: 1 },
                    { elemStuff: 2 },
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
        clientConnect((data, ws, nthCall) => {
            switch (nthCall) {
                case 1:
                    chai_1.expect(data).to.have.key('counter');
                    chai_1.expect(data.counter).to.equal(1);
                    model.obj.counter++;
                    break;
                case 2:
                    chai_1.expect(data).to.have.key('obj');
                    chai_1.expect(data.obj).to.have.key('counter');
                    chai_1.expect(data.obj.counter).to.equal(1);
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
        clientConnect((data, ws, nthCall) => {
            switch (nthCall) {
                case 1:
                    chai_1.expect(data).to.have.keys(['obj', 'counter']);
                    chai_1.expect(data.counter).to.equal(1);
                    chai_1.expect(data.obj).to.have.key('counter');
                    chai_1.expect(data.obj.counter).to.equal(1);
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
        Guards_1.applyGuards(model.private, 'counter', Guards_1.hidden);
        clientConnect((data, ws, nthCall) => {
            switch (nthCall) {
                case 1:
                    chai_1.expect(data).to.have.key('counter');
                    chai_1.expect(data.counter).to.equal(1);
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
        Guards_1.applyGuards(model, 'private', Guards_1.hidden);
        clientConnect((data, ws, nthCall) => {
            switch (nthCall) {
                case 1:
                    chai_1.expect(data).to.have.key('counter');
                    chai_1.expect(data.counter).to.equal(1);
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
});
