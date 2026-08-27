export type JDay = number;
export declare function days2mdhms(year: number, days: number): {
    mon: number;
    day: number;
    hr: number;
    minute: number;
    sec: number;
};
export declare function jday(year: Date): JDay;
export declare function jday(year: number, mon: number, day: number, hr: number, minute: number, sec: number, msec?: number): JDay;
export declare function invjday(jd: JDay, asArray: true): [
    year: number,
    mon: number,
    day: number,
    hr: number,
    minute: number,
    sec: number
];
export declare function invjday(jd: JDay, asArray?: false): Date;
