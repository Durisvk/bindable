"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const WebSocket = require("ws");
const Bindable_1 = require("../src/Core/Bindable");
const Guards_1 = require("../src/Guards");
describe('Integration tests', () => {
    const mocha = this;
    const port = 9871;
    const defaultOptions = {
        websocket: {
            port,
        },
    };
    function setupBindable(model, options = defaultOptions) {
        return new Bindable_1.Bindable(model, options);
    }
    function clientConnect(onMessage) {
        return new Promise((resolve, reject) => {
            let counter = 0;
            const ws = new WebSocket('ws://localhost:' + port, {});
            ws.on('message', (data) => onMessage(JSON.parse(data), ws, ++counter));
            ws.on('open', resolve.bind(mocha, ws));
            ws.on('error', reject);
        });
    }
    it('should create simple bindable without errors', () => {
        const b = setupBindable({
            someStuff: 'this is just a stuff',
            someObjStuff: {
                thisIsArray: [
                    { elemStuff: 0 },
                    { elemStuff: 1 },
                    { elemStuff: 2 },
                ]
            }
        });
        b.destroy();
    });
    it('should do some basic changes', (done) => {
        const b = setupBindable({
            obj: {
                counter: 0,
            },
            counter: 0,
        });
        const model = b.getProxy();
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
                    ws.close();
                    b.destroy();
                    done();
            }
        })
            .then(ws => model.counter++)
            .catch(done);
    });
    it('should change more than one data at once', (done) => {
        const b = setupBindable({
            obj: {
                counter: 0,
            },
            counter: 0,
        });
        const model = b.getProxy();
        clientConnect((data, ws, nthCall) => {
            switch (nthCall) {
                case 1:
                    chai_1.expect(data).to.have.keys(['obj', 'counter']);
                    chai_1.expect(data.counter).to.equal(1);
                    chai_1.expect(data.obj).to.have.key('counter');
                    chai_1.expect(data.obj.counter).to.equal(1);
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
        const b = setupBindable({
            private: {
                counter: 0,
            },
            counter: 0,
        });
        const model = b.getProxy();
        Guards_1.applyGuards(model.private, 'counter', Guards_1.hidden);
        clientConnect((data, ws, nthCall) => {
            switch (nthCall) {
                case 1:
                    chai_1.expect(data).to.have.key('counter');
                    chai_1.expect(data.counter).to.equal(1);
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
});
