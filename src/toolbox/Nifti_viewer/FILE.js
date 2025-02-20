export default class FILE
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
