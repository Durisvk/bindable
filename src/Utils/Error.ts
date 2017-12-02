
export default {
    prependMessage(err : Error, messageToPrepend : string) : Error {
        err.message = messageToPrepend + err.message;
        return err;
    }
}