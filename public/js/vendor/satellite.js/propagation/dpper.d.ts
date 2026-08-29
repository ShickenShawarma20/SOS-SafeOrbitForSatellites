import type { SatRec } from './SatRec.js';
interface DpperOptions {
    init: 'y' | 'n';
    opsmode: 'a' | 'i';
    ep: number;
    inclp: number;
    nodep: number;
    argpp: number;
    mp: number;
}
export declare function dpper(satrec: SatRec, options: DpperOptions): {
    ep: number;
    inclp: number;
    nodep: number;
    argpp: number;
    mp: number;
};
export {};
