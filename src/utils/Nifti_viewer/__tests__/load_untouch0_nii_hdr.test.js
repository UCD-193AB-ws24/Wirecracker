import { describe, test, expect } from 'vitest';
import load_untouch0_nii_hdr from '../load_untouch0_nii_hdr.js';
import FILE from '../FILE.js';

describe('load_untouch0_nii_hdr', () => {
  function createNiftiHeaderBuffer(littleEndian = true) {
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
    view.setUint8(39, 0); // hkey_un0

    // Image Dimension (108 bytes)
    view.setInt16(40, 4, littleEndian); // dim[0] - 4 dimensions
    view.setInt16(42, 64, littleEndian); // dim[1] - x
    view.setInt16(44, 64, littleEndian); // dim[2] - y
    view.setInt16(46, 32, littleEndian); // dim[3] - z
    view.setInt16(48, 1, littleEndian); // dim[4] - t
    // vox_units (4 bytes) - mm
    view.setUint8(56, 'm'.charCodeAt(0));
    view.setUint8(57, 'm'.charCodeAt(0));
    // cal_units (8 bytes) - leave empty
    view.setInt16(68, 0, littleEndian); // unused1
    view.setInt16(70, 16, littleEndian); // datatype (float32)
    view.setInt16(72, 32, littleEndian); // bitpix
    view.setInt16(74, 0, littleEndian); // dim_un0
    view.setFloat32(76, 1.0, littleEndian); // pixdim[1]
    view.setFloat32(80, 1.0, littleEndian); // pixdim[2]
    view.setFloat32(84, 1.0, littleEndian); // pixdim[3]
    view.setFloat32(88, 0, littleEndian); // pixdim[4]
    view.setFloat32(108, 352, littleEndian); // vox_offset (header + 4 bytes)
    view.setFloat32(112, 1.0, littleEndian); // roi_scale
    view.setFloat32(116, 0, littleEndian); // funused1
    view.setFloat32(120, 0, littleEndian); // funused2
    view.setFloat32(124, 1000, littleEndian); // cal_max
    view.setFloat32(128, 0, littleEndian); // cal_min
    view.setInt32(132, 0, littleEndian); // compressed
    view.setInt32(136, 0, littleEndian); // verified
    view.setInt32(140, 1000, littleEndian); // glmax
    view.setInt32(144, 0, littleEndian); // glmin

    // Data History (200 bytes)
    const descrip = "Test NIfTI file";
    const encoder = new TextEncoder();
    const descripData = encoder.encode(descrip);
    new Uint8Array(buffer).set(descripData, 148); // descrip
    // aux_file (24 bytes) - leave empty
    view.setUint8(272, 0); // orient
    // originator (10 bytes) - leave empty
    // generated (10 bytes) - leave empty
    // scannum (10 bytes) - leave empty
    // patient_id (10 bytes) - leave empty
    // exp_date (10 bytes) - leave empty
    // exp_time (10 bytes) - leave empty
    // hist_un0 (3 bytes) - leave empty
    view.setInt32(316, 0, littleEndian); // views
    view.setInt32(320, 0, littleEndian); // vols_added
    view.setInt32(324, 0, littleEndian); // start_field
    view.setInt32(328, 0, littleEndian); // field_skip
    view.setInt32(332, 0, littleEndian); // omax
    view.setInt32(336, 0, littleEndian); // omin
    view.setInt32(340, 0, littleEndian); // smax
    view.setInt32(344, 0, littleEndian); // smin

    return buffer;
  }

  test('should load a basic NIfTI header (little-endian)', () => {
    const buffer = createNiftiHeaderBuffer(true);
    const hdr = load_untouch0_nii_hdr('ieee-le', buffer);

    // Test header key
    expect(hdr.hk.sizeof_hdr).toBe(348);
    expect(hdr.hk.regular).toBe('r');

    // Test image dimension
    expect(hdr.dime.dim).toEqual([4, 64, 64, 32, 1, 0, 0, 0]);
    expect(hdr.dime.datatype).toBe(16); // float32
    expect(hdr.dime.bitpix).toBe(32);
    expect(hdr.dime.pixdim.slice(0, 4)).toEqual([1.0, 1.0, 1.0, 0]);
    expect(hdr.dime.vox_offset).toBe(352);

    // Test data history
    expect(hdr.hist.descrip).toBe('Test NIfTI file');
  });

  test('should load a basic NIfTI header (big-endian)', () => {
    const buffer = createNiftiHeaderBuffer(false);
    const hdr = load_untouch0_nii_hdr('ieee-be', buffer);

    // Test header key
    expect(hdr.hk.sizeof_hdr).toBe(348);
    expect(hdr.hk.regular).toBe('r');

    // Test image dimension
    expect(hdr.dime.dim).toEqual([4, 64, 64, 32, 1, 0, 0, 0]);
    expect(hdr.dime.datatype).toBe(16); // float32
    expect(hdr.dime.bitpix).toBe(32);
  });

  test('should handle empty string fields', () => {
    const buffer = createNiftiHeaderBuffer();
    const fid = new FILE('', 'ieee-le');
    fid.fopen(buffer);

    const hdr = load_untouch0_nii_hdr('ieee-le', buffer);

    expect(hdr.hk.data_type).toBe('');
    expect(hdr.hk.db_name).toBe('');
    expect(hdr.dime.vox_units).toBe('mm');
    expect(hdr.dime.cal_units).toBe('');
    expect(hdr.hist.aux_file).toBe('');
  });
});
