import * as _ from "lodash";

export function applyGuards(parent: any, key: string | symbol, ...guards: ((target: any, key: string | symbol) => void)[]) {
    _.forEach(guards, (guard) => {
        guard(parent, key);
    });
}