import { describe, test, expect, beforeEach } from 'vitest';
import FILE from '../FILE.js';

describe('FILE class', () => {
  let file;
  let testBuffer;

  beforeEach(() => {
    // Create a test buffer with various data types (using little-endian)
    const buffer = new ArrayBuffer(75);
    const view = new DataView(buffer);

    // Write test data in little-endian format
    view.setInt32(0, 123456789, true); // 0-3
    view.setInt32(4, -987654321, true); // 4-7
    view.setUint16(8, 65535, true); // 8-9
    view.setInt16(10, 65500, true); // 10-11
    view.setFloat32(12, 3.14159, true); // 12-15
    view.setFloat32(16, 1.61803, true); // 16-19
    view.setFloat64(20, 2.718281828459045, true); // 20-27
    view.setFloat64(28, 1.414213562373095, true); // 28-35
    view.setInt8(36, -128); // 36 (endianness doesn't matter for single byte)
    view.setUint8(37, 255); // 37 (endianness doesn't matter for single byte)

    // Write a string
    const encoder = new TextEncoder();
    const stringData = encoder.encode("Hello World!");
    new Uint8Array(buffer).set(stringData, 38); // 38-49

    testBuffer = buffer;
    file = new FILE('test.bin', 'ieee-le');
    file.fopen(testBuffer);
  });

  describe('constructor', () => {
    test('should initialize with default parameters', () => {
      const defaultFile = new FILE();
      expect(defaultFile.filename).toBe('');
      expect(defaultFile.littleEndian).toBe(true);
      expect(defaultFile.offset).toBe(0);
      expect(defaultFile.content).toBeUndefined();
    });

    test('should initialize with specified parameters', () => {
      const bigEndianFile = new FILE('data.bin', 'ieee-be');
      expect(bigEndianFile.filename).toBe('data.bin');
      expect(bigEndianFile.littleEndian).toBe(false);
    });
  });

  describe('fopen', () => {
    test('should set content and reset offset', () => {
      expect(file.content).toBeInstanceOf(DataView);
      expect(file.offset).toBe(0);
      expect(file.content.byteLength).toBe(testBuffer.byteLength);
    });
  });

  describe('fclose', () => {
    test('should clear content and reset offset', () => {
      file.fclose();
      expect(file.content).toBeNull();
      expect(file.offset).toBe(0);
    });
  });

  describe('fread', () => {
    test('should read single int32', () => {
      const value = file.fread(1, 'int32');
      expect(value).toBe(123456789);
      expect(file.offset).toBe(4);
    });

    test('should read multiple int32', () => {
      const values = file.fread(2, 'int32');
      expect(values).toEqual([123456789, -987654321]);
      expect(file.offset).toBe(8);
    });

    test('should read single int16', () => {
      file.fseek(8, 'bof');
      const value = file.fread(1, 'int16');
      expect(value).toBe(-1);
      expect(file.offset).toBe(10);
    });

    test('should read multiple int16', () => {
      file.fseek(8, 'bof');
      const values = file.fread(2, 'int16');
      expect(values).toEqual([-1, -36]);
      expect(file.offset).toBe(12);
    });

    test('should read single char', () => {
      file.fseek(36, 'bof');
      const value = file.fread(1, 'char');
      expect(value).toBe(-128);
      expect(file.offset).toBe(37);
    });

    test('should read single int8', () => {
      file.fseek(36, 'bof');
      const value = file.fread(1, 'int8');
      expect(value).toBe(-128);
      expect(file.offset).toBe(37);
    });

    test('should read multiple int8', () => {
      file.fseek(36, 'bof');
      const value = file.fread(2, 'int8');
      expect(value).toEqual([-128, -1]);
      expect(file.offset).toBe(38);
    });

    test('should read single uint32', () => {
      const value = file.fread(1, 'uint32');
      expect(value).toBe(123456789);
      expect(file.offset).toBe(4);
    });

    test('should read multiple uint32', () => {
      const values = file.fread(2, 'uint32');
      expect(values).toEqual([123456789, 3307312975]);
      expect(file.offset).toBe(8);
    });

    test('should read single uint16', () => {
      file.fseek(8, 'bof');
      const value = file.fread(1, 'uint16');
      expect(value).toBe(65535);
      expect(file.offset).toBe(10);
    });

    test('should read multiple uint16', () => {
      file.fseek(8, 'bof');
      const values = file.fread(2, 'uint16');
      expect(values).toEqual([65535, 65500]);
      expect(file.offset).toBe(12);
    });

    test('should read single uint8 by default', () => {
      file.fseek(37, 'bof');
      const value = file.fread(1);
      expect(value).toBe(255);
      expect(file.offset).toBe(38);
    });

    test('should read single uchar (alias for uint8)', () => {
      file.fseek(37, 'bof');
      const value = file.fread(1, 'uchar');
      expect(value).toBe(255);
      expect(file.offset).toBe(38);
    });

    test('should read single float32', () => {
      file.fseek(12, 'bof');
      const value = file.fread(1, 'float32');
      expect(value).toBeCloseTo(3.14159, 5);
      expect(file.offset).toBe(16);
    });

    test('should read multiple float32', () => {
      file.fseek(12, 'bof');
      const value = file.fread(2, 'float32');
      expect(value[0]).toBeCloseTo(3.14159, 5);
      expect(value[1]).toBeCloseTo(1.61803, 5);
      expect(file.offset).toBe(20);
    });

    test('should read single float64', () => {
      file.fseek(20, 'bof');
      const value = file.fread(1, 'float64');
      expect(value).toBeCloseTo(2.718281828459045, 15);
      expect(file.offset).toBe(28);
    });

    test('should read multiple float64', () => {
      file.fseek(20, 'bof');
      const value = file.fread(2, 'float64');
      expect(value[0]).toBeCloseTo(2.718281828459045, 15);
      expect(value[1]).toBeCloseTo(1.414213562373095, 15);
      expect(file.offset).toBe(36);
    });

    test('should read string', () => {
      file.fseek(38, 'bof');
      const str = file.fread(12, 'string');
      expect(str).toBe('Hello World!');
      expect(file.offset).toBe(50);
    });

    test('should handle reading beyond buffer bounds', () => {
      file.fseek(70, 'bof');
      expect(() => file.fread(20, 'uint8')).toThrow();
    });
  });

  describe('fseek', () => {
    test('should seek from beginning of file', () => {
      file.fseek(10, 'bof');
      expect(file.offset).toBe(10);
    });

    test('should seek from current position', () => {
      file.fseek(5, 'cof');
      expect(file.offset).toBe(5);
      file.fseek(3, 'cof');
      expect(file.offset).toBe(8);
    });

    test('should seek from end of file', () => {
      file.fseek(-5, 'eof');
      expect(file.offset).toBe(testBuffer.byteLength - 5);
    });
  });

  describe('frewind', () => {
    test('should reset offset to 0', () => {
      file.fseek(20, 'bof');
      file.frewind();
      expect(file.offset).toBe(0);
    });
  });

  describe('ftell', () => {
    test('should return current offset', () => {
      expect(file.ftell()).toBe(0);
      file.fseek(15, 'bof');
      expect(file.ftell()).toBe(15);
    });
  });

  describe('big-endian support', () => {
    let bigEndianFile;

    beforeEach(() => {
      // Create a big-endian test buffer
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setInt32(0, 0x12345678, false); // Big-endian

      bigEndianFile = new FILE('big.bin', 'ieee-be');
      bigEndianFile.fopen(buffer);
    });

    test('should read big-endian int32', () => {
      const value = bigEndianFile.fread(1, 'int32');
      expect(value).toBe(0x12345678);
    });
  });
});
