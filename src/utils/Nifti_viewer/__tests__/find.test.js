import { find } from '../matlab_functions.js';
import { describe, test, expect } from 'vitest';

describe('find function', () => {
    test('find nonzero elements in a 1D array', () => {
        const input = [0, 2, 0, 4];
        const result = find(input);
        expect(result).toEqual([1, 3]);  // Nonzero elements are at indices 1 and 3
    });

    test('find nonzero elements in a 1D array with all zeros', () => {
        const input = [0, 0, 0, 0];
        const result = find(input);
        expect(result).toEqual([]);  // No nonzero elements, so result should be an empty array
    });

    test('find nonzero elements in a 2D array', () => {
        const input = [
            [0, 2],
            [3, 0]
        ];
        const result = find(input);
        expect(result).toEqual([1, 2]);
    });

    test('find nonzero elements in a 3D array', () => {
        const input = [
            [
                [0, 1],
                [0, 0]
            ],
            [
                [0, 0],
                [2, 0]
            ]
        ];
        const result = find(input);
        expect(result).toEqual([1, 6]);
    });

    test('find nonzero elements in an array with all zeros', () => {
        const input = [
            [0, 0],
            [0, 0]
        ];
        const result = find(input);
        expect(result).toEqual([]);  // All elements are zero, so result should be empty
    });

    test('should return the indices array as-is when vector length equals found count (false case)', () => {
      const input = [1, 1]; // Vector with all elements non-zero
      const result = find(input);
      expect(result).toEqual([0, 1]);
    });
});
