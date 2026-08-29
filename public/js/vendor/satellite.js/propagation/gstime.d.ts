import type { GMSTime } from '../common-types.js';
export declare function gstime(jd: number): GMSTime;
export declare function gstime(date: Date): GMSTime;
export declare function gstime(year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond?: number): GMSTime;
