import { describe, it, expect } from 'vitest';
import load_nii_ext from '../load_nii_ext.js';

describe('load_nii_ext', () => {
  function createNiftiHeaderWithExtension(littleEndian = true, hasExtension = true) {
    // Create a basic NIfTI header with extension space
    const buffer = new ArrayBuffer(1024); // Extra space for extensions
    const view = new DataView(buffer);

    // Standard NIfTI header
    view.setInt32(0, 348, littleEndian); // sizeof_hdr
    view.setFloat32(108, 400, littleEndian); // vox_offset (leaving space for extensions)

    if (hasExtension) {
      // Extension marker (first byte must be 1)
      view.setUint8(348, 1);

      // First extension section (size 32 bytes)
      view.setInt32(352, 32, littleEndian); // esize
      view.setInt32(356, 4, littleEndian); // ecode (4 = XML)
      const xmlData = "<test>Extension data</test>";
      const encoder = new TextEncoder();
      const xmlBytes = encoder.encode(xmlData);
      new Uint8Array(buffer).set(xmlBytes, 360);

      // Second extension section (size 64 bytes)
      view.setInt32(384, 64, littleEndian); // esize
      view.setInt32(388, 2, littleEndian); // ecode (2 = Dicom)
      const dicomData = "DICOM extension data";
      const dicomBytes = encoder.encode(dicomData);
      new Uint8Array(buffer).set(dicomBytes, 392);
    }

    return buffer;
  }

  it('should load extensions from .nii file', () => {
    const buffer = createNiftiHeaderWithExtension();
    const ext = load_nii_ext('test.nii', buffer);

    expect(ext.num_ext).toBe(2);
    expect(ext.section[0].esize).toBe(32);
    expect(ext.section[0].ecode).toBe(4);
    expect(ext.section[1].esize).toBe(64);
    expect(ext.section[1].ecode).toBe(2);
  });

  it('should load extensions from .hdr file', () => {
    const buffer = createNiftiHeaderWithExtension();
    const ext = load_nii_ext('test.hdr', buffer);

    expect(ext.num_ext).toBeGreaterThan(0);
  });

  it('should return empty array when no extensions exist', () => {
    const buffer = createNiftiHeaderWithExtension(true, false);
    const ext = load_nii_ext('test.nii', buffer);

    expect(ext).toEqual([]);
  });

  it('should handle big-endian extension data', () => {
    const buffer = createNiftiHeaderWithExtension(false);
    const ext = load_nii_ext('test.nii', buffer);

    expect(ext.num_ext).toBe(2);
    expect(ext.section[0].esize).toBe(32);
  });

  it('should throw error for unsupported extension', () => {
    const buffer = createNiftiHeaderWithExtension();
    expect(() => load_nii_ext('test.unsupported', buffer))
      .toThrow('Supported extension type : .nii .hdr .img');
  });

  it('should throw error when no filename is provided', () => {
    const buffer = createNiftiHeaderWithExtension();
    expect(() => load_nii_ext('', buffer))
      .toThrow('Usage: ext = load_nii_ext(filename, data)');
  });

  it('should throw error for corrupted file', () => {
    const buffer = new ArrayBuffer(348);
    const view = new DataView(buffer);
    view.setInt32(0, 100, true); // Invalid header size

    expect(() => load_nii_ext('test.nii', buffer))
      .toThrow('File test.nii is corrupted.');
  });

  it('should handle extension sections correctly', () => {
    const buffer = createNiftiHeaderWithExtension();
    const ext = load_nii_ext('test.nii', buffer);

    // Test first extension section
    expect(ext.section[0].esize).toBe(32);
    expect(ext.section[0].ecode).toBe(4);
    expect(String.fromCharCode(...ext.section[0].edata)).toContain('Extension data');

    // Test second extension section
    expect(ext.section[1].esize).toBe(64);
    expect(ext.section[1].ecode).toBe(2);
    expect(String.fromCharCode(...ext.section[1].edata)).toContain('DICOM');
  });

  it('should handle files without vox_offset extension space', () => {
    // Create buffer with extensions but no vox_offset specified
    const buffer = new ArrayBuffer(368);
    const view = new DataView(buffer);
    view.setInt32(0, 348, true); // sizeof_hdr
    view.setUint8(348, 1); // Extension marker

    // Add a small extension
    view.setInt32(352, 16, true); // esize
    view.setInt32(356, 6, true); // ecode (6 = JSON)

    const ext = load_nii_ext('test.hdr', buffer);
    expect(ext.num_ext).toBe(1);
    expect(ext.section[0].ecode).toBe(6);
  });
});
