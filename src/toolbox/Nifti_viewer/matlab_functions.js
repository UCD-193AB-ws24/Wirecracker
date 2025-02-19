//   _    _ _                              _
//  | |  | (_)                            | |
//  | |  | |_ _ __ ___  ___ _ __ __ _  ___| | _____ _ __
//  | |/\| | | '__/ _ \/ __| '__/ _` |/ __| |/ / _ \ '__|
//  \  /\  / | | |  __/ (__| | | (_| | (__|   <  __/ |
//   \/  \/|_|_|  \___|\___|_|  \__,_|\___|_|\_\___|_|
//
//  Collection of matlab function ported into javascript.
//  The functions here does not have original algorithm.
//
//  This file contains:
//
//  @function isnumeric
//  @function unique
//  @function sub2ind
//  @function reshape
//  @function isequal
//  @function permute
//  @function transpose
//  @function flip
//  @function prod

/*
 * Determine whether input is numeric array
 *
 * @param {Object|Object[]} value  -  Input array or value
 *
 * @returns {boolean}  true if A is an array of numeric data type. Otherwise, it returns false.
 */
export function isnumeric ( value )
{
    if ( typeof value === 'number' )
    {
        return true;
    }
    else if ( Array.isArray(value) )
    {
        for (const element of value)
        {
            if ( !isnumeric(element) )
            {
                return false;
            }
        }
        return true;
    }
    return false;
}

/*
 * Given an array, return an array that does not contain any duplicates
 * Only tested with single dimensional array
 *
 * @param {Object[]} array  -  Input array
 *
 * @returns {Object[]}  Array with the same data as in A, but with no repetitions.
 */
export function unique(array)
{
    return [...new Set(array)];
}

/*
 * Convert subscripts to linear indices
 *
 * @param {integer[]} sizes  -  Size of array, specified as a vector of positive integers.
 * Each element of this vector indicates the size of the corresponding dimension.
 *
 * @param {integer I1, I2, ..., In}  -  Multidimensional subscripts, specified in scalars.
 *
 * @returns {integer}  Linear index, returned as a scalar
 */
export function sub2ind(sizes, ...subs)
{
    let index = 0;
    let multiplier = 1;

    if (subs.length !== sizes.length)
    {
        throw new Error("Number of subscripts must match number of dimensions");
    }

    for (let i = 0; i < subs.length; i++)
    {
        if (subs[i] < 0 || subs[i] >= sizes[i])
        {
            throw new Error(`Subscript ${subs[i]} is out of bounds for dimension ${i}`);
        }
        index += subs[i] * multiplier;
        multiplier *= sizes[i];
    }
    return index;
}


/*
 * Reshape array by rearranging existing elements
 * Destructive
 *
 * @param {Array} array  -  Input array, specified as a vector, matrix, or multidimensional array.
 * @param {integer[]} sizes  -  Output size, specified as a row vector of integers. Each element of
 * sizes indicates the size of the corresponding dimension in output. You must specify the size so
 * that the number of elements in input array and output array are the same. That is, prod(sizes) must
 * be the same as number_of_elements(input).
 *
 * @returns {Array}  Reshaped array, returned as a vector, matrix, multidimensional array. The data
 * type and number of elements in output are the same as the data type and number of elements in input.
 */
export function reshape (array, sizes)
{
    let matlabDim = sizes.reverse();
    array.flat(Infinity);
    let tmpArray2;
    // for each dimensions starting by the last one and ignoring the first one
    for (let sizeIndex = matlabDim.length - 1; sizeIndex > 0; sizeIndex--)
    {
        const size = matlabDim[sizeIndex];
        tmpArray2 = [];

        // aggregate the elements of the current tmpArray in elements of the requested size
        const length = array.length / size;
        for (let i = 0; i < length; i++)
        {
            tmpArray2.push(array.slice(i * size, (i + 1) * size));
        }
        // set it as the new tmpArray for the next loop turn or for return
        array = tmpArray2;
    }

    return array;
}

/*
 * Determine array equality
 *
 * @param {Array} array1  -  Input to be compared
 * @param {Array} array1  -  Input to be compared
 *
 * @returns {boolean}  true if array1 and array2 are equivalent; otherwise, it returns false.
 */
export function isequal ( array1, array2 )
{
    if (!array1 || !array2)
        return false;

    if ( array1 === array2 )
        return true;

    if ( array1.length != array2.length )
        return false;

    for (var i = 0, l=array1.length; i < l; i++) {
        if (array1[i] instanceof Array && array2[i] instanceof Array) {
            if (!isequal(array1[i], array2[i]))
                return false;
        }
        else if (array1[i] != array2[i]) {
            return false;
        }
    }
    return true;
}

/*
 * Permute array dimentions
 * Destructive. Always reassign the output value from this function to the variable holding the array to be permuted
 *
 * @param {Array} array  -  Input array, specified as a vector, matrix, or multidimensional array.
 * @param {integer[]} order  -  Dimension order, specified as a row vector with unique,
 * positive integer elements that represent the dimensions of the input array.
 *
 * @returns {Array}  Input array with the dimensions rearranged in the order specified by the vector
 * dimorder. For example, permute(A,[1,0]) switches the row and column dimensions of a matrix A. In general,
 * the ith dimension of the output array is the dimension dimorder(i) from the input array.
 */
export function permute(array, order) {
    for (var i = 0; i < order.length; i++) {

        // Last i elements are already in place
        for (var j = 0; j < (order.length - i - 1); j++) {
            // Checking if the item at present iteration
            // is greater than the next iteration
            if (order[j] > order[j + 1]) {

                // If the condition is true
                // then swap them

                // transpose dimension j
                array = transpose_nth_dim(array, j);

                [order[j], order[j + 1]] = [order[j + 1], order[j]];
            }
        }
    }

    return array;
}

function transpose_nth_dim ( arr, n ) {
    if ( n == 0 )
    {
        arr = transpose(arr);
    }
    else if ( n == 1 )
    {
        for ( let i = 0; i < arr.length; i++ )
        {
            arr[i] = transpose(arr[i]);
        }
    }
    else
    {
        for ( let i = 0; i < arr.length; i++ )
        {
            arr[i] = transpose_nth_dim(arr[i], n - 1);
        }
    }
    return arr;
}

/*
 * Transpose vector or matrix
 *
 * @param {Array} arr  -  Input array, specified as a vector or matrix.
 *
 * @returns {Array}  the nonconjugate transpose of input array, that is,
 * interchanges the row and column index for each element.
 */
export function transpose(arr) {
    let rows = arr.length;
    let cols = arr[0].length;

    // Initialize transposed array
    let transposed = Array.from({ length: cols }, () => Array(rows).fill(0));

    // Swap rows and columns
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            transposed[j][i] = arr[i][j];
        }
    }

    return transposed;
}

/*
 * Flip order of elements
 *
 * @param {Array} array  -  Input array, specified as a vector, matrix, or multidimensional array.
 * @param {integer} n  -  Dimension to operate along, specified as a positive integer scalar.
 *
 * @returns {Array}  array with the same size as input, but with the order of the elements at n-th dimension reversed.
 */
export function flip( array, n )
{
    if ( n <= 0 )
    {
        array.reverse();
    }
    else
    {
        for (let item of array)
        {
            flip(item, n - 1);
        }
    }
}

/*
 * Product of array elements
 *
 * @param {number[]} array  -  Input array, specified as a one dimensional array.
 *
 * @returns {number}  product of the array elements of input.
 */
export function prod(array) {
    return array.reduce((acc, num) => acc * num, 1);
}
