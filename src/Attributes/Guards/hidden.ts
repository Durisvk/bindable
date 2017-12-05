import { guard } from "./guard";

export const hidden: PropertyDecorator = guard(() => false);