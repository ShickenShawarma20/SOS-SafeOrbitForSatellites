interface InitlOptions {
    opsmode: 'a' | 'i';
    ecco: number;
    epoch: number;
    inclo: number;
    no: number;
}
export declare function initl(options: InitlOptions): {
    no: number;
    method: string;
    ainv: number;
    ao: number;
    con41: number;
    con42: number;
    cosio: number;
    cosio2: number;
    eccsq: number;
    omeosq: number;
    posq: number;
    rp: number;
    rteosq: number;
    sinio: number;
    gsto: number;
};
export {};
