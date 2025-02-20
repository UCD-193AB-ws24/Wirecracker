import FILE from "./FILE.js";

export default function load_nii_ext ( filename, data )
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

        ext = read_extension(fid, vox_offset);
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

        ext = read_extension(fid, vox_offset);
    }

    fid.fclose();
    return ext;
}

function read_extension ( fid, vox_offset )
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
