//   _    _ _                              _
//  | |  | (_)                            | |
//  | |  | |_ _ __ ___  ___ _ __ __ _  ___| | _____ _ __
//  | |/\| | | '__/ _ \/ __| '__/ _` |/ __| |/ / _ \ '__|
//  \  /\  / | | |  __/ (__| | | (_| | (__|   <  __/ |
//   \/  \/|_|_|  \___|\___|_|  \__,_|\___|_|\_\___|_|
//
//  This version is ported from original MatLab script into JavaScript by Wirecracker team
//
//  Load NIFTI or ANALYZE dataset, but not applying any appropriate affine
//  geometric transform or voxel intensity scaling.
//
//  Although according to NIFTI website, all those header information are
//  supposed to be applied to the loaded NIFTI image, there are some
//  situations that people do want to leave the original NIFTI header and
//  data untouched. They will probably just use MATLAB to do certain image
//  processing regardless of image orientation, and to save data back with
//  the same NIfTI header.
//
//  Since this program is only served for those situations, please use it
//  together with "save_untouch_nii.m", and do not use "save_nii.m" or
//  "view_nii.m" for the data that is loaded by "load_untouch_nii.m". For
//  normal situation, you should use "load_nii.m" instead.
//
//  Usage: nii = load_untouch_nii(filename, [img_idx], [dim5_idx], [dim6_idx], ...
//			[dim7_idx], [old_RGB], [slice_idx])
//
//  filename  - 	NIFTI or ANALYZE file name.
//
//  img_idx (optional)  -  a numerical array of image volume indices.
//	Only the specified volumes will be loaded. All available image
//	volumes will be loaded, if it is default or empty.
//
//	The number of images scans can be obtained from get_nii_frame.m,
//	or simply: hdr.dime.dim(5).
//
//  dim5_idx (optional)  -  a numerical array of 5th dimension indices.
//	Only the specified range will be loaded. All available range
//	will be loaded, if it is default or empty.
//
//  dim6_idx (optional)  -  a numerical array of 6th dimension indices.
//	Only the specified range will be loaded. All available range
//	will be loaded, if it is default or empty.
//
//  dim7_idx (optional)  -  a numerical array of 7th dimension indices.
//	Only the specified range will be loaded. All available range
//	will be loaded, if it is default or empty.
//
//  old_RGB (optional)  -  a scale number to tell difference of new RGB24
//	from old RGB24. New RGB24 uses RGB triple sequentially for each
//	voxel, like [R1 G1 B1 R2 G2 B2 ...]. Analyze 6.0 from AnalyzeDirect
//	uses old RGB24, in a way like [R1 R2 ... G1 G2 ... B1 B2 ...] for
//	each slices. If the image that you view is garbled, try to set
//	old_RGB variable to 1 and try again, because it could be in
//	old RGB24. It will be set to 0, if it is default or empty.
//
//  slice_idx (optional)  -  a numerical array of image slice indices.
//	Only the specified slices will be loaded. All available image
//	slices will be loaded, if it is default or empty.
//
//  Returned values:
//
//  nii structure:
//
//	hdr -		struct with NIFTI header fields.
//
//	filetype -	Analyze format .hdr/.img (0);
//			NIFTI .hdr/.img (1);
//			NIFTI .nii (2)
//
//	fileprefix - 	NIFTI filename without extension.
//
//	machine - 	machine string variable.
//
//	img - 		3D (or 4D) matrix of NIFTI data.
//
//  - Jimmy Shen (jimmy@rotman-baycrest.on.ca)



export default function load_untouch_nii( filename, data, img_idx = [], dim5_idx = [], dim6_idx = [],
                                         dim7_idx = [], old_RGB = 0, slice_idx = [] )
{
    if ( !filename )
    {
        throw 'Usage: nii = load_untouch_nii(filename, [img_idx], [dim5_idx], [dim6_idx], [dim7_idx], [old_RGB], [slice_idx])'
    }

    let nii = {};
    [nii.hdr,nii.filetype,nii.fileprefix,nii.machine] = load_nii_hdr(filename, data);

    if (nii.filetype == 0)
    {
        nii.hdr = load_untouch0_nii_hdr(nii.fileprefix, nii.machine, data);
        nii.ext = [];
    }
    else
    {
        nii.hdr = load_untouch_nii_hdr(nii.fileprefix,nii.machine,nii.filetype,data);
        //  Read the header extension
        nii.ext = load_nii_ext(filename,data);
    }

    //  Read the dataset body
    [nii.img,nii.hdr] = load_untouch_nii_img(nii.hdr, nii.filetype, nii.fileprefix, nii.machine, data,
                                                           img_idx, dim5_idx, dim6_idx, dim7_idx, old_RGB, slice_idx);

    nii.untouch = 1;

    return nii;
}

function isnumeric ( value )
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

// MatLab unique implementation - only for array
function unique(arr)
{
    return [...new Set(arr)];
}

function sub2ind(sizes, ...subs)
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

