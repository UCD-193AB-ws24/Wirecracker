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

export function unique(array)
{
    return [...new Set(array)];
}

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

export function prod(array) {
    return array.reduce((acc, num) => acc * num, 1);
}
