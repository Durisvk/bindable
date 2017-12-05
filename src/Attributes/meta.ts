import { Guard } from "./Guards/guard";

export interface ValueInterpretation {
    value: any;
    target: any;
    key: PropertyKey;
    oldValue: any;
}

export interface AttributeMetaData {
    pureValue?: boolean;
}

export interface BindingInfo {
    direction: string;
}

type Attribute = () => any;

interface AttributesMeta {
    key: string;
    attributes: Attribute[];
}

export const META_KEY = "__$_meta_$___";

export const DIRECTION = {
    IN: "__in",
    OUT: "__out",
};


export const DEFAULT_META_DATA: AttributeMetaData = {
    pureValue: true,
};