import * as _ from "lodash";

export default {
    walkAndCreateAPath: (obj: any, path: string, cb: (parent: any, key: string | symbol) => any) => {
        const pathKeys = path.split(".");
        let current: any = obj;
        _.forEach(pathKeys, (key: string | symbol, i: number) => {
            if (i === pathKeys.length - 1) {
                cb(current, key);
            } else {
                current[key] = {};
                current = current[key];
            }
        });
    }
};