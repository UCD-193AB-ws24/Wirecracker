import { describe, it, expect } from 'vitest';
import load_untouch_nii from '../load_untouch_nifti.js';

describe('load_untouch_nii', () => {
  function createNiftiBuffer(littleEndian = true, filetype = 2, datatype = 16, dims = [3, 64, 64, 32, 1, 1, 1, 1]) {
    // Create a buffer with header and simple image data
    const buffer = new ArrayBuffer(525000);
    const view = new DataView(buffer);

    // Header Key (40 bytes)
    view.setInt32(0, 348, littleEndian); // sizeof_hdr
    // data_type (10 bytes) - leave empty
    // db_name (18 bytes) - leave empty
    view.setInt32(32, 0, littleEndian); // extents
    view.setInt16(36, 0, littleEndian); // session_error
    view.setUint8(38, 'r'.charCodeAt(0)); // regular
    view.setUint8(39, 0); // dim_info

    // Image Dimension (108 bytes)
    view.setInt16(40, dims[0], littleEndian); // dim[0] - 4 dimensions
    view.setInt16(42, dims[1], littleEndian); // dim[1] - x
    view.setInt16(44, dims[2], littleEndian); // dim[2] - y
    view.setInt16(46, dims[3], littleEndian); // dim[3] - z
    view.setInt16(48, dims[4], littleEndian); // dim[4] - t
    view.setInt16(50, dims[5], littleEndian); // dim[5] - ?
    view.setInt16(52, dims[6], littleEndian); // dim[6] - ?
    view.setInt16(54, dims[7], littleEndian); // dim[7] - ?
    view.setFloat32(56, 0, littleEndian); // intent_p1
    view.setFloat32(60, 0, littleEndian); // intent_p2
    view.setFloat32(64, 0, littleEndian); // intent_p3
    view.setInt16(68, 0, littleEndian); // intent_code
    view.setInt16(70, datatype, littleEndian); // datatype (float32)
    view.setInt16(72, 32, littleEndian); // bitpix
    view.setInt16(74, 0, littleEndian); // slice_start
    view.setFloat32(76, 1.0, littleEndian); // pixdim[0]
    view.setFloat32(80, 1.0, littleEndian); // pixdim[1]
    view.setFloat32(84, 1.0, littleEndian); // pixdim[2]
    view.setFloat32(88, 0, littleEndian); // pixdim[3]
    view.setFloat32(92, 0, littleEndian); // pixdim[4]
    view.setFloat32(96, 0, littleEndian); // pixdim[5]
    view.setFloat32(100, 0, littleEndian); // pixdim[6]
    view.setFloat32(104, 0, littleEndian); // pixdim[7]
    view.setFloat32(108, 352, littleEndian); // vox_offset
    view.setFloat32(112, 1.0, littleEndian); // scl_slope
    view.setFloat32(116, 0, littleEndian); // scl_inter
    view.setInt16(120, 0, littleEndian); // slice_end
    view.setUint8(122, 0); // slice_code
    view.setUint8(123, 0x0A); // xyzt_units (mm and sec)
    view.setFloat32(124, 1000, littleEndian); // cal_max
    view.setFloat32(128, 0, littleEndian); // cal_min
    view.setFloat32(132, 0, littleEndian); // slice_duration
    view.setFloat32(136, 0, littleEndian); // toffset
    view.setInt32(140, 1000, littleEndian); // glmax
    view.setInt32(144, 256, littleEndian); // glmin

    // Data History (200 bytes)
    const descrip = "Test NIfTI file with transform";
    const encoder = new TextEncoder();
    const descripData = encoder.encode(descrip);
    new Uint8Array(buffer).set(descripData, 148); // descrip
    // aux_file (24 bytes) - leave empty

    view.setInt16(148 + 104, 0, littleEndian); // qform_code
    view.setInt16(148 + 106, 0, littleEndian); // sform_code


    // intent_name (16 bytes) - leave empty

    let magic = "crr"; // corrupted
    if (filetype == 2) {
        magic = "n+1";
    } else if (filetype == 1) {
        magic = "ni1";
    }
    const magicData = encoder.encode(magic);
    new Uint8Array(buffer).set(magicData, 148 + 196); // magic

    // Simple image data (float32 values)
    if (filetype === 2) {
      const imgData = new Float32Array(buffer, 352);
      for (let i = 0; i < 64*64*32; i++) {
        imgData[i] = i % 1000; // Simple pattern
      }
    }

    return buffer;
  }

  it('should load a basic NIfTI file', () => {
    const buffer = createNiftiBuffer();
    const nii = load_untouch_nii('test.nii', buffer);

    expect(nii.filetype).toBe(2);
    expect(nii.hdr.dime.dim[1]).toBe(64); // x dimension
    expect(nii.hdr.dime.dim[2]).toBe(64); // y dimension
    expect(nii.hdr.dime.dim[3]).toBe(32); // z dimension
  });

  it('should load an ANALYZE file', () => {
    const buffer = createNiftiBuffer(true, 0);
    const nii = load_untouch_nii('test.hdr', buffer);

    expect(nii.filetype).toBe(0);
    expect(nii.hdr.dime.dim[1]).toBe(64);
  });

  it('should load specific image volumes', () => {
    const buffer = createNiftiBuffer(true, 2, 16, [3, 64, 64, 32, 3, 1, 1, 1]);
    const nii = load_untouch_nii('test.nii', buffer, [1, 3]);

    expect(nii.hdr.dime.dim[4]).toBe(2); // Only 2 volumes loaded
  });

  it('should handle RGB data (new format)', () => {
    const buffer = createNiftiBuffer(true, 2, 128); // RGB type
    const nii = load_untouch_nii('test.nii', buffer);

    expect(nii.hdr.dime.datatype).toBe(128);
    expect(nii.hdr.dime.bitpix).toBe(24);
  });

  it('should handle RGB data (old format)', () => {
    const buffer = createNiftiBuffer(true, 2, 128); // RGB type
    const nii = load_untouch_nii('test.nii', buffer, [], [], [], [], 1);

    expect(nii.hdr.dime.datatype).toBe(128);
  });

  it('should throw error for unsupported datatype', () => {
    const buffer = createNiftiBuffer(true, 2, 1536); // Unsupported type
    expect(() => load_untouch_nii('test.nii', buffer))
      .toThrow('This datatype is not supported');
  });

  it('should throw error for invalid image indices', () => {
    const buffer = createNiftiBuffer(true, 2, 16, [3, 64, 64, 32, 3, 1, 1, 1]);
    expect(() => load_untouch_nii('test.nii', buffer, [1, 4])) // 4 is out of range
      .toThrow('should be an integer within the range of [1 ~ 3]');
  });

  it('should throw error for invalid max range', () => {
    const buffer = createNiftiBuffer(true, 2, 16, [3, 64, 64, 32, 1, 1, 1, 1]);
    expect(() => load_untouch_nii('test.nii', buffer, [1, 4])) // 4 is out of range
      .toThrow('"input" should be 1.');
  });

  it('should throw error for duplicated index', () => {
    const buffer = createNiftiBuffer(true, 2, 16, [3, 64, 64, 32, 3, 1, 1, 1]);
    expect(() => load_untouch_nii('test.nii', buffer, [1, 1])) // 4 is out of range
      .toThrow('Duplicate image index in "input"');
  });

  it('should throw error for invalid arguments', () => {
    const buffer = createNiftiBuffer(true, 2, 16, [3, 64, 64, 32, 3, 1, 1, 1]);
    expect(() => load_untouch_nii('test.nii', buffer, ["1", "2"])) // 4 is out of range
      .toThrow('"input" should be a numerical array.');
  });

  it('should handle 5D data', () => {
    const buffer = createNiftiBuffer(true, 2, 16, [4, 64, 64, 32, 3, 2, 1, 1]);
    const nii = load_untouch_nii('test.nii', buffer, [], [1, 2]);

    expect(nii.hdr.dime.dim[5]).toBe(2); // 5th dimension
  });

  it('should handle 6D data', () => {
    const buffer = createNiftiBuffer(true, 2, 16, [5, 64, 64, 32, 3, 2, 4, 1]);
    const nii = load_untouch_nii('test.nii', buffer, [], [], [1, 2, 3]);

    expect(nii.hdr.dime.dim[6]).toBe(3); // 6th dimension
  });

  it('should handle 7D data', () => {
    const buffer = createNiftiBuffer(true, 2, 16, [6, 64, 64, 32, 3, 2, 4, 2]);
    const nii = load_untouch_nii('test.nii', buffer, [], [], [], [1, 2]);

    expect(nii.hdr.dime.dim[7]).toBe(2); // 7th dimension
  });

  it('should update global min/max values', () => {
    const buffer = createNiftiBuffer();
    const nii = load_untouch_nii('test.nii', buffer);

    expect(nii.hdr.dime.glmax).toBeGreaterThan(0);
    expect(nii.hdr.dime.glmin).toBe(0);
  });

  it('should throw error for missing filename', () => {
    const buffer = createNiftiBuffer();
    expect(() => load_untouch_nii('', buffer))
      .toThrow('Usage: nii = load_untouch_nii(filename, [img_idx], [dim5_idx], [dim6_idx], [dim7_idx], [old_RGB], [slice_idx])');
  });

  it('should handle big-endian files', () => {
    const buffer = createNiftiBuffer(false);
    const nii = load_untouch_nii('test.nii', buffer);

    expect(nii.machine).toBe('ieee-be');
    expect(nii.hdr.dime.dim[1]).toBe(64);
  });
});
