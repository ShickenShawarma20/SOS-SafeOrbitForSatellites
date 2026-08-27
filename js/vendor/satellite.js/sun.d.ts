import type { AU, EciVec3 } from './common-types.js';
import type { JDay } from './ext.js';
export declare function sunPos(jday: JDay): {
    rsun: EciVec3<AU>;
    rtasc: number;
    decl: number;
};