function reshape (array, sizes)
{
    let matlabDim = sizes.reverse();
    array.flat(Infinity);
    let tmpArray2;
    let trivial = 1;
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

function isequal ( array1, array2 )
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

// Deforms original. Destructive in weird way
function permute(array, order) {
    const dimensions = dimension(array);
    const newDimensions = order.map(dim => dimensions[dim - 1]);

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


function dimension(array) {
    let dims = [];
    let current = array;
    while (Array.isArray(current)) {
        dims.push(current.length);
        current = current[0];
    }
    return dims;
}

function prod(arr) {
    return arr.reduce((acc, num) => acc * num, 1);
}

function load_untouch_nii_img ( hdr, filetype, fileprefix, machine, data,
                                              img_idx = [], dim5_idx = [], dim6_idx = [],
                                              dim7_idx = [], old_RGB = 0, slice_idx = [] )
{
    if ( !hdr || !filetype || !fileprefix || !machine || !data )
    {
        throw 'Usage: [img,hdr] = load_untouch_nii_img(hdr, filetype, fileprefix, machine, data [img_idx], [dim5_idx], [dim6_idx], [dim7_idx], [old_RGB], [slice_idx]);';
    }

    check_argin(img_idx, hdr);
    check_argin(dim5_idx, hdr);
    check_argin(dim6_idx, hdr);
    check_argin(dim7_idx, hdr);
    check_argin(slice_idx, hdr);

    return load_untouch_nii_img_read_image(hdr, filetype, fileprefix, machine, img_idx, dim5_idx, dim6_idx, dim7_idx, old_RGB, slice_idx, data);
}

function check_argin ( input, hdr )
{
    let name = Object.keys({input})[0]
    if ( input.length != 0 && !isnumeric(input) )
    {
        throw `"${name}" should be a numerical array.`;
    }

    if ( unique(input).length != input.length )
    {
        throw `Duplicate image index in "${name}"`;
    }

    let max_range;
    if ( input.length != 0 && ( Math.min(...input) < 1 || Math.max(...input) > hdr.dime.dim[4] ) )
    {
        max_range = hdr.dime.dim[4];

        if ( max_range == 1 )
        {
            throw `"${name}" should be 1.`;
        }
        else
        {
            throw `"${name}" should be an integer within the range of [1 ~ ${max_range}].`;
        }
    }
}

function load_untouch_nii_img_read_image ( hdr, filetype, fileprefix, machine,
                      img_idx, dim5_idx, dim6_idx,
                      dim7_idx, old_RGB, slice_idx, data )
{
    let img;

    const fid = new FILE('', machine);
    fid.fopen(data);

    //  Set bitpix according to datatype
    //
    //  /*Acceptable values for datatype are*/
    //
    //     0 None                     (Unknown bit per voxel) % DT_NONE, DT_UNKNOWN
    //     1 Binary                         (ubit1, bitpix=1) % DT_BINARY
    //     2 Unsigned char         (uchar or uint8, bitpix=8) % DT_UINT8, NIFTI_TYPE_UINT8
    //     4 Signed short                  (int16, bitpix=16) % DT_INT16, NIFTI_TYPE_INT16
    //     8 Signed integer                (int32, bitpix=32) % DT_INT32, NIFTI_TYPE_INT32
    //    16 Floating point    (single or float32, bitpix=32) % DT_FLOAT32, NIFTI_TYPE_FLOAT32
    //    32 Complex, 2 float32      (Use float32, bitpix=64) % DT_COMPLEX64, NIFTI_TYPE_COMPLEX64
    //    64 Double precision  (double or float64, bitpix=64) % DT_FLOAT64, NIFTI_TYPE_FLOAT64
    //   128 uint8 RGB                 (Use uint8, bitpix=24) % DT_RGB24, NIFTI_TYPE_RGB24
    //   256 Signed char            (schar or int8, bitpix=8) % DT_INT8, NIFTI_TYPE_INT8
    //   511 Single RGB              (Use float32, bitpix=96) % DT_RGB96, NIFTI_TYPE_RGB96
    //   512 Unsigned short               (uint16, bitpix=16) % DT_UNINT16, NIFTI_TYPE_UNINT16
    //   768 Unsigned integer             (uint32, bitpix=32) % DT_UNINT32, NIFTI_TYPE_UNINT32
    //  1024 Signed long long              (int64, bitpix=64) % DT_INT64, NIFTI_TYPE_INT64
    //  1280 Unsigned long long           (uint64, bitpix=64) % DT_UINT64, NIFTI_TYPE_UINT64
    //  1536 Long double, float128  (Unsupported, bitpix=128) % DT_FLOAT128, NIFTI_TYPE_FLOAT128
    //  1792 Complex128, 2 float64  (Use float64, bitpix=128) % DT_COMPLEX128, NIFTI_TYPE_COMPLEX128
    //  2048 Complex256, 2 float128 (Unsupported, bitpix=256) % DT_COMPLEX128, NIFTI_TYPE_COMPLEX128
    let precision;
    switch ( hdr.dime.datatype ) {
        case    2:
            hdr.dime.bitpix = 8;  precision = 'uint8';
            break;
        case    4:
            hdr.dime.bitpix = 16; precision = 'int16';
            break;
        case    8:
            hdr.dime.bitpix = 32; precision = 'int32';
            break;
        case   16:
            hdr.dime.bitpix = 32; precision = 'float32';
            break;
        case   32:
            hdr.dime.bitpix = 64; precision = 'float32';
            break;
        case   64:
            hdr.dime.bitpix = 64; precision = 'float64';
            break;
        case  128:
            hdr.dime.bitpix = 24; precision = 'uint8';
            break;
        case  256:
            hdr.dime.bitpix = 8;  precision = 'int8';
            break;
        case  511:
            hdr.dime.bitpix = 96; precision = 'float32';
            break;
        case  512:
            hdr.dime.bitpix = 16; precision = 'uint16';
            break;
        case  768:
            hdr.dime.bitpix = 32; precision = 'uint32';
            break;
        case 1024:
            hdr.dime.bitpix = 64; precision = 'int64';
            break;
        case 1280:
            hdr.dime.bitpix = 64; precision = 'uint64';
            break;
        case 1792:
            hdr.dime.bitpix = 128; precision = 'float64';
            break;
        default:
            throw 'This datatype is not supported';
    }

    for (let index = 1; index < hdr.dime.dim.length; ++index) {
        if ( hdr.dime.dim[index] < 1 )
        {
            hdr.dime.dim[index] = 1;
        }
    }

    //  move pointer to the start of image block
    switch ( filetype )
    {
        case 0:
        case 1:
            fid.fseek(0, 'bof');
            break;
        case 2:
            fid.fseek(hdr.dime.vox_offset, 'bof');
            break;
    }

    //  Load whole image block for old Analyze format or binary image;
    //  otherwise, load images that are specified in img_idx, dim5_idx,
    //  dim6_idx, and dim7_idx
    //
    //  For binary image, we have to read all because pos can not be
    //  seeked in bit and can not be calculated the way below.
    let img_siz;
    if ( hdr.dime.datatype == 1 ||
        isequal(hdr.dime.dim.slice(3, 7), [1,1,1,1,1]) ||
        (
            img_idx.length == 0 &&
            dim5_idx.length == 0 &&
            dim6_idx.length == 0 &&
            dim7_idx.length == 0 &&
            slice_idx.length == 0
        )
    )
    {
        //  For each frame, precision of value will be read
        //  in img_siz times, where img_siz is only the
        //  dimension size of an image, not the byte storage
        //  size of an image.
        img_siz = prod(hdr.dime.dim.slice(1,7));

        //  For complex float32 or complex float64, voxel values
        //  include [real, imag]
        if ( hdr.dime.datatype == 32 || hdr.dime.datatype == 1792 )
        {
            img_siz = img_siz * 2;
        }

        // MPH: For RGB24, voxel values include 3 separate color planes
        if ( hdr.dime.datatype == 128 || hdr.dime.datatype == 511 )
        {
            img_siz = img_siz * 3;
        }

        img = fid.fread(img_siz, precision);

        let d3 = hdr.dime.dim[3];
        let d4 = hdr.dime.dim[4];
        let d5 = hdr.dime.dim[5];
        let d6 = hdr.dime.dim[6];
        let d7 = hdr.dime.dim[7];

        if ( slice_idx.length == 0 )
            slice_idx = Array.from(Array(d3).keys());

        if ( img_idx.length == 0 )
            img_idx = Array.from(Array(d4).keys());

        if ( dim5_idx.length == 0 )
            dim5_idx = Array.from(Array(d5).keys());

        if ( dim6_idx.length == 0 )
            dim6_idx = Array.from(Array(d6).keys());

        if ( dim7_idx.length == 0 )
            dim7_idx = Array.from(Array(d7).keys());
    }
    else
    {
        let d1 = hdr.dime.dim[1];
        let d2 = hdr.dime.dim[2];
        let d3 = hdr.dime.dim[3];
        let d4 = hdr.dime.dim[4];
        let d5 = hdr.dime.dim[5];
        let d6 = hdr.dime.dim[6];
        let d7 = hdr.dime.dim[7];

        if ( slice_idx.length == 0 )
            slice_idx = Array.from(Array(d3).keys());

        if ( img_idx.length == 0 )
            img_idx = Array.from(Array(d4).keys());

        if ( dim5_idx.length == 0 )
            dim5_idx = Array.from(Array(d5).keys());

        if ( dim6_idx.length == 0 )
            dim6_idx = Array.from(Array(d6).keys());

        if ( dim7_idx.length == 0 )
            dim7_idx = Array.from(Array(d7).keys());

        // ROMAN: begin
        let roman = 1;
        let currentIndex;
        img = [];
        if ( roman )
        {
            //  compute size of one slice
            img_siz = hdr.dime.dim[1] * hdr.dime.dim[2];

            //  For complex float32 or complex float64, voxel values
            //  include [real, imag]
            if ( hdr.dime.datatype == 32 | hdr.dime.datatype == 1792 )
            {
                img_siz = img_siz * 2;
            }

            //MPH: For RGB24, voxel values include 3 separate color planes
            if ( hdr.dime.datatype == 128 | hdr.dime.datatype == 511 )
            {
                img_siz = img_siz * 3;
            }

            currentIndex = 0;
        } // if(roman)
        // ROMAN: end

        for ( let i7 = 0; i7 < dim7_idx.length; i7++ )
        {
            for ( let i6 = 0; i6 < dim6_idx.length; i6++ )
            {
                for ( let i5 = 0; i5 < dim5_idx.length; i5++ )
                {
                    for ( let t = 0; t < img_idx.length; t++ )
                    {
                        for ( let s = 0; s < slice_idx.length; s++ )
                        {
                            //  Position is seeked in bytes. To convert dimension size
                            //  to byte storage size, hdr.dime.bitpix/8 will be
                            //  applied.

                            let pos = sub2ind([d1, d2, d3, d4, d5, d6, d7], 1, 1,
                                              slice_idx[s], img_idx[t],
                                              dim5_idx[i5], dim6_idx[i6], dim7_idx[i7]);

                            pos = pos * hdr.dime.bitpix / 8.0;

                            // ROMAN: begin
                            if ( roman )
                            {
                                // do nothing
                            }
                            else
                            {
                                img_siz = hdr.dime.dim[1] * hdr.dime.dim[2];

                                //  For complex float32 or complex float64, voxel values
                                //  include [real, imag]
                                if ( hdr.dime.datatype == 32 || hdr.dime.datatype == 1792 )
                                {
                                    img_siz = img_siz * 2;
                                }

                                // MPH: For RGB24, voxel values include 3 separate color planes
                                if ( hdr.dime.datatype == 128 || hdr.dime.datatype == 511 )
                                {
                                    img_siz = img_siz * 3;
                                }
                            } // if (roman)
                            // ROMAN: end
                            if ( filetype == 2 )
                            {
                                fid.fseek(pos + hdr.dime.vox_offset, 'bof');
                            }
                            else
                            {
                                fid.fseek(pos, 'bof');
                            }

                            //  For each frame, fread will read precision of value
                            //  in img_siz times
                            //
                            // ROMAN: begin
                            if ( roman )
                            {
                                img[currentIndex] = fid.fread(img_siz, precision);
                                currentIndex = currentIndex + 1;
                            }
                            else
                            {
                                img.push(fid.fread(img_siz, precision));
                            } //if(roman)
                            // ROMAN: end
                        }
                    }
                }
            }
        }
    }

    //  For complex float32 or complex float64, voxel values
    //  include [real, imag]
    if ( hdr.dime.datatype == 32 || hdr.dime.datatype == 1792 )
    {
        console.log("max: " + hdr.dime.glmax);
        console.log("min: " + hdr.dime.glmin);
        img.flat(Infinity);
        img_tmp = reshape(img, [2, img.length/2]);
        img = {};
        img.real = img_tmp[0];
        img.complex = img_tmp[1];

        //  Update the global min and max values
        hdr.dime.glmax.complex = img.complex[0];
        hdr.dime.glmax.real = img.real[0];

        hdr.dime.glmin.complex = img.complex[0];
        hdr.dime.glmin.real = img.real[0];

        for ( let i = 1; i < img.real.length; i++ )
        {
            if ( Math.hypot(hdr.dime.glmax.complex, hdr.dime.glmax.real) < Math.hypot(img.complex[i], img.real[i]) )
            {
                hdr.dime.glmax.complex = img.complex[i];
                hdr.dime.glmax.real = img.real[i];
            }
            else if ( Math.hypot(hdr.dime.glmin.complex, hdr.dime.glmin.real) > Math.hypot(img.complex[i], img.real[i]) )
            {
                hdr.dime.glmin.complex = img.complex[i];
                hdr.dime.glmin.real = img.real[i];
            }
            else if ( Math.hypot(hdr.dime.glmax.complex, hdr.dime.glmax.real) == Math.hypot(img.complex[i], img.real[i]) )
            {
                if ( Math.atan2(hdr.dime.glmax.complex, hdr.dime.glmax.real) < Math.atan2(img.complex[i], img.real[i]) )
                {
                    hdr.dime.glmax.complex = img.complex[i];
                    hdr.dime.glmax.real = img.real[i];
                }
            }
            else if ( Math.hypot(hdr.dime.glmin.complex, hdr.dime.glmin.real) == Math.hypot(img.complex[i], img.real[i]) )
            {
                if ( Math.atan2(hdr.dime.glmin.complex, hdr.dime.glmin.real) > Math.atan2(img.complex[i], img.real[i]) )
                {
                    hdr.dime.glmin.complex = img.complex[i];
                    hdr.dime.glmin.real = img.real[i];
                }
            }
        }
    }
    else
    {
        //  Update the global min and max values
        let img_tmp = img;
        img_tmp.flat(Infinity);
        for (let item of img_tmp) {
            if ( hdr.dime.glmax < item ) {
                hdr.dime.glmax = item;
            }

            if ( hdr.dime.glmin > item ) {
                hdr.dime.glmin = item;
            }
        }
    }

    fid.fclose();

    //  old_RGB treat RGB slice by slice, now it is treated voxel by voxel
    if ( old_RGB && hdr.dime.datatype == 128 && hdr.dime.bitpix == 24 )
    {
        // remove squeeze
        img = reshape(img, [hdr.dime.dim[1], hdr.dime.dim[2], 3, slice_idx.length, img_idx.length, dim5_idx.length, dim6_idx.length, dim7_idx.length]);
        img = permute(img, 0, 1, 3, 2, 4, 5, 6, 7);
    }
    else if (hdr.dime.datatype == 128 && hdr.dime.bitpix == 24)
    {
        // remove squeeze
        img = reshape(img, [3, hdr.dime.dim[1], hdr.dime.dim[2], slice_idx.length, img_idx.length, dim5_idx.length, dim6_idx.length, dim7_idx.length]);
        img = permute(img, 1, 2, 3, 0, 4, 5, 6, 7);
    }
    else if (hdr.dime.datatype == 511 && hdr.dime.bitpix == 96)
    {
        img = single((img - min(img))/(max(img) - min(img)));
        for ( let col = 0; col < img.length; col++ )
        {
            for ( let row = 0; row < img[0].length; row++ )
            {
                img[col][row] = (img[col][row] - hdr.dime.glmin) / (hdr.dime.glmax - hdr.dime.glmin);
            }
        }

        // remove squeeze
        img = reshape(img, [3, hdr.dime.dim[1], hdr.dime.dim[2], slice_idx.length, img_idx.length, dim5_idx.length, dim6_idx.length, dim7_idx.length]);
        img = permute(img, 1, 2, 3, 0, 4, 5, 6, 7);
    }
    else
    {
        // remove squeeze
        img = reshape(img, [hdr.dime.dim[1], hdr.dime.dim[2], slice_idx.length, img_idx.length, dim5_idx.length, dim6_idx.length, dim7_idx.length]);
    }

    if ( slice_idx.length != 0 )
        hdr.dime.dim[3] = slice_idx.length;

    if ( img_idx.length != 0 )
        hdr.dime.dim[4] = img_idx.length;

    if ( dim5_idx.length != 0 )
        hdr.dime.dim[5] = dim5_idx.length;

    if ( dim6_idx.length != 0 )
        hdr.dime.dim[6] = dim6_idx.length;

    if ( dim7_idx.length != 0 )
        hdr.dime.dim[7] = dim7_idx.length;

    while (img.length == 1)
    {
        img = img[0];
    }

    return [img, hdr];
}

function load_untouch_nii_hdr ( fileprefix, machine, filetype, data ) {

    let filename;
    if ( filetype === 2 ) {
        filename = fileprefix + ".nii";
    } else {
        filename = fileprefix + ".hdr";
    }

    const fid = new FILE('', machine);
    fid.fopen(data);
    fid.frewind();

    let hdr = load_untouch_nii_hdr_read_header(fid);

    return hdr
}

function load_untouch_nii_hdr_read_header ( fid ) {
    let dsr = {};

    dsr.hk   = load_untouch_nii_hdr_header_key(fid);
    dsr.dime = load_untouch_nii_hdr_image_dimension(fid);
    dsr.hist = load_untouch_nii_hdr_data_history(fid);

    if ( !dsr.hist.magic === 'n+1' && !dsr.hist.magic === 'ni1' ) {
        dsr.hist.qform_code = 0;
        dsr.hist.sform_code = 0;
    }

    return dsr;
}

function load_untouch_nii_hdr_header_key ( fid ) {
    fid.frewind();

    //  Original header structures
    //  struct header_key                     /* header key      */
    //       {                                /* off + size      */
    //       int sizeof_hdr                   /*  0 +  4         */
    //       char data_type[10];              /*  4 + 10         */
    //       char db_name[18];                /* 14 + 18         */
    //       int extents;                     /* 32 +  4         */
    //       short int session_error;         /* 36 +  2         */
    //       char regular;                    /* 38 +  1         */
    //       char dim_info;   % char hkey_un0;        /* 39 +  1 */
    //       };                               /* total=40 bytes  */
    //
    // int sizeof_header   Should be 348.
    // char regular        Must be 'r' to indicate that all images and
    //                     volumes are the same size.

    const hk = {};

    hk.sizeof_hdr    = fid.fread( 1,  'int32');   // should be 348!
    hk.data_type     = fid.fread(10, 'string');
    hk.db_name       = fid.fread(18, 'string');
    hk.extents       = fid.fread( 1,  'int32');
    hk.session_error = fid.fread( 1,  'int16');
    hk.regular       = fid.fread( 1, 'string');
    hk.dim_info      = fid.fread( 1,  'uchar');

    return hk;
}

function load_untouch_nii_hdr_image_dimension ( fid ) {
    //  Original header structures
    //  struct image_dimension
    //       {                                /* off + size      */
    //       short int dim[8];                /* 0 + 16          */
    //       /*
    //           dim[0]      Number of dimensions in database; usually 4.
    //           dim[1]      Image X dimension;  number of *pixels* in an image row.
    //           dim[2]      Image Y dimension;  number of *pixel rows* in slice.
    //           dim[3]      Volume Z dimension; number of *slices* in a volume.
    //           dim[4]      Time points; number of volumes in database
    //       */
    //       float intent_p1;   % char vox_units[4];   /* 16 + 4       */
    //       float intent_p2;   % char cal_units[8];   /* 20 + 4       */
    //       float intent_p3;   % char cal_units[8];   /* 24 + 4       */
    //       short int intent_code;   % short int unused1;   /* 28 + 2 */
    //       short int datatype;              /* 30 + 2          */
    //       short int bitpix;                /* 32 + 2          */
    //       short int slice_start;   % short int dim_un0;   /* 34 + 2 */
    //       float pixdim[8];                 /* 36 + 32         */
    //       /*
    //           pixdim[] specifies the voxel dimensions:
    //           pixdim[1] - voxel width, mm
    //           pixdim[2] - voxel height, mm
    //           pixdim[3] - slice thickness, mm
    //           pixdim[4] - volume timing, in msec
    //                       ..etc
    //       */
    //       float vox_offset;                /* 68 + 4          */
    //       float scl_slope;   % float roi_scale;     /* 72 + 4 */
    //       float scl_inter;   % float funused1;      /* 76 + 4 */
    //       short slice_end;   % float funused2;      /* 80 + 2 */
    //       char slice_code;   % float funused2;      /* 82 + 1 */
    //       char xyzt_units;   % float funused2;      /* 83 + 1 */
    //       float cal_max;                   /* 84 + 4          */
    //       float cal_min;                   /* 88 + 4          */
    //       float slice_duration;   % int compressed; /* 92 + 4 */
    //       float toffset;   % int verified;          /* 96 + 4 */
    //       int glmax;                       /* 100 + 4         */
    //       int glmin;                       /* 104 + 4         */
    //       };                               /* total=108 bytes */

    const dime = {};

    dime.dim            = fid.fread(8,   'int16');
    dime.intent_p1      = fid.fread(1, 'float32');
    dime.intent_p2      = fid.fread(1, 'float32');
    dime.intent_p3      = fid.fread(1, 'float32');
    dime.intent_code    = fid.fread(1,   'int16');
    dime.datatype       = fid.fread(1,   'int16');
    dime.bitpix         = fid.fread(1,   'int16');
    dime.slice_start    = fid.fread(1,   'int16');
    dime.pixdim         = fid.fread(8, 'float32');
    dime.vox_offset     = fid.fread(1, 'float32');
    dime.scl_slope      = fid.fread(1, 'float32');
    dime.scl_inter      = fid.fread(1, 'float32');
    dime.slice_end      = fid.fread(1,   'int16');
    dime.slice_code     = fid.fread(1,   'uchar');
    dime.xyzt_units     = fid.fread(1,   'uchar');
    dime.cal_max        = fid.fread(1, 'float32');
    dime.cal_min        = fid.fread(1, 'float32');
    dime.slice_duration = fid.fread(1, 'float32');
    dime.toffset        = fid.fread(1, 'float32');
    dime.glmax          = fid.fread(1,   'int32');
    dime.glmin          = fid.fread(1,   'int32');

    return dime;
}

function load_untouch_nii_hdr_data_history ( fid ) {
    //  Original header structures
    //  struct data_history
    //       {                                /* off + size      */
    //       char descrip[80];                /* 0 + 80          */
    //       char aux_file[24];               /* 80 + 24         */
    //       short int qform_code;            /* 104 + 2         */
    //       short int sform_code;            /* 106 + 2         */
    //       float quatern_b;                 /* 108 + 4         */
    //       float quatern_c;                 /* 112 + 4         */
    //       float quatern_d;                 /* 116 + 4         */
    //       float qoffset_x;                 /* 120 + 4         */
    //       float qoffset_y;                 /* 124 + 4         */
    //       float qoffset_z;                 /* 128 + 4         */
    //       float srow_x[4];                 /* 132 + 16        */
    //       float srow_y[4];                 /* 148 + 16        */
    //       float srow_z[4];                 /* 164 + 16        */
    //       char intent_name[16];            /* 180 + 16        */
    //       char magic[4];   % int smin;     /* 196 + 4         */
    //       };                               /* total=200 bytes */

    const hist = {};

    hist.descrip     = fid.fread(80,  'string');
    hist.aux_file    = fid.fread(24,  'string');
    hist.qform_code  = fid.fread( 1,   'int16');
    hist.sform_code  = fid.fread( 1,   'int16');
    hist.quatern_b   = fid.fread( 1, 'float32');
    hist.quatern_c   = fid.fread( 1, 'float32');
    hist.quatern_d   = fid.fread( 1, 'float32');
    hist.qoffset_x   = fid.fread( 1, 'float32');
    hist.qoffset_y   = fid.fread( 1, 'float32');
    hist.qoffset_z   = fid.fread( 1, 'float32');
    hist.srow_x      = fid.fread( 4, 'float32');
    hist.srow_y      = fid.fread( 4, 'float32');
    hist.srow_z      = fid.fread( 4, 'float32');
    hist.intent_name = fid.fread(16,  'string');
    hist.magic       = fid.fread( 4,  'string');

    return hist;
}

function load_untouch0_nii_hdr ( fileprefix, machine, data )
{
    const fid = new FILE('', machine);
    fid.fopen(data);

    fid.frewind();
    let hdr = load_untouch0_nii_hdr_read_header(fid, false);

    return hdr;
}

function load_untouch0_nii_hdr_read_header ( fid ) {
    let dsr = {};

    dsr.hk   = load_untouch0_nii_hdr_header_key(fid);
    dsr.dime = load_untouch0_nii_hdr_image_dimension(fid);
    dsr.hist = load_untouch0_nii_hdr_data_history(fid);

    return dsr;
}

function load_untouch0_nii_hdr_header_key ( fid ) {
    fid.frewind();

    //  Original header structures
    //  struct header_key                     /* header key      */
    //       {                                /* off + size      */
    //       int sizeof_hdr                   /*  0 +  4         */
    //       char data_type[10];              /*  4 + 10         */
    //       char db_name[18];                /* 14 + 18         */
    //       int extents;                     /* 32 +  4         */
    //       short int session_error;         /* 36 +  2         */
    //       char regular;                    /* 38 +  1         */
    //       char hkey_un0;                   /* 39 +  1         */
    //       };                               /* total=40 bytes  */
    //
    // int sizeof_header   Should be 348.
    // char regular        Must be 'r' to indicate that all images and
    //                     volumes are the same size.

    const hk = {};

    hk.sizeof_hdr    = fid.fread( 1,  'int32');   // should be 348!
    hk.data_type     = fid.fread(10, 'string');
    hk.db_name       = fid.fread(18, 'string');
    hk.extents       = fid.fread( 1,  'int32');
    hk.session_error = fid.fread( 1,  'int16');
    hk.regular       = fid.fread( 1, 'string');
    hk.hkey_un0      = fid.fread( 1,  'uchar');

    return hk;
}

function load_untouch0_nii_hdr_image_dimension ( fid ) {

    //  struct image_dimension
    //       {                                /* off + size      */
    //       short int dim[8];                /* 0 + 16          */
    //       /*
    //           dim[0]      Number of dimensions in database; usually 4.
    //           dim[1]      Image X dimension;  number of *pixels* in an image row.
    //           dim[2]      Image Y dimension;  number of *pixel rows* in slice.
    //           dim[3]      Volume Z dimension; number of *slices* in a volume.
    //           dim[4]      Time points; number of volumes in database
    //       */
    //       char vox_units[4];               /* 16 + 4          */
    //       char cal_units[8];               /* 20 + 8          */
    //       short int unused1;               /* 28 + 2          */
    //       short int datatype;              /* 30 + 2          */
    //       short int bitpix;                /* 32 + 2          */
    //       short int dim_un0;               /* 34 + 2          */
    //       float pixdim[8];                 /* 36 + 32         */
    //       /*
    //           pixdim[] specifies the voxel dimensions:
    //           pixdim[1] - voxel width, mm
    //           pixdim[2] - voxel height, mm
    //           pixdim[3] - slice thickness, mm
    //           pixdim[4] - volume timing, in msec
    //                       ..etc
    //       */
    //       float vox_offset;                /* 68 + 4          */
    //       float roi_scale;                 /* 72 + 4          */
    //       float funused1;                  /* 76 + 4          */
    //       float funused2;                  /* 80 + 4          */
    //       float cal_max;                   /* 84 + 4          */
    //       float cal_min;                   /* 88 + 4          */
    //       int compressed;                  /* 92 + 4          */
    //       int verified;                    /* 96 + 4          */
    //       int glmax;                       /* 100 + 4         */
    //       int glmin;                       /* 104 + 4         */
    //       };                               /* total=108 bytes */

    const dime = {};

    dime.dim        = fid.fread(8,   'int16');
    dime.vox_units  = fid.fread(4,  'string');
    dime.cal_units  = fid.fread(8,  'string');
    dime.unused1    = fid.fread(1,   'int16');
    dime.datatype   = fid.fread(1,   'int16');
    dime.bitpix     = fid.fread(1,   'int16');
    dime.dim_un0    = fid.fread(1,   'int16');
    dime.pixdim     = fid.fread(8, 'float32');
    dime.vox_offset = fid.fread(1, 'float32');
    dime.roi_scale  = fid.fread(1, 'float32');
    dime.funused1   = fid.fread(1, 'float32');
    dime.funused2   = fid.fread(1, 'float32');
    dime.cal_max    = fid.fread(1, 'float32');
    dime.cal_min    = fid.fread(1, 'float32');
    dime.compressed = fid.fread(1,   'int32');
    dime.verified   = fid.fread(1,   'int32');
    dime.glmax      = fid.fread(1,   'int32');
    dime.glmin      = fid.fread(1,   'int32');

    return dime;
}

function load_untouch0_nii_hdr_data_history ( fid ) {

    // struct data_history
    //        {                                /* off + size      */
    //        char descrip[80];                /* 0 + 80          */
    //        char aux_file[24];               /* 80 + 24         */
    //        char orient;                     /* 104 + 1         */
    //        char originator[10];             /* 105 + 10        */
    //        char generated[10];              /* 115 + 10        */
    //        char scannum[10];                /* 125 + 10        */
    //        char patient_id[10];             /* 135 + 10        */
    //        char exp_date[10];               /* 145 + 10        */
    //        char exp_time[10];               /* 155 + 10        */
    //        char hist_un0[3];                /* 165 + 3         */
    //        int views                        /* 168 + 4         */
    //        int vols_added;                  /* 172 + 4         */
    //        int start_field;                 /* 176 + 4         */
    //        int field_skip;                  /* 180 + 4         */
    //        int omax;                        /* 184 + 4         */
    //        int omin;                        /* 188 + 4         */
    //        int smax;                        /* 192 + 4         */
    //        int smin;                        /* 196 + 4         */
    //        };                               /* total=200 bytes */

    const hist = {};

    hist.descrip     = fid.fread(80, 'string');
    hist.aux_file    = fid.fread(24, 'string');
    hist.orient      = fid.fread( 1,   'char');
    hist.originator  = fid.fread( 5,  'int16');
    hist.generated   = fid.fread(10, 'string');
    hist.scannum     = fid.fread(10, 'string');
    hist.patient_id  = fid.fread(10, 'string');
    hist.exp_date    = fid.fread(10, 'string');
    hist.exp_time    = fid.fread(10, 'string');
    hist.hist_un0    = fid.fread( 3, 'string');
    hist.views       = fid.fread( 1,  'int32');
    hist.vols_added  = fid.fread( 1,  'int32');
    hist.start_field = fid.fread( 1,  'int32');
    hist.field_skip  = fid.fread( 1,  'int32');
    hist.omax        = fid.fread( 1,  'int32');
    hist.omin        = fid.fread( 1,  'int32');
    hist.smax        = fid.fread( 1,  'int32');
    hist.smin        = fid.fread( 1,  'int32');

    return hist;
}

function load_nii_hdr ( filename, data ) {
    if ( !filename ) {
        throw 'Usage: [hdr, filetype, fileprefix, machine] = load_nii_hdr(filename)';
    }

    let machine = 'ieee-le';
    let fileprefix;

    if ( filename.substr( filename.length - 4 ) === '.nii' ) {
        fileprefix = filename.slice(0, -4);
    } else if ( filename.substr( filename.length - 4 ) === '.hdr' ) {
        fileprefix = filename.slice(0, -4);
    } else if ( filename.substr( filename.length - 4 ) === '.img' ) {
        fileprefix = filename.slice(0, -4);
    } else {
        throw 'Supported extension type : .nii .hdr .img';
    }


    const fid = new FILE('', machine);
    fid.fopen(data);
    fid.frewind();

    let hdr;
    if ( fid.fread(1, 'int32') === 348 ) {
        hdr = load_nii_hdr_read_header(fid);
    } else {
        // If magic number is different, try reading the opposite endian
        machine = 'ieee-be';
        fid.littleEndian = false;

        fid.frewind();
        if ( fid.fread(1, 'int32') !== 348 ) {
            throw 'File ${filename} is corrupted.'
        }
        hdr = load_nii_hdr_read_header(fid);
    }

    let filetype = 0;
    if ( hdr.hist.magic === 'n+1' ) {
        filetype = 2;
    } else if ( hdr.hist.magic === 'ni1' ) {
        filetype = 1;
    }

    fid.fclose();
    return [hdr, filetype, fileprefix, machine]
}

function load_nii_hdr_read_header ( fid ) {
    let dsr = {};

    dsr.hk   = load_nii_hdr_header_key(fid);
    dsr.dime = load_nii_hdr_image_dimension(fid);
    dsr.hist = load_nii_hdr_data_history(fid);

    if ( !dsr.hist.magic === 'n+1' && !dsr.hist.magic === 'ni1' ) {
        dsr.hist.qform_code = 0;
        dsr.hist.sform_code = 0;
    }

    return dsr;
}

function load_nii_hdr_header_key ( fid ) {
    fid.frewind();

    //  Original header structures
    //  struct header_key                     /* header key      */
    //       {                                /* off + size      */
    //       int sizeof_hdr                   /*  0 +  4         */
    //       char data_type[10];              /*  4 + 10         */
    //       char db_name[18];                /* 14 + 18         */
    //       int extents;                     /* 32 +  4         */
    //       short int session_error;         /* 36 +  2         */
    //       char regular;                    /* 38 +  1         */
    //       char dim_info;   % char hkey_un0;        /* 39 +  1 */
    //       };                               /* total=40 bytes  */
    //
    // int sizeof_header   Should be 348.
    // char regular        Must be 'r' to indicate that all images and
    //                     volumes are the same size.

    const hk = {};

    hk.sizeof_hdr    = fid.fread( 1,  'int32');   // should be 348!
    hk.data_type     = fid.fread(10, 'string');
    hk.db_name       = fid.fread(18, 'string');
    hk.extents       = fid.fread( 1,  'int32');
    hk.session_error = fid.fread( 1,  'int16');
    hk.regular       = fid.fread( 1, 'string');
    hk.dim_info      = fid.fread( 1,  'uchar');

    return hk;
}

function load_nii_hdr_image_dimension ( fid ) {
    //  Original header structures
    //  struct image_dimension
    //       {                                /* off + size      */
    //       short int dim[8];                /* 0 + 16          */
    //       /*
    //           dim[0]      Number of dimensions in database; usually 4.
    //           dim[1]      Image X dimension;  number of *pixels* in an image row.
    //           dim[2]      Image Y dimension;  number of *pixel rows* in slice.
    //           dim[3]      Volume Z dimension; number of *slices* in a volume.
    //           dim[4]      Time points; number of volumes in database
    //       */
    //       float intent_p1;   % char vox_units[4];   /* 16 + 4       */
    //       float intent_p2;   % char cal_units[8];   /* 20 + 4       */
    //       float intent_p3;   % char cal_units[8];   /* 24 + 4       */
    //       short int intent_code;   % short int unused1;   /* 28 + 2 */
    //       short int datatype;              /* 30 + 2          */
    //       short int bitpix;                /* 32 + 2          */
    //       short int slice_start;   % short int dim_un0;   /* 34 + 2 */
    //       float pixdim[8];                 /* 36 + 32         */
    //       /*
    //           pixdim[] specifies the voxel dimensions:
    //           pixdim[1] - voxel width, mm
    //           pixdim[2] - voxel height, mm
    //           pixdim[3] - slice thickness, mm
    //           pixdim[4] - volume timing, in msec
    //                       ..etc
    //       */
    //       float vox_offset;                /* 68 + 4          */
    //       float scl_slope;   % float roi_scale;     /* 72 + 4 */
    //       float scl_inter;   % float funused1;      /* 76 + 4 */
    //       short slice_end;   % float funused2;      /* 80 + 2 */
    //       char slice_code;   % float funused2;      /* 82 + 1 */
    //       char xyzt_units;   % float funused2;      /* 83 + 1 */
    //       float cal_max;                   /* 84 + 4          */
    //       float cal_min;                   /* 88 + 4          */
    //       float slice_duration;   % int compressed; /* 92 + 4 */
    //       float toffset;   % int verified;          /* 96 + 4 */
    //       int glmax;                       /* 100 + 4         */
    //       int glmin;                       /* 104 + 4         */
    //       };                               /* total=108 bytes */

    const dime = {};

    dime.dim            = fid.fread(8,   'int16');
    dime.intent_p1      = fid.fread(1, 'float32');
    dime.intent_p2      = fid.fread(1, 'float32');
    dime.intent_p3      = fid.fread(1, 'float32');
    dime.intent_code    = fid.fread(1,   'int16');
    dime.datatype       = fid.fread(1,   'int16');
    dime.bitpix         = fid.fread(1,   'int16');
    dime.slice_start    = fid.fread(1,   'int16');
    dime.pixdim         = fid.fread(8, 'float32');
    dime.vox_offset     = fid.fread(1, 'float32');
    dime.scl_slope      = fid.fread(1, 'float32');
    dime.scl_inter      = fid.fread(1, 'float32');
    dime.slice_end      = fid.fread(1,   'int16');
    dime.slice_code     = fid.fread(1,   'uchar');
    dime.xyzt_units     = fid.fread(1,   'uchar');
    dime.cal_max        = fid.fread(1, 'float32');
    dime.cal_min        = fid.fread(1, 'float32');
    dime.slice_duration = fid.fread(1, 'float32');
    dime.toffset        = fid.fread(1, 'float32');
    dime.glmax          = fid.fread(1,   'int32');
    dime.glmin          = fid.fread(1,   'int32');

    return dime;
}

function load_nii_hdr_data_history ( fid ) {
    //  Original header structures
    //  struct data_history
    //       {                                /* off + size      */
    //       char descrip[80];                /* 0 + 80          */
    //       char aux_file[24];               /* 80 + 24         */
    //       short int qform_code;            /* 104 + 2         */
    //       short int sform_code;            /* 106 + 2         */
    //       float quatern_b;                 /* 108 + 4         */
    //       float quatern_c;                 /* 112 + 4         */
    //       float quatern_d;                 /* 116 + 4         */
    //       float qoffset_x;                 /* 120 + 4         */
    //       float qoffset_y;                 /* 124 + 4         */
    //       float qoffset_z;                 /* 128 + 4         */
    //       float srow_x[4];                 /* 132 + 16        */
    //       float srow_y[4];                 /* 148 + 16        */
    //       float srow_z[4];                 /* 164 + 16        */
    //       char intent_name[16];            /* 180 + 16        */
    //       char magic[4];   % int smin;     /* 196 + 4         */
    //       };                               /* total=200 bytes */

    const hist = {};

    hist.descrip     = fid.fread(80,  'string');
    hist.aux_file    = fid.fread(24,  'string');
    hist.qform_code  = fid.fread( 1,   'int16');
    hist.sform_code  = fid.fread( 1,   'int16');
    hist.quatern_b   = fid.fread( 1, 'float32');
    hist.quatern_c   = fid.fread( 1, 'float32');
    hist.quatern_d   = fid.fread( 1, 'float32');
    hist.qoffset_x   = fid.fread( 1, 'float32');
    hist.qoffset_y   = fid.fread( 1, 'float32');
    hist.qoffset_z   = fid.fread( 1, 'float32');
    hist.srow_x      = fid.fread( 4, 'float32');
    hist.srow_y      = fid.fread( 4, 'float32');
    hist.srow_z      = fid.fread( 4, 'float32');
    hist.intent_name = fid.fread(16,  'string');
    hist.magic       = fid.fread( 4,  'string');

    fid.fseek(253, 'bof');
    hist.originator = fid.fread(5, 'int16');

    return hist;
}

function load_nii_ext ( filename, data )
{
    if ( !filename )
    {
        throw 'Usage: ext = load_nii_ext(filename, data)'
    }

    let machine = 'ieee-le';
    let extension = filename.substr( filename.length - 4 );

    if ( extension !== '.nii' && extension !== '.hdr' && extension !== '.img' )
    {
        throw 'Supported extension type : .nii .hdr .img';
    }

    const fid = new FILE('', machine);
    fid.fopen(data);

    let vox_offset = 0;
    fid.frewind();
    let ext;

    if ( fid.fread(1, 'int32') === 348 )
    {
        if ( extension === '.nii' )
        {
            fid.fseek(108, 'bof');
            vox_offset = fid.fread(1, 'float32');
        }

        ext = load_nii_ext_read_extension(fid, vox_offset);
    }
    else
    {
        machine = 'ieee-be';
        fid.littleEndian = false;

        fid.frewind();
        if ( fid.fread(1, 'int32') !== 348 )
        {
            throw 'File ${filename} is corrupted.'
        }

        if ( new_ext )
        {
            fid.fseek(108, 'bof');
            vox_offset = fid.fread(1, 'float32');
        }

        ext = load_nii_ext_read_extension(fid, vox_offset);
    }

    fid.fclose();
    return ext;
}

function load_nii_ext_read_extension ( fid, vox_offset )
{
    let ext = [];

    let end_of_ext;
    if ( vox_offset )
    {
        end_of_ext = vox_offset;
    }
    else
    {
        fid.fseek(0, 'eof');
        end_of_ext = fid.ftell();
    }

    if ( end_of_ext > 352 )
    {
        fid.fseek(348, 'bof');
        ext.extension = fid.fread(4, 'uint8');
    }

    if ( ext.length == 0 || ext.extension[0] == 0 )
    {
        ext = [];
        return ext;
    }

    let i = 0;
    ext.section = [];
    while( fid.ftell() < end_of_ext )
    {
        ext.section[i] = {};
        ext.section[i].esize = fid.fread(1,'int32');
        ext.section[i].ecode = fid.fread(1,'int32');
        ext.section[i].edata = fid.fread(ext.section(i).esize-8, 'char');
        i = i + 1;
    }

    ext.num_ext = ext.section.length;

    return ext;
}

class FILE
{
    constructor( filename = '', machine = 'ieee-le' )
    {
        this.filename = filename;
        this.offset = 0;
        this.littleEndian = machine === 'ieee-le';
    }

    fopen ( data )
    {
        this.content = new DataView(data);
        this.offset = 0;
    }

    fclose ()
    {
        this.content = null;
        this.offset = 0;
    }

    fread ( number, type = '' ) // Default is uInt8
    {
        var result;
        switch ( type )
        {
            case 'int32':
                if ( number == 1 )
                {
                    result = this.content.getInt32(this.offset, this.littleEndian);
                    this.offset += 4;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getInt32(this.offset, this.littleEndian));
                        this.offset += 4;
                    }
                }
                break;

            case 'int16':
                if ( number == 1 )
                {
                    result = this.content.getInt16(this.offset, this.littleEndian);
                    this.offset += 2;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getInt16(this.offset, this.littleEndian));
                        this.offset += 2;
                    }
                }
                break;

            case 'char':
            case 'int8':
                if ( number == 1 )
                {
                    result = this.content.getInt8(this.offset, this.littleEndian);
                    this.offset += 1;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getInt8(this.offset, this.littleEndian));
                        this.offset += 1;
                    }
                }
                break;

            case 'uint32':
                if ( number == 1 )
                {
                    result = this.content.getUint32(this.offset, this.littleEndian);
                    this.offset += 4;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getUint32(this.offset, this.littleEndian));
                        this.offset += 4;
                    }
                }
                break;

            case 'uint16':
                if ( number == 1 )
                {
                    result = this.content.getUint16(this.offset, this.littleEndian);
                    this.offset += 2;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getUint16(this.offset, this.littleEndian));
                        this.offset += 2;
                    }
                }
                break;

            case '':
            case 'uchar':
            case 'uint8':
                if ( number == 1 )
                {
                    result = this.content.getUint8(this.offset, this.littleEndian);
                    this.offset += 1;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getUint8(this.offset, this.littleEndian));
                        this.offset += 1;
                    }
                }
                break;

            case 'float64':
                if ( number == 1 )
                {
                    result = this.content.getFloat64(this.offset, this.littleEndian);
                    this.offset += 8;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getFloat64(this.offset, this.littleEndian));
                        this.offset += 8;
                    }
                }
                break;

            case 'float32':
                if ( number == 1 )
                {
                    result = this.content.getFloat32(this.offset, this.littleEndian);
                    this.offset += 4;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getFloat32(this.offset, this.littleEndian));
                        this.offset += 4;
                    }
                }
                break;

            case 'float16':
                if ( number == 1 )
                {
                    result = this.content.getFloat16(this.offset, this.littleEndian);
                    this.offset += 2;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getFloat16(this.offset, this.littleEndian));
                        this.offset += 2;
                    }
                }
                break;

            case 'string':
                const stringView = new DataView(this.content.buffer, this.offset, number);
                const decoder = new TextDecoder('utf-8');
                result = decoder.decode(stringView).replace(/\0/g, '').trim();
                this.offset += number;
        }
        return result;
    }

    fseek ( offset, origin )
    {
        switch ( origin )
        {
            case 'bof': // beginning of file
                this.offset = offset;
                return;

            case 'cof': // current location
                this.offset += offset;
                return;

            case 'eof': // end of file
                this.offset = this.content.byteLength + offset;
                return;
        }
    }

    frewind ()
    {
        this.fseek(0, 'bof');
    }

    ftell ()
    {
        return this.offset;
    }
}
