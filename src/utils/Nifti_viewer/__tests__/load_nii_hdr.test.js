import { describe, test, expect } from 'vitest';
import load_nii_hdr from '../load_nii_hdr.js';

describe('load_nii_hdr', () => {
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
    view.setFloat32(56, 0, littleEndian); // intent_p1
    view.setFloat32(60, 0, littleEndian); // intent_p2
    view.setFloat32(64, 0, littleEndian); // intent_p3
    view.setInt16(68, 0, littleEndian); // intent_code
    view.setInt16(70, 16, littleEndian); // datatype (float32)
    view.setInt16(72, 32, littleEndian); // bitpix
    view.setInt16(74, 0, littleEndian); // slice_start
    view.setFloat32(76, 1.0, littleEndian); // pixdim[1]
    view.setFloat32(80, 1.0, littleEndian); // pixdim[2]
    view.setFloat32(84, 1.0, littleEndian); // pixdim[3]
    view.setFloat32(88, 0, littleEndian); // pixdim[4]
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
      view.setInt16(104 + 148, 2, littleEndian); // qform_code (104 is offset from start of data_history)
      view.setInt16(106 + 148, 1, littleEndian); // sform_code
      view.setFloat32(108 + 148, 0, littleEndian); // quatern_b
      view.setFloat32(112 + 148, 0, littleEndian); // quatern_c
      view.setFloat32(116 + 148, 0, littleEndian); // quatern_d
      view.setFloat32(120 + 148, 0, littleEndian); // qoffset_x
      view.setFloat32(124 + 148, 0, littleEndian); // qoffset_y
      view.setFloat32(128 + 148, 0, littleEndian); // qoffset_z

      // srow_x
      view.setFloat32(132 + 148, 1, littleEndian);
      view.setFloat32(136 + 148, 0, littleEndian);
      view.setFloat32(140 + 148, 0, littleEndian);
      view.setFloat32(144 + 148, 0, littleEndian);

      // srow_y
      view.setFloat32(148 + 148, 0, littleEndian);
      view.setFloat32(152 + 148, 1, littleEndian);
      view.setFloat32(156 + 148, 0, littleEndian);
      view.setFloat32(160 + 148, 0, littleEndian);

      // srow_z
      view.setFloat32(164 + 148, 0, littleEndian);
      view.setFloat32(168 + 148, 0, littleEndian);
      view.setFloat32(172 + 148, 1, littleEndian);
      view.setFloat32(176 + 148, 0, littleEndian);
    } else {
      view.setInt16(104 + 148, 0, littleEndian); // qform_code
      view.setInt16(106 + 148, 0, littleEndian); // sform_code
    }

    // intent_name (16 bytes) - leave empty
    const magic = includeTransform ? "n+1" : "ni1";
    const magicData = encoder.encode(magic);
    new Uint8Array(buffer).set(magicData, 196 + 148); // magic

    // originator (10 bytes at offset 253)
    view.setInt16(253, 32, littleEndian); // originator[0]
    view.setInt16(255, 32, littleEndian); // originator[1]
    view.setInt16(257, 16, littleEndian); // originator[2]
    view.setInt16(259, 0, littleEndian);  // originator[3]
    view.setInt16(261, 0, littleEndian);  // originator[4]

    return buffer;
  }

  test('should load a NIfTI header with valid .nii extension', () => {
    const buffer = createNiftiHeaderBuffer(true, true);
    const [hdr, filetype, fileprefix, machine] = load_nii_hdr('test.nii', buffer);

    expect(fileprefix).toBe('test');
    expect(machine).toBe('ieee-le');
    expect(filetype).toBe(2); // n+1 magic
    expect(hdr.hk.sizeof_hdr).toBe(348);
  });

  test('should load a NIfTI header with valid .hdr extension', () => {
    const buffer = createNiftiHeaderBuffer(true, false);
    const [hdr, filetype, fileprefix, machine] = load_nii_hdr('test.hdr', buffer);

    expect(fileprefix).toBe('test');
    expect(filetype).toBe(1); // ni1 magic
  });

  test('should load a NIfTI header with valid .img extension', () => {
    const buffer = createNiftiHeaderBuffer(true, true);
    const [hdr, filetype, fileprefix, machine] = load_nii_hdr('test.img', buffer);

    expect(fileprefix).toBe('test');
  });

  test('should throw error for unsupported extension', () => {
    const buffer = createNiftiHeaderBuffer();
    expect(() => load_nii_hdr('test.unsupported', buffer)).toThrow('Supported extension type : .nii .hdr .img');
  });

  test('should detect big-endian files', () => {
    const buffer = createNiftiHeaderBuffer(false, true); // big-endian
    const [hdr, filetype, fileprefix, machine] = load_nii_hdr('test.nii', buffer);

    expect(machine).toBe('ieee-be');
    expect(hdr.hist.magic).toBe('n+1');
  });

  test('should throw error for corrupted file', () => {
    const buffer = new ArrayBuffer(348);
    const view = new DataView(buffer);
    view.setInt32(0, 100, true); // Invalid header size

    expect(() => load_nii_hdr('test.nii', buffer)).toThrow('File test.nii is corrupted.');
  });

  test('should read originator information correctly', () => {
    const buffer = createNiftiHeaderBuffer(true, true);
    const [hdr] = load_nii_hdr('test.nii', buffer);

    expect(hdr.hist.originator).toEqual([32, 32, 16, 0, 0]);
  });

  test('should handle files with ni1 magic', () => {
    const buffer = createNiftiHeaderBuffer(true, false); // ni1 magic
    const [hdr, filetype] = load_nii_hdr('test.nii', buffer);

    expect(filetype).toBe(1);
    expect(hdr.hist.magic).toBe('ni1');
  });

  test('should reset qform/sform codes for invalid magic', () => {
    const buffer = createNiftiHeaderBuffer(true, true);
    // Corrupt the magic number
    new Uint8Array(buffer).set([0, 0, 0, 0], 196 + 148);

    const [hdr] = load_nii_hdr('test.nii', buffer);
    expect(hdr.hist.qform_code).toBe(0);
    expect(hdr.hist.sform_code).toBe(0);
  });

  test('should throw error when no filename is provided', () => {
    const buffer = createNiftiHeaderBuffer();
    expect(() => load_nii_hdr('', buffer)).toThrow('Usage: [hdr, filetype, fileprefix, machine] = load_nii_hdr(filename)');
  });
});
