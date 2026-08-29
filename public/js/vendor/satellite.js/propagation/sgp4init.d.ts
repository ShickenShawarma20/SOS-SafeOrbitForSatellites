import type { SatRec, SatRecInit } from './SatRec.js';
export interface Sgp4InitOptions {
    opsmode: 'a' | 'i';
    satn: string;
    epoch: number;
    xbstar: number;
    xecco: number;
    xargpo: number;
    xinclo: number;
    xmo: number;
    xno: number;
    xnodeo: number;
}
export declare function sgp4init(satrecInit: SatRecInit, options: Sgp4InitOptions): asserts satrecInit is SatRec;
