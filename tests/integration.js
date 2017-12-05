"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const WebSocket = require("ws");
const Bindable_1 = require("../src/Core/Bindable");
const Guards_1 = require("../src/Attributes/Guards");
describe("Integration tests", () => {
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
    let globalBindable = undefined;
    let globalWs = undefined;
    beforeEach(() => console.time(testNumber.toString()));
    afterEach(() => {
        console.timeEnd(testNumber.toString());
        testNumber += 1;
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
            globalWs = new WebSocket("ws://localhost:" + port, {});
            globalWs.on("message", (data) => onMessage(JSON.parse(data), globalWs, (() => {
                counter += 1;
                return counter;
            })()));
            globalWs.on("open", resolve.bind(undefined, globalWs));
            globalWs.on("error", reject);
        });
    }
    function generalTest(obj, afterConnect, done, ...expectations) {
        globalBindable = setupBindable(obj);
        const model = globalBindable.getProxy();
        clientConnect((data, ws, nthCall) => {
            expectations[nthCall - 1](model, data, ws, nthCall);
            if (nthCall === expectations.length) {
                done();
            }
        })
            .then((ws) => {
            afterConnect(model, ws);
        })
            .catch(done);
    }
    it("should create simple bindable without errors", () => {
        globalBindable = setupBindable({
            someStuff: "this is just a stuff",
            someObjStuff: {
                thisIsArray: [
                    { elemStuff: 0 },
                    { elemStuff: 1 },
                    { elemStuff: 2 },
                ]
            }
        });
    });
    it("should do some basic changes", (done) => {
        generalTest({
            obj: {
                counter: 0,
            },
            counter: 0,
        }, model => model.counter += 1, done, (model, data) => {
            chai_1.expect(data).to.have.key("counter");
            chai_1.expect(data.counter).to.equal(1);
            model.obj.counter += 1;
        }, (model, data) => {
            chai_1.expect(data).to.have.key("obj");
            chai_1.expect(data.obj).to.have.key("counter");
            chai_1.expect(data.obj.counter).to.equal(1);
        });
    });
    it("should change more than one data at once", (done) => {
        generalTest({
            obj: {
                counter: 0,
            },
            counter: 0,
        }, model => {
            model.counter += 1;
            model.obj.counter += 1;
        }, done, (model, data) => {
            chai_1.expect(data).to.have.keys(["obj", "counter"]);
            chai_1.expect(data.counter).to.equal(1);
            chai_1.expect(data.obj).to.have.key("counter");
            chai_1.expect(data.obj.counter).to.equal(1);
        });
    });
    it("should protect the data with simple hidden guard", (done) => {
        generalTest({
            private: {
                counter: 0,
            },
            counter: 0,
        }, model => {
            Guards_1.applyGuards(model.private, "counter", Guards_1.hidden);
            model.counter += 1;
            model.private.counter += 1;
        }, done, (model, data) => {
            chai_1.expect(data).to.have.key("counter");
            chai_1.expect(data.counter).to.equal(1);
            chai_1.expect(data).not.to.have.key("private");
        });
    });
    it("should protect the data with hidden guard on upper key of deep nested object", (done) => {
        generalTest({
            private: {
                some: {
                    deep: {
                        nested: {
                            obj: {
                                counter: 0,
                            },
                        },
                    },
                },
            },
            counter: 0,
        }, model => {
            Guards_1.applyGuards(model, "private", Guards_1.hidden);
            model.counter += 1;
            model.private.some.deep.nested.obj.counter += 1;
        }, done, (model, data) => {
            chai_1.expect(data).to.have.key("counter");
            chai_1.expect(data.counter).to.equal(1);
        });
    });
});
