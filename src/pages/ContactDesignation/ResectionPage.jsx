import { parseCSVFile, Identifiers } from '../../utils/CSVParser';
import load_untouch_nii from '../../utils/Nifti_viewer/load_untouch_nifti.js'
import React, { useState, useRef, useEffect } from "react";

const Resection = ({ electrodes, onClick }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    return (
        <div className="flex-1">
            <NIFTIimage isLoaded={imageLoaded} onLoad={setImageLoaded} />
            {!imageLoaded ? (
                <ul className="space-y-4">
                {electrodes.map((electrode) => (
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        <ul className="flex space-x-4">
                            {electrode.contacts.map((contact) => (
                                <Contact
                                    key={contact.id}
                                    contact={contact}
                                    onClick={onClick}
                                />
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
            ) : (
                <div></div>
            )}
        </div>
    );
};

const NIFTIimage = ({ isLoaded, onLoad }) => {
    const fixedMainViewSize = 600;
    const fixedSubViewSize = 300;
    const [niiData, setNiiData] = useState(null);
    const [sliceIndex, setSliceIndex] = useState(0);
    const [direction, setDirection] = useState('Axial');
    const [subCanvas0Direction, setSubCanvas0Direction] = useState('Coronal');
    const [subCanvas1Direction, setSubCanvas1Direction] = useState('Sagittal');
    const [maxSlices, setMaxSlices] = useState(0);
    const [subCanvas0SliceIndex, setSubCanvas0SliceIndex] = useState(0);
    const [subCanvas1SliceIndex, setSubCanvas1SliceIndex] = useState(0);
    const [maxSubCanvas0Slices, setMaxSubCanvas0Slices] = useState(0);
    const [maxSubCanvas1Slices, setMaxSubCanvas1Slices] = useState(0);
    const mainCanvasRef = useRef(null);
    const subCanvas0Ref = useRef(null);
    const subCanvas1Ref = useRef(null);

    // UseEffect hooks to redraw specific canvases
    useEffect(() => {
        if (niiData && mainCanvasRef.current) {
            redrawMainCanvas();
        }
    }, [sliceIndex, direction, niiData]);

    useEffect(() => {
        if (niiData && subCanvas0Ref.current) {
            redrawSubCanvas0();
        }
    }, [subCanvas0SliceIndex, subCanvas0Direction, niiData]);

    useEffect(() => {
        if (niiData && subCanvas1Ref.current) {
            redrawSubCanvas1();
        }
    }, [subCanvas1SliceIndex, subCanvas1Direction, niiData]);

    useEffect(() => {
        const mainCanvas = mainCanvasRef.current;
        if (mainCanvas) {
            mainCanvas.addEventListener('wheel', (event) => handleScroll(event, sliceIndex, maxSlices, setSliceIndex));
        }

        return () => {
            if (mainCanvas) {
                mainCanvas.removeEventListener('wheel', (event) => handleScroll(event, sliceIndex, maxSlices, setSliceIndex));
            }
        };
    }, [sliceIndex, maxSlices]);

    useEffect(() => {
        const subCanvas0 = subCanvas0Ref.current;
        if (subCanvas0) {
            subCanvas0.addEventListener('wheel', (event) => handleScroll(event, subCanvas0SliceIndex, maxSubCanvas0Slices, setSubCanvas0SliceIndex));
            subCanvas0.addEventListener('click', () => handleSubCanvasClick(subCanvas0Direction));
        }

        return () => {
            if (subCanvas0) {
                subCanvas0.removeEventListener('wheel', (event) => handleScroll(event, subCanvas0SliceIndex, maxSubCanvas0Slices, setSubCanvas0SliceIndex));
                subCanvas0.removeEventListener('click', () => handleSubCanvasClick(subCanvas0Direction));
            }
        };
    }, [subCanvas0SliceIndex, maxSubCanvas0Slices]);

    useEffect(() => {
        const subCanvas1 = subCanvas1Ref.current;
        if (subCanvas1) {
            subCanvas1.addEventListener('wheel', (event) => handleScroll(event, subCanvas1SliceIndex, maxSubCanvas1Slices, setSubCanvas1SliceIndex));
            subCanvas1.addEventListener('click', () => handleSubCanvasClick(subCanvas1Direction));
        }

        return () => {
            if (subCanvas1) {
                subCanvas1.removeEventListener('wheel', (event) => handleScroll(event, subCanvas1SliceIndex, maxSubCanvas1Slices, setSubCanvas1SliceIndex));
                subCanvas1.removeEventListener('click', () => handleSubCanvasClick(subCanvas1Direction));
            }
        };
    }, [subCanvas1SliceIndex, maxSubCanvas1Slices]);

    const handleScroll = (event, slice, max, setter) => {
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        let newSlice = slice - delta;
        newSlice = Math.max(0, Math.min(newSlice, max - 1));
        setter(newSlice);
    };

    const handleSubCanvasClick = (newDirection) => {
        const oldDirection = direction;
        setDirection(newDirection);
        const dirDim = getDirectionDimension(newDirection);
        const newMax = niiData.hdr.dime.dim[dirDim];
        setMaxSlices(newMax);
        setSliceIndex(Math.min(Math.floor(newMax / 2), newMax - 1));

        if (newDirection == subCanvas0Direction) {
            setSubCanvas0Direction(oldDirection);
            const newSubCanvas0Max = niiData.hdr.dime.dim[getDirectionDimension(oldDirection)];
            setMaxSubCanvas0Slices(newSubCanvas0Max);
            setSubCanvas0SliceIndex(Math.min(Math.floor(newSubCanvas0Max / 2), newSubCanvas0Max - 1));
        } else {
            setSubCanvas1Direction(oldDirection);
            const newSubCanvas1Max = niiData.hdr.dime.dim[getDirectionDimension(oldDirection)];
            setMaxSubCanvas1Slices(newSubCanvas1Max);
            setSubCanvas1SliceIndex(Math.min(Math.floor(newSubCanvas1Max / 2), newSubCanvas1Max - 1));
        }
    };

    const getDirectionDimension = (dir = direction) => {
        switch(dir) {
            case 'Axial': return 3;
            case 'Coronal': return 2;
            case 'Sagittal': return 1;
            default: return 3;
        }
    };

    const getNonSelectedDirections = (dir = direction) => {
        switch(dir) {
            case 'Axial': return ['Coronal', 'Sagittal'];
            case 'Coronal': return ['Axial', 'Sagittal'];
            case 'Sagittal': return ['Axial', 'Coronal'];
            default: return ['Coronal', 'Sagittal'];
        }
    };

    const handleNIfTIFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const nii = load_untouch_nii(file.name, arrayBuffer);

            setNiiData(nii);
            const slices = nii.hdr.dime.dim[getDirectionDimension()];
            const subCanvas0Slices = nii.hdr.dime.dim[getDirectionDimension(subCanvas0Direction)];
            const subCanvas1Slices = nii.hdr.dime.dim[getDirectionDimension(subCanvas1Direction)];

            setMaxSlices(slices);
            setMaxSubCanvas0Slices(subCanvas0Slices);
            setMaxSubCanvas1Slices(subCanvas1Slices);

            setSliceIndex(Math.floor(slices / 2));
            setSubCanvas0SliceIndex(Math.floor(subCanvas0Slices / 2));
            setSubCanvas1SliceIndex(Math.floor(subCanvas1Slices / 2));

            onLoad(true);
        } catch (error) {
            console.error('Error loading NIfTI file:', error);
        }
    };

    const handleCSVFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError("");

        try {
            const { identifier, data } = await parseCSVFile(file);
            if (identifier === Identifiers.LOCALIZATION) {
                addTab('csv-localization', { name: file.name, data });
            } else {
                addTab('csv-test_plan', { name: file.name, data });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // Redraw functions for each canvas
    const redrawMainCanvas = () => {
        const mainCanvas = mainCanvasRef.current;
        if (!mainCanvas || !niiData) return;

        const mainCtx = mainCanvas.getContext('2d');
        const mainDir = getDirectionDimension();
        const mainImageData = mainCtx.createImageData(fixedMainViewSize, fixedMainViewSize);
        populateImageData(mainImageData, niiData, mainDir, sliceIndex, fixedMainViewSize);
        mainCtx.putImageData(mainImageData, 0, 0);
    };

    const redrawSubCanvas0 = () => {
        const subCanvas0 = subCanvas0Ref.current;
        if (!subCanvas0 || !niiData) return;

        const subCanvas0Ctx = subCanvas0.getContext('2d');
        const subCanvas0Dir = getDirectionDimension(subCanvas0Direction);
        const subCanvas0ImageData = subCanvas0Ctx.createImageData(fixedSubViewSize, fixedSubViewSize);
        populateImageData(subCanvas0ImageData, niiData, subCanvas0Dir, subCanvas0SliceIndex, fixedSubViewSize);
        subCanvas0Ctx.putImageData(subCanvas0ImageData, 0, 0);
    };

    const redrawSubCanvas1 = () => {
        const subCanvas1 = subCanvas1Ref.current;
        if (!subCanvas1 || !niiData) return;

        const subCanvas1Ctx = subCanvas1.getContext('2d');
        const subCanvas1Dir = getDirectionDimension(subCanvas1Direction);
        const subCanvas1ImageData = subCanvas1Ctx.createImageData(fixedSubViewSize, fixedSubViewSize);
        populateImageData(subCanvas1ImageData, niiData, subCanvas1Dir, subCanvas1SliceIndex, fixedSubViewSize);
        subCanvas1Ctx.putImageData(subCanvas1ImageData, 0, 0);
    };

    const getCanvasDimensions = (nii, dir) => {
        switch(dir) {
            case 1: return [nii.hdr.dime.dim[2], nii.hdr.dime.dim[3]];
            case 2: return [nii.hdr.dime.dim[1], nii.hdr.dime.dim[3]];
            case 3: return [nii.hdr.dime.dim[1], nii.hdr.dime.dim[2]];
            default: return [fixedMainViewSize, fixedMainViewSize];
        }
    };

    const populateImageData = (imageData, nii, dir, slice, imageSize = 0) => {
        const [cols, rows] = getCanvasDimensions(nii, dir);

        let maxDim = imageSize;
        if (imageSize == 0)
            maxDim = Math.max(cols, rows);

        const scaleRow = rows < maxDim ? maxDim / rows : 1;
        const scaleCol = cols < maxDim ? maxDim / cols : 1;

        // make image data
        const isRGB = (nii.hdr.dime.datatype === 128 && nii.hdr.dime.bitpix === 24) ||
                    (nii.hdr.dime.datatype === 511 && nii.hdr.dime.bitpix === 96);

        for (let row = 0; row < maxDim; row++) {
            const originalRowFlipped = rows - 1 - Math.floor(row / scaleRow);
            const rowOffset = row * maxDim;

            for (let col = 0; col < maxDim; col++) {
                const originalCol = Math.floor(col / scaleCol);
                let pixelValue;

                try {
                    switch(dir) {
                        case 1: // Sagittal (x-axis)
                            pixelValue = nii.img[originalRowFlipped][originalCol][slice];
                            break;
                        case 2: // Coronal (y-axis)
                            pixelValue = nii.img[originalRowFlipped][slice][originalCol];
                            break;
                        case 3: // Axial (z-axis)
                            pixelValue = nii.img[slice][originalRowFlipped][originalCol];
                            break;
                        default:
                            pixelValue = 0;
                    }
                } catch (e) {
                    console.warn(`Error accessing NIfTI data at [${originalCol}, ${originalRowFlipped}, ${slice}]`);
                    pixelValue = 0;
                }

                const offset = (rowOffset + col) * 4;

                if (isRGB) {
                    imageData.data[offset] = pixelValue[0];     // R
                    imageData.data[offset + 1] = pixelValue[1]; // G
                    imageData.data[offset + 2] = pixelValue[2]; // B
                } else {
                    const scaledValue = pixelValue / nii.hdr.dime.glmax * 255;
                    imageData.data[offset] = scaledValue;     // R
                    imageData.data[offset + 1] = scaledValue; // G
                    imageData.data[offset + 2] = scaledValue; // B
                }
                imageData.data[offset + 3] = 255; // A
            }
        }
    };

    return (
        <div>
            <input
                type="file"
                accept=".csv"
                onChange={handleCSVFileUpload}
                style={{ display: 'none' }}
                id="coorInput"
            />
            <button
                className="border-solid border-1 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 my-5"
                onClick={() => document.getElementById('coorInput').click()}
            >
                Open Coordinate File
            </button>
            <input
                type="file"
                accept=".nii"
                onChange={handleNIfTIFileUpload}
                style={{ display: 'none' }}
                id="niftiInput"
            />
            <button
                className="border-solid border-1 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 my-5"
                onClick={() => document.getElementById('niftiInput').click()}
            >
                Open NIfTI File
            </button>
            {isLoaded && (
                <div className="space-y-4">
                    <div className="flex">
                        <canvas ref={mainCanvasRef} width={fixedMainViewSize} height={fixedMainViewSize} />
                        <div className="flex flex-col ml-4">
                            <canvas ref={subCanvas0Ref} width={fixedSubViewSize} height={fixedSubViewSize} />
                            <canvas ref={subCanvas1Ref} width={fixedSubViewSize} height={fixedSubViewSize} className="mt-4" />
                        </div>
                    </div>
                    <div className="controls">
                        <div>
                            <label>Main View Slice:</label>
                            <input type="range" min="0" max={maxSlices - 1} value={sliceIndex}
                                   onChange={(e) => setSliceIndex(parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <label>Coronal View Slice:</label>
                            <input type="range" min="0" max={maxSubCanvas0Slices - 1} value={subCanvas0SliceIndex}
                                   onChange={(e) => setSubCanvas0SliceIndex(parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <label>Sagittal View Slice:</label>
                            <input type="range" min="0" max={maxSubCanvas1Slices - 1} value={subCanvas1SliceIndex}
                                   onChange={(e) => setSubCanvas1SliceIndex(parseInt(e.target.value))}
                            />
                        </div>
                        <select
                            value={direction}
                            onChange={(e) => {
                                const oldDirection = direction;
                                const newDirection = e.target.value;
                                setDirection(newDirection);
                                const dirDim = getDirectionDimension(newDirection);
                                const newMax = niiData.hdr.dime.dim[dirDim];
                                setMaxSlices(newMax);
                                setSliceIndex(Math.min(Math.floor(newMax / 2), newMax - 1));

                                if (newDirection == subCanvas0Direction) {
                                    setSubCanvas0Direction(oldDirection);
                                    const newSubCanvas0Max = niiData.hdr.dime.dim[getDirectionDimension(oldDirection)];
                                    setMaxSubCanvas0Slices(newSubCanvas0Max);
                                    setSubCanvas0SliceIndex(Math.min(Math.floor(newSubCanvas0Max / 2), newSubCanvas0Max - 1));
                                } else {
                                    setSubCanvas1Direction(oldDirection);
                                    const newSubCanvas1Max = niiData.hdr.dime.dim[getDirectionDimension(oldDirection)];
                                    setMaxSubCanvas1Slices(newSubCanvas1Max);
                                    setSubCanvas1SliceIndex(Math.min(Math.floor(newSubCanvas1Max / 2), newSubCanvas1Max - 1));
                                }
                            }}
                        >
                            <option value="Axial">Axial</option>
                            <option value="Coronal">Coronal</option>
                            <option value="Sagittal">Sagittal</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};

const Contact = ({ contact, onClick }) => {
    return (
        <li
            className={`min-w-[100px] p-4 border rounded-lg shadow cursor-pointer opacity-100 ${getMarkColor(contact)}`}
            onClick={() => onClick(contact.id, (contact) => {
                return {
                    ...contact,
                    surgeonMark: !(contact.surgeonMark)
                };
            })}
        >
            <p className="text-xl font-semibold">{contact.index}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
        </li>
    );
};

function getMarkColor(contact) {
    let mark = "";
    switch (contact.mark) {
        case 0:
            mark = "bg-white ";
            break;
        case 1:
            mark = "bg-rose-300 ";
            break;
        case 2:
            mark = "bg-amber-300 ";
            break;
    }

    if (contact.surgeonMark) mark += "border-3";
    return mark;
}

export default Resection
