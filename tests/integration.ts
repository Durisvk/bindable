import { expect } from "chai";

import * as WebSocket from "ws";


import { Bindable, BindableOptions } from "../src/Core/Bindable";
import { guard, hidden, applyGuards } from "../src/Guards";

describe("Integration tests", () => {
    const port = 9870;

    const defaultOptions: BindableOptions = {
        websocket: {
            port,
        },
        runtime: {
            tickInterval: 1,
        },
    };

    let testNumber = 1;
    let globalBindable: Bindable<any> = undefined;
    let globalWs: WebSocket = undefined;

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

    function setupBindable(model: any, options: BindableOptions = defaultOptions): Bindable<any> {
        return new Bindable<any>(model, options);
    }

    function clientConnect(onMessage: (data: any, ws: WebSocket, nthCall: number) => void) {
        return new Promise((resolve, reject) => {
            let counter = 0;
            globalWs = new WebSocket("ws://localhost:" + port, {});
            globalWs.on("message", (data: any) =>
                onMessage(JSON.parse(data), globalWs, (() => {
                    counter += 1;
                    return counter;
                })()));
            globalWs.on("open", resolve.bind(undefined, globalWs));
            globalWs.on("error", reject);
        });
    }


    function generalTest(obj: any, afterConnect: (model?: any, ws?: WebSocket) => any, done?: (err?: Error) => any, ...expectations: ((model?: any, data?: any, ws?: WebSocket, nthCall?: number) => any)[]) {
        globalBindable = setupBindable(obj);
        const model: any = globalBindable.getProxy();

        clientConnect((data: any, ws: WebSocket, nthCall: number) => {
            expectations[nthCall - 1](model, data, ws, nthCall);
            if (nthCall === expectations.length) {
                done();
            }
        })
        .then((ws: WebSocket) => {
            afterConnect(model, ws);
        })
        .catch(done);
    }

    it("should create simple bindable without errors", () => {
        globalBindable = setupBindable({
            someStuff: "this is just a stuff",
            someObjStuff: {
                thisIsArray: [
                    {elemStuff: 0},
                    {elemStuff: 1},
                    {elemStuff: 2},
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
        }, model =>
            model.counter += 1,
        done,
        (model, data) => {
            expect(data).to.have.key("counter");
            expect(data.counter).to.equal(1);
            model.obj.counter += 1;
        },
        (model, data) => {
            expect(data).to.have.key("obj");
            expect(data.obj).to.have.key("counter");
            expect(data.obj.counter).to.equal(1);
        });
    });

    it("should change more than one data at once", (done) => {
        generalTest({
            obj: {
                counter: 0,
            },
            counter: 0,
        },
        model => {
            model.counter += 1;
            model.obj.counter += 1;
        },
        done,
        (model, data) => {
            expect(data).to.have.keys(["obj", "counter"]);
            expect(data.counter).to.equal(1);
            expect(data.obj).to.have.key("counter");
            expect(data.obj.counter).to.equal(1);
        });
    });

    it("should protect the data with simple hidden guard", (done) => {

        generalTest({
            private: {
                counter: 0,
            },
            counter: 0,
        },
        model => {
            applyGuards(model.private, "counter", hidden);
            model.counter += 1;
            model.private.counter += 1;
        },
        done,
        (model, data) => {
            expect(data).to.have.key("counter");
            expect(data.counter).to.equal(1);
            expect(data).not.to.have.key("private");
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
        },
        model => {
            applyGuards(model, "private", hidden);
            model.counter += 1;
            model.private.some.deep.nested.obj.counter += 1;
        },
        done,
        (model, data) => {
            expect(data).to.have.key("counter");
            expect(data.counter).to.equal(1);
        });
    });

});