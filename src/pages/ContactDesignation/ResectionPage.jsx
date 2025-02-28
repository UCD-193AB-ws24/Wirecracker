import { parseCSVFile, Identifiers } from '../../utils/CSVParser';
import load_untouch_nii from '../../utils/Nifti_viewer/load_untouch_nifti.js'
import React, { useState, useRef, useEffect, useCallback } from "react";

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
    const imageDataCache = useRef({});

    // Refs to track state without re-binding listeners
    const sliceIndexRef = useRef(sliceIndex);
    const maxSlicesRef = useRef(maxSlices);
    const subCanvas0SliceIndexRef = useRef(subCanvas0SliceIndex);
    const subCanvas1SliceIndexRef = useRef(subCanvas1SliceIndex);
    const maxSubCanvas0SlicesRef = useRef(maxSubCanvas0Slices);
    const maxSubCanvas1SlicesRef = useRef(maxSubCanvas1Slices);

    // Update refs when state changes
    useEffect(() => { sliceIndexRef.current = sliceIndex; }, [sliceIndex]);
    useEffect(() => { maxSlicesRef.current = maxSlices; }, [maxSlices]);
    useEffect(() => { subCanvas0SliceIndexRef.current = subCanvas0SliceIndex; }, [subCanvas0SliceIndex]);
    useEffect(() => { subCanvas1SliceIndexRef.current = subCanvas1SliceIndex; }, [subCanvas1SliceIndex]);
    useEffect(() => { maxSubCanvas0SlicesRef.current = maxSubCanvas0Slices; }, [maxSubCanvas0Slices]);
    useEffect(() => { maxSubCanvas1SlicesRef.current = maxSubCanvas1Slices; }, [maxSubCanvas1Slices]);

    // Throttled redraw functions using requestAnimationFrame
    const redrawCanvas = (canvasRef, dir, slice, viewSize, cacheKey) => {
        const canvas = canvasRef.current;
        if (!canvas || !niiData) return;

        if (canvas.rafId) cancelAnimationFrame(canvas.rafId);
        canvas.rafId = requestAnimationFrame(() => {
            const ctx = canvas.getContext('2d');
            const cacheEntry = imageDataCache.current[cacheKey];
            if (cacheEntry) {
                ctx.putImageData(cacheEntry, 0, 0);
            } else {
                const imageData = ctx.createImageData(viewSize, viewSize);
                populateImageData(imageData, niiData, dir, slice, viewSize);
                imageDataCache.current[cacheKey] = imageData;
                ctx.putImageData(imageData, 0, 0);
            }
            canvas.rafId = null;
        });
    };

    const redrawMainCanvas = () => {
        const dir = getDirectionDimension();
        const cacheKey = `main-${dir}-${sliceIndex}-${fixedMainViewSize}`;
        redrawCanvas(mainCanvasRef, dir, sliceIndex, fixedMainViewSize, cacheKey);
    };

    const redrawSubCanvas0 = () => {
        const dir = getDirectionDimension(subCanvas0Direction);
        const cacheKey = `sub0-${dir}-${subCanvas0SliceIndex}-${fixedSubViewSize}`;
        redrawCanvas(subCanvas0Ref, dir, subCanvas0SliceIndex, fixedSubViewSize, cacheKey);
    };

    const redrawSubCanvas1 = () => {
        const dir = getDirectionDimension(subCanvas1Direction);
        const cacheKey = `sub1-${dir}-${subCanvas1SliceIndex}-${fixedSubViewSize}`;
        redrawCanvas(subCanvas1Ref, dir, subCanvas1SliceIndex, fixedSubViewSize, cacheKey);
    };

    // Effects to redraw canvases when dependencies change
    useEffect(redrawMainCanvas, [sliceIndex, direction, niiData]);
    useEffect(redrawSubCanvas0, [subCanvas0SliceIndex, subCanvas0Direction, niiData]);
    useEffect(redrawSubCanvas1, [subCanvas1SliceIndex, subCanvas1Direction, niiData]);


    // Unified scroll handler using refs
    const handleScroll = (event, setter, currentSliceRef, maxRef) => {
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        const newSlice = Math.max(0, Math.min(currentSliceRef.current - delta, maxRef.current - 1));
        setter(newSlice);
    };

    // Stable event listeners using refs and proper dependencies
    useEffect(() => {
        if (!isLoaded) return;

        const mainCanvas = mainCanvasRef.current;
        const handleWheel = (e) => handleScroll(e, setSliceIndex, sliceIndexRef, maxSlicesRef);

        if (mainCanvas) {
            mainCanvas.addEventListener('wheel', handleWheel);
            return () => mainCanvas.removeEventListener('wheel', handleWheel);
        }
    }, [isLoaded]); // Re-attach when canvas becomes available

    const handleSubCanvasClick = useCallback((clickedSubIndex) => {
        // Get current directions before any updates
        const oldMainDirection = direction;
        const targetSubDirection = clickedSubIndex === 0 ? subCanvas0Direction : subCanvas1Direction;

        // Update main view to clicked subcanvas's direction
        setDirection(targetSubDirection);

        // Update clicked subcanvas to old main direction
        if (clickedSubIndex === 0) {
            setSubCanvas0Direction(oldMainDirection);
            const newMax = niiData.hdr.dime.dim[getDirectionDimension(oldMainDirection)];
            setMaxSubCanvas0Slices(newMax);
            setSubCanvas0SliceIndex(Math.min(Math.floor(newMax / 2), newMax - 1));
        } else {
            setSubCanvas1Direction(oldMainDirection);
            const newMax = niiData.hdr.dime.dim[getDirectionDimension(oldMainDirection)];
            setMaxSubCanvas1Slices(newMax);
            setSubCanvas1SliceIndex(Math.min(Math.floor(newMax / 2), newMax - 1));
        }

        // Update main view parameters
        const newMainMax = niiData.hdr.dime.dim[getDirectionDimension(targetSubDirection)];
        setMaxSlices(newMainMax);
        setSliceIndex(Math.min(Math.floor(newMainMax / 2), newMainMax - 1));
    }, [direction, subCanvas0Direction, subCanvas1Direction, niiData]);

    useEffect(() => {
        if (!isLoaded) return;

        const subCanvas0 = subCanvas0Ref.current;
        const handleWheel = (e) => handleScroll(e, setSubCanvas0SliceIndex, subCanvas0SliceIndexRef, maxSubCanvas0SlicesRef);
        const handleClick = () => handleSubCanvasClick(0);

        if (subCanvas0) {
            subCanvas0.addEventListener('wheel', handleWheel);
            subCanvas0.addEventListener('click', handleClick);
            return () => {
                subCanvas0.removeEventListener('wheel', handleWheel);
                subCanvas0.removeEventListener('click', handleClick);
            };
        }
    }, [isLoaded, handleSubCanvasClick]); // Include direction in dependencies

    useEffect(() => {
        if (!isLoaded) return;

        const subCanvas1 = subCanvas1Ref.current;
        const handleWheel = (e) => handleScroll(e, setSubCanvas1SliceIndex, subCanvas1SliceIndexRef, maxSubCanvas1SlicesRef);
        const handleClick = () => handleSubCanvasClick(1);

        if (subCanvas1) {
            subCanvas1.addEventListener('wheel', handleWheel);
            subCanvas1.addEventListener('click', handleClick);
            return () => {
                subCanvas1.removeEventListener('wheel', handleWheel);
                subCanvas1.removeEventListener('click', handleClick);
            };
        }
    }, [isLoaded, handleSubCanvasClick]); // Include direction in dependencies

    const getDirectionDimension = (dir = direction) => {
        switch(dir) {
            case 'Axial': return 3;
            case 'Coronal': return 2;
            case 'Sagittal': return 1;
            default: return 3;
        }
    };

    const handleNIfTIFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const nii = load_untouch_nii(file.name, arrayBuffer);

            const isRGB = (nii.hdr.dime.datatype === 128 && nii.hdr.dime.bitpix === 24) ||
                    (nii.hdr.dime.datatype === 511 && nii.hdr.dime.bitpix === 96);
            setNiiData({ ...nii, isRGB });

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

    const getCanvasDimensions = (nii, dir) => {
        switch(dir) {
            case 1: return [nii.hdr.dime.dim[2], nii.hdr.dime.dim[3]];
            case 2: return [nii.hdr.dime.dim[1], nii.hdr.dime.dim[3]];
            case 3: return [nii.hdr.dime.dim[1], nii.hdr.dime.dim[2]];
            default: return [fixedMainViewSize, fixedMainViewSize];
        }
    };

    const populateImageData = (imageData, nii, dir, slice, imageSize) => {
        const [cols, rows] = getCanvasDimensions(nii, dir);
        const maxDim = imageSize || Math.max(cols, rows);
        const scaleRow = rows / maxDim;
        const scaleCol = cols / maxDim;
        const isRGB = nii.isRGB;
        const data = imageData.data;

        // Precompute row and column mappings
        const rowMap = new Array(maxDim).fill().map((_, row) => Math.floor((maxDim - 1 - row) * scaleRow));
        const colMap = new Array(maxDim).fill().map((_, col) => Math.floor(col * scaleCol));

        for (let y = 0; y < maxDim; y++) {
            const originalY = rowMap[y];
            for (let x = 0; x < maxDim; x++) {
                const originalX = colMap[x];
                let pixelValue = 0;
                try {
                    switch(dir) {
                        case 1: pixelValue = nii.img[originalY][originalX][slice]; break;
                        case 2: pixelValue = nii.img[originalY][slice][originalX]; break;
                        case 3: pixelValue = nii.img[slice][originalY][originalX]; break;
                    }
                } catch(e) {
                    console.warn(`Error accessing NIfTI data at [${originalX}, ${originalY}, ${slice}]`);
                    pixelValue = 0;
                }

                const offset = (y * maxDim + x) * 4;
                if (isRGB) {
                    data.set(pixelValue, offset);
                } else {
                    const val = (pixelValue / nii.hdr.dime.glmax) * 255;
                    data[offset] = data[offset+1] = data[offset+2] = val;
                }
                data[offset+3] = 255;
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
