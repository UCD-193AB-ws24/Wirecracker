import { describe, it, expect } from 'vitest';
import load_untouch_nii_hdr from '../load_untouch_nii_hdr.js';
import FILE from '../FILE.js';

describe('load_untouch_nii_hdr', () => {
  function createNiftiHeaderBuffer(littleEndian = true, includeTransform = true) {
    // NIfTI header is 348 bytes
    const buffer = new ArrayBuffer(348);
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
    view.setInt16(40, 4, littleEndian); // dim[0] - 4 dimensions
    view.setInt16(42, 64, littleEndian); // dim[1] - x
    view.setInt16(44, 64, littleEndian); // dim[2] - y
    view.setInt16(46, 32, littleEndian); // dim[3] - z
    view.setInt16(48, 1, littleEndian); // dim[4] - t
    view.setInt16(50, 0, littleEndian); // dim[5] - ?
    view.setInt16(52, 0, littleEndian); // dim[6] - ?
    view.setInt16(54, 0, littleEndian); // dim[7] - ?
    view.setFloat32(56, 0, littleEndian); // intent_p1
    view.setFloat32(60, 0, littleEndian); // intent_p2
    view.setFloat32(64, 0, littleEndian); // intent_p3
    view.setInt16(68, 0, littleEndian); // intent_code
    view.setInt16(70, 16, littleEndian); // datatype (float32)
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
    view.setInt32(144, 0, littleEndian); // glmin

    // Data History (200 bytes)
    const descrip = "Test NIfTI file with transform";
    const encoder = new TextEncoder();
    const descripData = encoder.encode(descrip);
    new Uint8Array(buffer).set(descripData, 148); // descrip
    // aux_file (24 bytes) - leave empty

    if (includeTransform) {
      view.setInt16(148 + 104, 2, littleEndian); // qform_code
      view.setInt16(148 + 106, 1, littleEndian); // sform_code
      view.setFloat32(148 + 108, 0, littleEndian); // quatern_b
      view.setFloat32(148 + 112, 0, littleEndian); // quatern_c
      view.setFloat32(148 + 116, 0, littleEndian); // quatern_d
      view.setFloat32(148 + 120, 0, littleEndian); // qoffset_x
      view.setFloat32(148 + 124, 0, littleEndian); // qoffset_y
      view.setFloat32(148 + 128, 0, littleEndian); // qoffset_z

      // srow_x
      view.setFloat32(148 + 132, 1, littleEndian);
      view.setFloat32(148 + 136, 0, littleEndian);
      view.setFloat32(148 + 140, 0, littleEndian);
      view.setFloat32(148 + 144, 0, littleEndian);

      // srow_y
      view.setFloat32(148 + 148, 0, littleEndian);
      view.setFloat32(148 + 152, 1, littleEndian);
      view.setFloat32(148 + 156, 0, littleEndian);
      view.setFloat32(148 + 160, 0, littleEndian);

      // srow_z
      view.setFloat32(148 + 164, 0, littleEndian);
      view.setFloat32(148 + 168, 0, littleEndian);
      view.setFloat32(148 + 172, 1, littleEndian);
      view.setFloat32(148 + 176, 0, littleEndian);
    } else {
      view.setInt16(148 + 104, 0, littleEndian); // qform_code
      view.setInt16(148 + 106, 0, littleEndian); // sform_code
    }

    // intent_name (16 bytes) - leave empty
    const magic = includeTransform ? "n+1" : "ni1";
    const magicData = encoder.encode(magic);
    new Uint8Array(buffer).set(magicData, 148 + 196); // magic

    return buffer;
  }

  it('should load a NIfTI header with transformations (little-endian)', () => {
    const buffer = createNiftiHeaderBuffer(true, true);
    const hdr = load_untouch_nii_hdr('ieee-le', buffer);

    // Test header key
    expect(hdr.hk.sizeof_hdr).toBe(348);
    expect(hdr.hk.regular).toBe('r');

    // Test image dimension
    expect(hdr.dime.dim).toEqual([4, 64, 64, 32, 1, 0, 0, 0]);
    expect(hdr.dime.datatype).toBe(16); // float32
    expect(hdr.dime.bitpix).toBe(32);
    expect(hdr.dime.pixdim.slice(0, 4)).toEqual([1.0, 1.0, 1.0, 0]);
    expect(hdr.dime.vox_offset).toBe(352);

    // Test data history with transformations
    expect(hdr.hist.descrip).toBe('Test NIfTI file with transform');
    expect(hdr.hist.qform_code).toBe(2);
    expect(hdr.hist.sform_code).toBe(1);
    expect(hdr.hist.magic).toBe('n+1');
    expect(hdr.hist.srow_x).toEqual([1, 0, 0, 0]);
    expect(hdr.hist.srow_y).toEqual([0, 1, 0, 0]);
    expect(hdr.hist.srow_z).toEqual([0, 0, 1, 0]);
  });

  it('should load a NIfTI header without transformations (big-endian)', () => {
    const buffer = createNiftiHeaderBuffer(false, false);
    const hdr = load_untouch_nii_hdr('ieee-be', buffer);

    // Test header key
    expect(hdr.hk.sizeof_hdr).toBe(348);

    // Test data history without transformations
    expect(hdr.hist.qform_code).toBe(0);
    expect(hdr.hist.sform_code).toBe(0);
    expect(hdr.hist.magic).toBe('ni1');
  });


  it('should reset qform and sform codes for invalid magic', () => {
    const buffer = createNiftiHeaderBuffer(true, true);
    // Corrupt the magic number
    const encoder = new TextEncoder();
    const magic = "nim";
    const magicData = encoder.encode(magic);
    new Uint8Array(buffer).set(magicData, 148 + 196); // magic

    const hdr = load_untouch_nii_hdr('ieee-le', buffer);
    expect(hdr.hist.qform_code).toBe(0);
    expect(hdr.hist.sform_code).toBe(0);
  });

  it('should handle empty transformation fields when magic is invalid', () => {
    const buffer = createNiftiHeaderBuffer(true, false);
    // Set invalid magic
    new Uint8Array(buffer).set([0, 0, 0, 0], 148 + 196);

    const hdr = load_untouch_nii_hdr('ieee-le', buffer);
    expect(hdr.hist.qform_code).toBe(0);
    expect(hdr.hist.sform_code).toBe(0);
  });
});
