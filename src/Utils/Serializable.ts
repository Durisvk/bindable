import * as _ from 'lodash';


export default {
    isSerializable: (obj : any) => {
        return !(_.attempt(JSON.stringify, obj) instanceof Error);
    },
    copy: (obj : any) => {
        const str = _.attempt(JSON.stringify, obj);
        if(str instanceof Error) {
            return str;
        }
        return JSON.parse(str);
    }
}