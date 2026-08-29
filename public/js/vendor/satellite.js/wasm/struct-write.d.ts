import type { NativeFieldType } from './native-field-type.js';
export declare class CppMemoryWriter {
    private baseOffset;
    constructor(buffer: ArrayBufferLike, baseOffset?: number);
    private view;
    setBaseOffset(offset: number): void;
    writeInt(offset: number, value: number): void;
    writeString(offset: number, value: string, lengthWithNullTerminator: number): void;
    writeDouble(offset: number, value: number): void;
    writeChar(offset: number, value: string): void;
    writeBoolean(offset: number, value: boolean): void;
    writeValue(fieldName: string, offset: number, type: NativeFieldType, value: unknown, size: number): void;
}
