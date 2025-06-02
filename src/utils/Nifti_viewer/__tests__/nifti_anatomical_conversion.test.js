import { describe, test, expect } from 'vitest';
import nifti_anatomical_convention from '../nifti_anatomical_conversion.js';

describe('nifti_anatomical_convention', () => {
  test('should handle xmax_pos = 0 with negative value', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [-1, 0, 0, 0],
          srow_y: [0, 1, 0, 0],
          srow_z: [0, 0, 1, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip).toEqual([1, 0, 0]);
    expect(result.rot_dim).toEqual([0, 1, 2]);
    expect(result.rotation).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(result.hdr.hist.srow_x[0]).toBe(1);
  });

  test('should handle xmax_pos = 1 with positive value', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [0, 1, 0, 0],
          srow_y: [0, 1, 0, 0],
          srow_z: [0, 0, 1, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip[0]).toBe(0);
    expect(result.rot_dim).toEqual([1, 0, 2]);
    expect(result.rotation).toEqual([[0, 1, 0], [1, 0, 0], [0, 0, 1]]);
    expect(result.hdr.dime.dim[1]).toBe(20); // Swapped dimensions
    expect(result.hdr.dime.dim[2]).toBe(10);
  });

  test('should handle xmax_pos = 1 with negative value', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [0, -1, 0, 0],
          srow_y: [0, 1, 0, 0],
          srow_z: [0, 0, 1, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip[0]).toBe(1);
    expect(result.rot_dim).toEqual([1, 0, 2]);
    expect(result.rotation).toEqual([[0, 1, 0], [1, 0, 0], [0, 0, 1]]);
    expect(result.hdr.hist.srow_x[1]).toBe(0);
  });

  test('should handle xmax_pos = 2 with positive value', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [0, 0, 1, 0],
          srow_y: [0, 1, 0, 0],
          srow_z: [0, 0, 1, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip[0]).toBe(0);
    expect(result.rot_dim).toEqual([0, 2, 1]);
    expect(result.rotation).toEqual([[1, 0, 0], [0, 0, 1], [0, 1, 0]]);
    expect(result.hdr.dime.dim[1]).toBe(30);
    expect(result.hdr.dime.dim[2]).toBe(20);
  });

  test('should handle xmax_pos = 2 with negative value', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [0, 0, -1, 0],
          srow_y: [0, 1, 0, 0],
          srow_z: [0, 0, 1, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip[0]).toBe(1);
    expect(result.rot_dim).toEqual([0, 2, 1]);
    expect(result.rotation).toEqual([[1, 0, 0], [0, 0, 1], [0, 1, 0]]);
    expect(result.hdr.hist.srow_x[1]).toBe(0);
  });

  test('should handle ymax_pos = 1 with negative value', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [1, 0, 0, 0],
          srow_y: [0, -1, 0, 0],
          srow_z: [0, 0, 1, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip).toEqual([0, 1, 0]);
    expect(result.rot_dim).toEqual([0, 1, 2]);
    expect(result.hdr.hist.srow_y[1]).toBe(1); // Flipped back to positive
  });

  test('should handle ymax_pos = 2 with negative srow_y[1] value', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [1, 0, 0, 0],
          srow_y: [0, -0.5, -1, 0],
          srow_z: [0, 1, 0, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip).toEqual([0, 1, 0]);
    expect(result.rot_dim).toEqual([0, 2, 1]);
    expect(result.hdr.hist.srow_y[1]).toBe(1);
  });

  test('should handle ymax_pos = 2 with zmax_pos = 2', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [1, 0, 0, 0],
          srow_y: [0, 0, -1, 0],
          srow_z: [0, 0, 1, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip).toEqual([0, 1, 1]);
    expect(result.rot_dim).toEqual([0, 1, 2]);
    expect(result.hdr.hist.srow_y[2]).toBe(-1); // Flipped back to positive
  });

  test('should handle ymax_pos = 2 with permutation', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [1, 0, 0, 0],
          srow_y: [0, 0, 1, 0],
          srow_z: [0, 1, 0, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.rot_dim).toEqual([0, 2, 1]);
    expect(result.rotation).toEqual([[1, 0, 0], [0, 0, 1], [0, 1, 0]]);
    expect(result.hdr.dime.dim[2]).toBe(30); // Swapped dimensions
    expect(result.hdr.dime.dim[3]).toBe(20);
  });

  test('should handle zmax_pos = 2 with negative value', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [1, 0, 0, 0],
          srow_y: [0, 1, 0, 0],
          srow_z: [0, 0, -1, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.flip).toEqual([0, 0, 1]);
    expect(result.rot_dim).toEqual([0, 1, 2]);
    expect(result.hdr.hist.srow_z[2]).toBe(1); // Flipped back to positive
  });

  test('should update pixdim according to rotation', () => {
    const nii = {
      hdr: {
        hist: {
          srow_x: [0, 1, 0, 0],
          srow_y: [0, 0, 1, 0],
          srow_z: [1, 0, 0, 0],
        },
        dime: {
          dim: [3, 10, 20, 30, 1, 1, 1, 1],
          pixdim: [1, 2, 3, 1, 1, 1, 1, 1]
        }
      },
      img: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    };

    const result = nifti_anatomical_convention(nii);

    expect(result.hdr.dime.pixdim[1]).toBe(2); // Should be rotated according to rot_dim
    expect(result.hdr.dime.pixdim[2]).toBe(1);
    expect(result.hdr.dime.pixdim[3]).toBe(3);
  });
});
