//  Open all .nii file using untouch-nii with automatic flip to have right on the right
//  CAUTION only works on 3D B&W nii image. Will not work on Colored ones, ones with imaginary numbers, and ones with 4+ dimension


export default function nifti_anatomical_convention (nii)
{
    let final_flip = [0,0,0];
    let rot_dim = [0,1,2];
    let rot = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];


    let xmax_pos = max_abs_pos(nii.hdr.hist.srow_x.slice(0, 3));
    let image = nii.img;

    // the -1 indicates neuro convention, otherwise radio convention

    // Test to take account of all orientations
    // Added for freesurfer or other support; When the matrix is not diagonal

    if ( xmax_pos == 0 )
    {
        if ( nii.hdr.hist.srow_x[xmax_pos] < 0 )
        {
            flip(image, 2);
            final_flip[0] = 1;
            nii.hdr.hist.srow_x[xmax_pos] = -1 * nii.hdr.hist.srow_x[xmax_pos];
            nii.hdr.hist.srow_y[xmax_pos] = -1 * nii.hdr.hist.srow_y[xmax_pos];
            nii.hdr.hist.srow_z[xmax_pos] = -1 * nii.hdr.hist.srow_z[xmax_pos];
        }
    }
    else if ( xmax_pos == 1 )
    {
        image = permute(image, [1,0,2]);
        if ( nii.hdr.hist.srow_x[xmax_pos] < 0 )
        {
            flip(image, 2);
            final_flip[0] = 1;
            nii.hdr.hist.srow_x[xmax_pos] = -1 * nii.hdr.hist.srow_x[xmax_pos];
            nii.hdr.hist.srow_y[xmax_pos] = -1 * nii.hdr.hist.srow_y[xmax_pos];
            nii.hdr.hist.srow_z[xmax_pos] = -1 * nii.hdr.hist.srow_z[xmax_pos];
        }

        [nii.hdr.hist.srow_x[0], nii.hdr.hist.srow_x[1]] = [nii.hdr.hist.srow_x[1], nii.hdr.hist.srow_x[0]];
        [nii.hdr.hist.srow_y[0], nii.hdr.hist.srow_y[1]] = [nii.hdr.hist.srow_y[1], nii.hdr.hist.srow_y[0]];
        [nii.hdr.hist.srow_z[0], nii.hdr.hist.srow_z[1]] = [nii.hdr.hist.srow_z[1], nii.hdr.hist.srow_z[0]];

        rot_dim = [1,0,2];
        rot = [
            [0, 1, 0],
            [1, 0, 0],
            [0, 0, 1],
        ];

        let old_dim = nii.hdr.dime.dim.slice(1, 4);
        for ( let loc = 0; loc < rot_dim.length; loc++ )
        {
            nii.hdr.dime.dim[loc + 1] = old_dim[rot_dim[loc]];
        }
    }
    else if ( xmax_pos == 2 )
    {
        image = permute(image, [2,0,1]);
        if ( nii.hdr.hist.srow_x[xmax_pos] < 0 )
        {
            flip(image, 2);
            final_flip[0] = 1;
            nii.hdr.hist.srow_x[xmax_pos] = -1 * nii.hdr.hist.srow_x[xmax_pos];
            nii.hdr.hist.srow_y[xmax_pos] = -1 * nii.hdr.hist.srow_y[xmax_pos];
            nii.hdr.hist.srow_z[xmax_pos] = -1 * nii.hdr.hist.srow_z[xmax_pos];
        }

        nii.hdr.hist.srow_x = [nii.hdr.hist.srow_x[2], nii.hdr.hist.srow_x[0], nii.hdr.hist.srow_x[1], nii.hdr.hist.srow_x[3]];
        nii.hdr.hist.srow_y = [nii.hdr.hist.srow_y[2], nii.hdr.hist.srow_y[0], nii.hdr.hist.srow_y[1], nii.hdr.hist.srow_y[3]];
        nii.hdr.hist.srow_z = [nii.hdr.hist.srow_z[2], nii.hdr.hist.srow_z[0], nii.hdr.hist.srow_z[1], nii.hdr.hist.srow_z[3]];

        rot_dim = [2,0,1];
        rot = [
            [0, 0, 1],
            [1, 0, 0],
            [0, 1, 0]
        ];

        let old_dim = nii.hdr.dime.dim.slice(1, 4);
        for ( let loc = 0; loc < rot_dim.length; loc++ )
        {
            nii.hdr.dime.dim[loc + 1] = old_dim[rot_dim[loc]];
        }
    }


    let ymax_pos = max_abs_pos(nii.hdr.hist.srow_y.slice(0, 3));
    let zmax_pos = max_abs_pos(nii.hdr.hist.srow_z.slice(0, 3));

    if ( ymax_pos == 1 || ( ymax_pos == 2 && zmax_pos == 2 ) )
    {
        if ( nii.hdr.hist.srow_y[ymax_pos] < 0 )
        {
            flip(image, 1);

            final_flip[1] = 1;
            nii.hdr.hist.srow_x[ymax_pos] = -1 * nii.hdr.hist.srow_x[ymax_pos];
            nii.hdr.hist.srow_y[ymax_pos] = -1 * nii.hdr.hist.srow_y[ymax_pos];
            nii.hdr.hist.srow_z[ymax_pos] = -1 * nii.hdr.hist.srow_z[ymax_pos];
        }
    }
    else if ( ymax_pos == 2 )
    {
        image = permute(image, [0,2,1]);
        nii.hdr.hist.srow_x = [nii.hdr.hist.srow_x[0], nii.hdr.hist.srow_x[2], nii.hdr.hist.srow_x[1], nii.hdr.hist.srow_x[3]];
        nii.hdr.hist.srow_y = [nii.hdr.hist.srow_y[0], nii.hdr.hist.srow_y[2], nii.hdr.hist.srow_y[1], nii.hdr.hist.srow_y[3]];
        nii.hdr.hist.srow_z = [nii.hdr.hist.srow_z[0], nii.hdr.hist.srow_z[2], nii.hdr.hist.srow_z[1], nii.hdr.hist.srow_z[3]];
        rot_dim = [0,2,1];
        rot = [
            [1, 0, 0],
            [0, 0, 1],
            [0, 1, 0],
        ];
        let old_dim = nii.hdr.dime.dim.slice(1, 4);
        for ( let loc = 0; loc < rot_dim.length; loc++ )
        {
            nii.hdr.dime.dim[loc + 1] = old_dim[rot_dim[loc]];
        }

        if ( nii.hdr.hist.srow_y[1] < 0 )
        {
            flip(image, 1);

            final_flip[1] = 1;
            nii.hdr.hist.srow_x[1] = -1 * nii.hdr.hist.srow_x[1];
            nii.hdr.hist.srow_y[1] = -1 * nii.hdr.hist.srow_y[1];
            nii.hdr.hist.srow_z[1] = -1 * nii.hdr.hist.srow_z[1];
        }
    }

    zmax_pos = max_abs_pos(nii.hdr.hist.srow_z.slice(0, 3));
    if ( zmax_pos == 2 )
    {
        if ( nii.hdr.hist.srow_z[zmax_pos] < 0 )
        {
            flip(image, 0);

            final_flip[2] = 1;
            nii.hdr.hist.srow_x[zmax_pos] = -1 * nii.hdr.hist.srow_x[zmax_pos];
            nii.hdr.hist.srow_y[zmax_pos] = -1 * nii.hdr.hist.srow_y[zmax_pos];
            nii.hdr.hist.srow_z[zmax_pos] = -1 * nii.hdr.hist.srow_z[zmax_pos];
        }
    }

    nii.img = image;
    nii.rotation = rot;
    nii.rot_dim = rot_dim;
    nii.flip = final_flip;
    let old_pixdim = nii.hdr.dime.pixdim.slice(1, 4);
    for ( let loc = 0; loc < rot_dim.length; loc++ )
    {
        nii.hdr.dime.pixdim[loc + 1] = old_pixdim[rot_dim[loc]];
    }

    return nii;
}



// Deforms original. Destructive in weird way
function permute(array, order) {
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

function transpose(arr) {
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

function flip( array, n )
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

function max_abs_pos( array )
{
    let max = Math.abs(array[0]);
    let pos = 0;
    for ( let i = 1; i < array.length; i++ )
    {
        if ( max < Math.abs(array[i]) )
        {
            pos = i;
            max = Math.abs(array[i]);
        }
    }
    return pos;
}
