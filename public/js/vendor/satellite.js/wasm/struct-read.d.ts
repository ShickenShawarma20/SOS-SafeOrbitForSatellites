export declare class CppMemoryReader {
    baseOffset: number;
    constructor(buffer: ArrayBufferLike, baseOffset?: number);
    private view;
    readInt(offset: number): number;
    readLong(offset: number): number;
    readString(offset: number, length: number): string;
    readDouble(offset: number): number;
    readUnsignedChar(offset: number): number;
    readChar(offset: number): string;
}
