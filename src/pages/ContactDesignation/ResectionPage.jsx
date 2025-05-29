import React, { useState, useRef, useEffect, useCallback } from "react";
import load_untouch_nii from '../../utils/Nifti_viewer/load_untouch_nifti.js'
import nifti_anatomical_conversion from '../../utils/Nifti_viewer/nifti_anatomical_conversion.js'
import { parseCSVFile } from '../../utils/CSVParser';
import { useError } from '../../context/ErrorContext';
import { niftiStorage } from '../../utils/IndexedDBStorage';
import { saveDesignationCSVFile } from "../../utils/CSVParser";

const backendURL = __APP_CONFIG__.backendURL;

/**
 * @module Resection
 */

/**
 * Resection page for neurosurgeon to mark contacts that need to be tested
 * @component
 * @param {Object} [initialData] - Initial data for electrodes
 * @param {Function} onStateChange - Callback for state changes
 * @param {Object} [savedState] - Saved state data
 * @returns {JSX.Element} Resection component
 */
const Resection = ({ initialData = {}, onStateChange, savedState = {} }) => {
    /**
     * Store if NIFTI image is loaded or not
     */
    const [imageLoaded, setImageLoaded] = useState(savedState.isLoaded || false);

    useEffect(() => {
        onStateChange({
            ...savedState,
            layout: "resection",
        });
    }, [imageLoaded]);


    const { showError } = useError();
    const [state, setState] = useState(savedState);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    /**
     * Store original localization for saving / exporting later
     */
    const [localizationData, setLocalizationData] = useState(() => {
        if (savedState && savedState.localizationData) {
            return structuredClone(savedState.localizationData);
        }
        return initialData?.originalData ? structuredClone(initialData.originalData) : null;
    });

    /**
    * Store electrodes data
    */
    const [electrodes, setElectrodes] = useState(() => {
        // If there are previous state that can be recalled
        if (savedState && savedState.electrodes) {
            return JSON.parse(JSON.stringify(savedState.electrodes));
        }

        // New page, made from localization page. Process data here.
        if (initialData && Object.keys(initialData).length !== 0) {
            return initialData.data.map(electrode => ({
                ...electrode,
                contacts: electrode.contacts.map((contact, index) => ({
                    ...contact,
                    id: `${electrode.label}${index + 1}`,
                    electrodeLabel: electrode.label,
                    index: index + 1,
                    mark: contact.mark || 0,
                    surgeonMark: contact.surgeonMark || false,
                    focus: false
                })),
            }));
        }
    });

    // Save state changes
    useEffect(() => {
        onStateChange(state);
    }, [state]);

    useEffect(() => {
        const newState = {
            ...state,
            electrodes: electrodes,
            localizationData: localizationData
        };
        setState(newState);
    }, [electrodes, localizationData]);

    // Update electrodes if there are any update from designation tab stored in the channel
    useEffect(() => {
        const channel = JSON.parse(localStorage.getItem("Designation_Resection_Sync_Channel") || '{}');
        if (channel[state.patientId]) {
            setElectrodes(channel[state.patientId]);
            handleSave();
        }

        delete channel[state.patientId];
        localStorage.setItem("Designation_Resection_Sync_Channel", JSON.stringify(channel));
    }, []);

    /**
     * Handles contact click event
     * @param {string} contactId - ID of the clicked contact
     * @param {Function} change - Function to modify contact state
     */
    const onClick = (contactId, change) => {
        let updatedElectrode = electrodes.map(electrode => ({
            ...electrode,
            contacts: electrode.contacts.map(contact => {
                if (contact.id === contactId) {
                    return change(contact);
                }
                return contact;
            }),
        }));

        setElectrodes(updatedElectrode);

        // Set the updated electrode in designated "channel" in localstorage
        const prevChannel = JSON.parse(localStorage.getItem("Designation_Resection_Sync_Channel"));
        localStorage.setItem("Designation_Resection_Sync_Channel", JSON.stringify({
            ...prevChannel,
            [state.patientId]: updatedElectrode
        }))
    };

    /**
     * Handles saving resection data
     * @async
     */
    const handleSave = async () => {
        try {
            // First save to database if we have a file ID
            if (state.fileId) {
                console.log('Saving resection with patientId:', {
                    fromState: state.patientId,
                    fromLocalizationData: localizationData?.patientId,
                    fileId: state.fileId
                });

                // Get user ID from session
                const token = localStorage.getItem('token');
                if (!token) {
                    showError('User not authenticated. Please log in to save neurosurgery.');
                    return;
                }

                try {
                    // First save/update file metadata
                    // Reusing the link for designation because these two page shares the same data structure
                    const response = await fetch(`${backendURL}/api/save-designation?type=resection`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            designationData: electrodes,
                            localizationData: localizationData,
                            fileId: state.fileId,
                            fileName: state.fileName,
                            creationDate: state.creationDate,
                            modifiedDate: new Date().toISOString(),
                            patientId: state.patientId
                        }),
                    });

                    const result = await response.json();
                    if (!result.success) {
                        console.error('Failed to save resection:', result.error);
                        showError(`Failed to save neurosurgery: ${result.error}`);
                        return;
                    }

                    // Only update the state with new modified date if the save was successful
                    // and we got a new modified date back
                    if (result.modifiedDate) {
                        setState(prevState => ({
                            ...prevState,
                            modifiedDate: result.modifiedDate
                        }));
                    }

                    // Show success feedback
                    setShowSaveSuccess(true);
                    setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds

                    console.log('Resection saved successfully');
                } catch (error) {
                    if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                        showWarning("No internet connection. The progress is not saved. Make sure to download your progress.");
                    } else {
                        console.error('Error saving resection:', error);
                        showError(`Error saving neurosurgery: ${error.message}`);
                    }
                    return;
                }
            }

            // Then export to CSV as before
            if (localizationData) {
                // If we have localization data, use it to create a CSV with the same format
                saveDesignationCSVFile(electrodes, localizationData, state.patientId, state.creationDate, state.modifiedDate, false, 'resection', state.fileId);
            } else {
                // Fall back to the simple logging if no localization data
                for (let electrode of electrodes) {
                    for (let contact of electrode.contacts) {
                        console.log(`${contact.id} is marked ${contact.mark} and surgeon has marked: ${contact.surgeonMark}`);
                    }
                }
            }
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved. Make sure to download your progress.");
            } else {
                console.error('Error saving resection:', error);
                showError(`Error saving neurosurgery: ${error.message}`);
            }
            return;
        }
    };

    /**
     * Handles exporting resection data
     * @async
     */
    const handleExport = async () => {
        try {
            // First save to database if we have a file ID
            if (state.fileId) {
                console.log('Saving resection to database...');

                // Get user ID from session
                const token = localStorage.getItem('token');
                if (!token) {
                    showError('User not authenticated. Please log in to save neurosurgery.');
                    return;
                }

                try {
                    // First save/update file metadata
                    const response = await fetch(`${backendURL}/api/save-designation`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            designationData: electrodes,
                            localizationData: localizationData,
                            fileId: state.fileId,
                            fileName: state.fileName,
                            creationDate: state.creationDate,
                            modifiedDate: new Date().toISOString(),
                            patientId: state.patientId
                        }),
                    });

                    const result = await response.json();
                    if (!result.success) {
                        console.error('Failed to save resection:', result.error);
                        showError(`Failed to save neurosurgery: ${result.error}`);
                        return;
                    }

                    // Only update the state with new modified date if the save was successful
                    // and we got a new modified date back
                    if (result.modifiedDate) {
                        setState(prevState => ({
                            ...prevState,
                            modifiedDate: result.modifiedDate
                        }));
                    }

                    // Show success feedback if this was a save operation
                    setShowSaveSuccess(true);

                    console.log('Resection saved successfully');
                } catch (error) {
                    if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                        showWarning("No internet connection. The progress is not saved on the database.");
                    } else {
                        console.error('Error saving resection:', error);
                        showError(`Error saving neurosurgery: ${error.message}`);
                        return;
                    }
                }
            }

            // Then export to CSV as before
            if (localizationData) {
                // If we have localization data, use it to create a CSV with the same format
                saveDesignationCSVFile(electrodes, localizationData, state.patientId, state.creationDate, state.modifiedDate, true, 'resection', state.fileId);
            } else {
                // Fall back to the simple logging if no localization data
                for (let electrode of electrodes) {
                    for (let contact of electrode.contacts) {
                        console.log(`${contact.id} is marked ${contact.mark} and surgeon has marked: ${contact.surgeonMark}`);
                    }
                }
            }
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database.");
            } else {
                console.error('Error saving resection:', error);    
                showError(`Error saving neurosurgery: ${error.message}`);
                return;
            }
        }
    };

    /**
     * Handles dispatching event to open resection tab
     * @async
     * @returns {Promise<void>}
     */
    const handleOpenDesignation = async () => {
        try {
            await handleSave();

            let designationData = {
                electrodes,
                originalData: localizationData
            };

            // Check for existing designation tabs
            const tabs = JSON.parse(localStorage.getItem('tabs') || '[]');
            const existingTab = tabs.find(tab =>
                (tab.content === 'csv-designation' || tab.content === 'designation') &&
                tab.state?.patientId === state.patientId
            );

            if (existingTab) {
                // Compare the current designation data with the existing tab's data
                const currentDesignationData = structuredClone(designationData.electrodes);
                const existingDesignationData = structuredClone(existingTab.state.electrodes);

                // Remove surgeonmark from consideration
                currentDesignationData.forEach(electrode => electrode.contacts.forEach(contact => contact.mark = 0));
                existingDesignationData.forEach(electrode => electrode.contacts.forEach(contact => contact.mark = 0));

                const hasDesignationChanged = JSON.stringify(currentDesignationData) !== JSON.stringify(existingDesignationData);

                if (hasDesignationChanged) {
                    // Close the existing tab
                    const closeEvent = new CustomEvent('closeTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(closeEvent);

                    // Create a new tab with updated data
                    const event = new CustomEvent('addDesignationTab', {
                        detail: {
                            data: designationData,
                            patientId: state.patientId,
                            state: {
                                patientId: state.patientId,
                                fileId: existingTab.state?.fileId || null,
                                fileName: state.fileName,
                                creationDate: state.creationDate,
                                modifiedDate: new Date().toISOString()
                            }
                        }
                    });
                    window.dispatchEvent(event);
                } else {
                    // Just set the existing tab as active
                    const activateEvent = new CustomEvent('setActiveTab', {
                        detail: { tabId: existingTab.id }
                    });
                    window.dispatchEvent(activateEvent);
                }
            } else {
                // If the user never made designation page before with the patient
                const token = localStorage.getItem('token');
                if (!token) {
                    showError('User not authenticated. Please log in to open epilepsy.');
                    return;
                }

                const response = await fetch(`${backendURL}/api/by-patient/${state.patientId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to check for existing designation data');
                }

                const result = await response.json();

                // Create a new tab with the designation data
                const event = new CustomEvent('addDesignationTab', {
                    detail: {
                        data: result.exists ? {
                            electrodes: result.data.designation_data,
                            originalData: result.data.localization_data
                        } : designationData,
                        patientId: state.patientId,
                        state: {
                            patientId: state.patientId,
                            fileId: result.exists ? result.fileId : null,
                            fileName: state.fileName,
                            creationDate: state.creationDate,
                            modifiedDate: new Date().toISOString()
                        }
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            if (error.name === "NetworkError" || error.message.toString().includes("NetworkError")) {
                showWarning("No internet connection. The progress is not saved on the database.");
            } else {
                console.error('Error saving neurosurgery:', error);
                showError(`Error saving neurosurgery: ${error.message}`);
                return;
            }
        }
    };

    return (
        <div className="flex-1 min-h-full bg-gray-100">
            {/* Show image if it is loaded. Otherwise show tile that is similar to one in designation page */}
            <div className="flex flex-col md:flex-row p-2 bg-gray-100">
                <NIFTIimage
                isLoaded={imageLoaded}
                onLoad={setImageLoaded}
                electrodes={electrodes}
                onContactClick={onClick}
                onStateChange={onStateChange}
                savedState={savedState} />
            </div>
            {!imageLoaded && (
                <div className="flex-1 p-4 lg:p-8">
                    <ul className="space-y-3 lg:space-y-6">
                        {electrodes.map((electrode) => (
                            <li key={electrode.label} className="p-3 lg:p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <p className="text-lg font-bold text-gray-800 mb-2
                                              lg:text-2xl lg:mb-4">
                                    {electrode.label}
                                </p>
                                <ul className="flex flex-wrap gap-2 lg:gap-4">
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
                </div>
            )}
            {/* Floating Save and Export Buttons at the Bottom Right */}
            <div className="fixed bottom-2 right-2 z-50 flex flex-col gap-1
                            lg:bottom-6 lg:right-6 lg:flex-row lg:gap-2">
                <div className="flex flex-row gap-1
                                lg:gap-2">
                    <div className="relative">
                        <button
                            className="grow py-1 px-2 bg-sky-600 text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer hover:bg-sky-700 border border-sky-700 shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                        {showSaveSuccess && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm whitespace-nowrap z-50">
                                Save successful!
                            </div>
                        )}
                    </div>
                    <button
                        className="grow py-1 px-2 bg-green-500 text-white font-semibold rounded border border-green-600 hover:bg-green-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleExport}
                    >
                        Export
                    </button>
                    <button
                        className="py-1 px-2 bg-purple-500 border border-purple-600 text-white font-semibold rounded hover:bg-purple-600 transition-colors duration-200 text-sm cursor-pointer shadow-lg
                                    lg:py-2 lg:px-4 lg:text-base"
                        onClick={handleOpenDesignation}>
                        Open in Epilepsy Page
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * NIFTIimage component for displaying and interacting with NIfTI images
 * @component
 * @param {boolean} isLoaded - State variable to tell if the image is loaded or not to the parent component
 * @param {Function} onLoad - Callback when image loads
 * @param {Array} electrodes - Array of electrode data
 * @param {Function} onContactClick - Contact click handler
 * @param {Function} onStateChange - State change handler
 * @param {Object} [savedState] - Saved state data
 * @returns {JSX.Element} NIFTIimage component
 */
const NIFTIimage = ({ isLoaded, onLoad, electrodes, onContactClick, onStateChange, savedState = {} }) => {
    const { showError } = useError();
    const fixedMainViewSize = 700;
    const fixedSubViewSize = 520;

    /**
     * Store nii image to save it locally using indexedDB
     */
    const [niiData, setNiiData] = useState(null);

    /**
     * Coordinates of the contacts, used to display contacts on NIFTI image
     */
    const [coordinates, setCoordinates] = useState(savedState.coordinate || []);

    const [successMessage, setSuccessMessage] = useState('');

    /**
     * Currently displayed contacts
     */
    const [markers, setMarkers] = useState([]);

    // Current slice, maximum slice, and perspective of main canvas
    const [sliceIndex, setSliceIndex] = useState(savedState.canvas_main_slice || 0);
    const [maxSlices, setMaxSlices] = useState(savedState.canvas_main_maxSlice || 0);
    const [direction, setDirection] = useState(savedState.canvas_main_direction || 'Axial');

    // Current slice, maximum slice, and perspective of sub canvas at the top
    const [subCanvas0SliceIndex, setSubCanvas0SliceIndex] = useState(savedState.canvas_sub0_slice || 0);
    const [maxSubCanvas0Slices, setMaxSubCanvas0Slices] = useState(savedState.canvas_sub0_maxSlice || 0);
    const [subCanvas0Direction, setSubCanvas0Direction] = useState(savedState.canvas_sub0_direction || 'Coronal');

    // Current slice, maximum slice, and perspective of sub canvas at the bottom
    const [subCanvas1SliceIndex, setSubCanvas1SliceIndex] = useState(savedState.canvas_sub0_slice || 0);
    const [maxSubCanvas1Slices, setMaxSubCanvas1Slices] = useState(savedState.canvas_sub0_maxSlice || 0);
    const [subCanvas1Direction, setSubCanvas1Direction] = useState(savedState.canvas_sub1_direction || 'Sagittal');

    /**
     * Marker that was hovered to display the detail information of it
     */
    const [hoveredMarker, setHoveredMarker] = useState(savedState.canvas_hoveredMarker || null);

    /**
     * To display the loading widget
     */
    const [isLoadingNifti, setIsLoadingNifti] = useState(false);

    /**
     * Currently selected contacts using rectangle selection tool
     */
    const [selectedContacts, setSelectedContacts] = useState([]);

    // Data to render rectangle selection tool
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });

    /**
     * Currently focused contact. Focusing is done by double clicking on a contact
     */
    const [focus, setFocus] = useState(savedState.focusedContact || null);

    // Cache functionality related to boost the rendering speed
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

    // Load NIfTI data from IndexedDB on component mount
    useEffect(() => {
        const loadSavedNifti = async () => {
            if (savedState.fileId) {
                try {
                    setIsLoadingNifti(true);
                    const savedNifti = await niftiStorage.getNiftiFile(savedState.fileId);
                    if (savedNifti) {
                        setNiiData(savedNifti);
                        onLoad(true);
                    }
                } catch (error) {
                    console.error('Error loading saved NIfTI file:', error);
                } finally {
                    setIsLoadingNifti(false);
                }
            }
        };
        loadSavedNifti();
    }, [savedState.fileId]);

    // Update refs when state changes
    useEffect(() => { sliceIndexRef.current = sliceIndex; }, [sliceIndex]);
    useEffect(() => { maxSlicesRef.current = maxSlices; }, [maxSlices]);
    useEffect(() => { subCanvas0SliceIndexRef.current = subCanvas0SliceIndex; }, [subCanvas0SliceIndex]);
    useEffect(() => { subCanvas1SliceIndexRef.current = subCanvas1SliceIndex; }, [subCanvas1SliceIndex]);
    useEffect(() => { maxSubCanvas0SlicesRef.current = maxSubCanvas0Slices; }, [maxSubCanvas0Slices]);
    useEffect(() => { maxSubCanvas1SlicesRef.current = maxSubCanvas1Slices; }, [maxSubCanvas1Slices]);

    // Effects for state change. Separated to avoid setting element that did not change again and again
    // Grouped by related items
    useEffect(() => { // For bottom sub canvas
        onStateChange({
            ...savedState,
            canvas_sub1_slice: subCanvas1SliceIndex,
            canvas_sub1_maxSlice: maxSubCanvas1Slices,
            canvas_sub1_direction: subCanvas1Direction,
        });
    }, [subCanvas1SliceIndex, maxSubCanvas1Slices, subCanvas1Direction, isLoaded]);

    useEffect(() => { // For top sub canvas
        onStateChange({
            ...savedState,
            canvas_sub0_slice: subCanvas0SliceIndex,
            canvas_sub0_maxSlice: maxSubCanvas0Slices,
            canvas_sub0_direction: subCanvas0Direction,
        });
    }, [subCanvas0SliceIndex, maxSubCanvas0Slices, subCanvas0Direction, isLoaded]);

    useEffect(() => { // For main canvas
        onStateChange({
            ...savedState,
            canvas_main_slice: sliceIndex,
            canvas_main_maxSlice: maxSlices,
            canvas_main_direction: direction,
            canvas_hoveredMarker: hoveredMarker,
        });
    }, [sliceIndex, maxSlices, direction, hoveredMarker, isLoaded]);

    useEffect(() => { // For coordinates
        onStateChange({
            ...savedState,
            coordinate: coordinates,
        });
    }, [coordinates]);

    /**
     * Clear canvas image cache. Invoked when new NIFTI image / coordinates are loaded
     */
    const clearImageDataCache = () => {
        imageDataCache.current = {};
    };

    /**
     * Redraw specified canvas. This function will try to reuse cache if it exists
     * @param {React.RefObject} canvasRef - Canvas ref
     * @param {Number} dir - Perspective of the canvas
     * @param {Number} slice - Current slice of the canvas
     * @param {Number} viewSize - Size (width or height) of the canvas. It is assumed to be square
     * @param {String} cacheKey - Key that prepend caches for the canvas to help identify
     */
    const redrawCanvas = (canvasRef, dir, slice, viewSize, cacheKey) => {
        const canvas = canvasRef.current;
        if (!canvas || !niiData) return;

        if (canvas.rafId) cancelAnimationFrame(canvas.rafId);
        canvas.rafId = requestAnimationFrame(() => {
            const ctx = canvas.getContext('2d');
            // Find cache. If not, make one
            const cacheEntry = imageDataCache.current[cacheKey];
            if (cacheEntry) {
                ctx.putImageData(cacheEntry, 0, 0);
            } else {
                const imageData = ctx.createImageData(viewSize, viewSize);
                populateImageData(imageData, niiData, dir, slice, viewSize);
                imageDataCache.current[cacheKey] = imageData;
                ctx.putImageData(imageData, 0, 0);
            }

            // Render the result onto the canvas
            if (canvasRef === mainCanvasRef && isSelecting) {
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                const width = selectionEnd.x - selectionStart.x;
                const height = selectionEnd.y - selectionStart.y;
                ctx.rect(selectionStart.x, selectionStart.y, width, height);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            drawMarkers(ctx, dir, slice, viewSize);
            canvas.rafId = null;
        });
    };

    /**
     * Transforms RAS coordinates to NIfTI coordinates (left top = 0,0)
     * @param {Object} coord - Coordinate object for a contact. Required to have x, y, z, Electrode label, and contact number
     * @returns {Object} Transformed coordinates
     */
    const transformCoordinates = (coord) => {
        if (!niiData) return coord; // Return original if NIfTI data is not loaded

        const { hdr } = niiData;
        const dims = hdr.dime.dim;

        // NIfTI dimensions (x, y, z)
        const nx = dims[1] - 1;
        const ny = dims[2] - 1;
        const nz = dims[3] - 1;

        // Transform coordinates (center origin to corner origin)
        return {
            x: coord.x + nx / 2,
            y: coord.y + ny / 2,
            z: coord.z + nz / 2,
            label: coord.Electrode,
            id: coord.Electrode + coord.Contact,
        };
    };

    /**
     * Draws markers on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas
     * @param {number} dir - Direction of the canvas
     * @param {number} slice - Slice index
     * @param {number} viewSize - Canvas size
     */
    const drawMarkers = (ctx, dir, slice, viewSize) => {
        if (!niiData || coordinates.length === 0) return;

        const [cols, rows] = getCanvasDimensions(niiData, dir);
        const maxDim = viewSize || Math.max(cols, rows);
        const scale = maxDim / Math.max(cols, rows);
        const offsetX = Math.floor((maxDim - cols * scale) / 2);
        const offsetY = Math.floor((maxDim - rows * scale) / 2);

        const newMarkers = [];

        coordinates.forEach(coord => {
            const transformedCoord = transformCoordinates(coord);
            const { x, y, z } = transformedCoord;
            let canvasX, canvasY;
            let originalCoord = [0, 0, 0];
            let dist = 0;
            const threshold = 1
            switch (dir) {
                case 1: // Sagittal
                    dist = x - slice;
                    if (Math.abs(dist) < threshold) {
                        canvasX = (y * scale) + offsetX;
                        canvasY = maxDim - (z * scale) - offsetY;
                        originalCoord[0] = y;
                        originalCoord[1] = z;
                        originalCoord[2] = x;
                    }
                    break;
                case 2: // Coronal
                    dist = y - slice;
                    if (Math.abs(dist) < threshold) {
                        canvasX = (x * scale) + offsetX;
                        canvasY = maxDim - (z * scale) - offsetY;
                        originalCoord[0] = x;
                        originalCoord[1] = z;
                        originalCoord[2] = y;
                    }
                    break;
                case 3: // Axial
                    dist = z - slice;
                    if (Math.abs(dist) < threshold) {
                        canvasX = (x * scale) + offsetX;
                        canvasY = maxDim - (y * scale) - offsetY;
                        originalCoord[0] = x;
                        originalCoord[1] = y;
                        originalCoord[2] = z;
                    }
                    break;
            }

            if (canvasX !== undefined && canvasY !== undefined) {
                let targetContact;

                for (let electrode of electrodes) {
                    if (electrode.label === transformedCoord.label) {
                        for (let contact of electrode.contacts) {
                            if (contact.id === transformedCoord.id) targetContact = contact;
                        }
                    }
                }

                ctx.beginPath();
                let markSize = viewSize / 100 - 1 + dist * 2;
                if (selectedContacts.includes(targetContact.id)) {
                    markSize += 2;
                }
                if (focus !== null && focus.id === targetContact.id) {
                    markSize += 2;
                }
                ctx.arc(canvasX, canvasY, markSize, 0, 2 * Math.PI);

                switch (targetContact.mark) {
                    case 0:
                        ctx.globalAlpha = 1 - Math.abs(dist);
                        ctx.fillStyle = "rgb(249 249 249)"; break;
                    case 1:
                        ctx.globalAlpha = 1 - Math.abs(dist);
                        ctx.fillStyle = "rgb(255 58 68)"; break;
                    case 2:
                        ctx.globalAlpha = 1 - Math.abs(dist);
                        ctx.fillStyle = "rgb(237 255 68)"; break;
                    case 3:
                        ctx.globalAlpha = 1 - Math.abs(dist);
                        ctx.fillStyle = "rgba(139 139 139)"; break;
                }
                ctx.strokeStyle = targetContact.surgeonMark ? 'black' : ctx.fillStyle;

                ctx.fill();
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Store the marker position
                newMarkers.push({ x: canvasX, y: canvasY, contact: targetContact, originalCoord: originalCoord });
            }
        });

        // Update the markers state
        setMarkers(newMarkers);
    };

    /**
     * Redraws main canvas
     */
    const redrawMainCanvas = () => {
        const dir = getDirectionDimension();
        const cacheKey = `main-${dir}-${sliceIndex}-${fixedMainViewSize}`;
        redrawCanvas(mainCanvasRef, dir, sliceIndex, fixedMainViewSize, cacheKey);
    };

    /**
     * Redraws sub-canvas 0 at the bottom
     */
    const redrawSubCanvas0 = () => {
        const dir = getDirectionDimension(subCanvas0Direction);
        const cacheKey = `sub-${dir}-${subCanvas0SliceIndex}-${fixedSubViewSize}`;
        redrawCanvas(subCanvas0Ref, dir, subCanvas0SliceIndex, fixedSubViewSize, cacheKey);
    };

    /**
     * Redraws sub-canvas 1 at the bottom
     */
    const redrawSubCanvas1 = () => {
        const dir = getDirectionDimension(subCanvas1Direction);
        const cacheKey = `sub-${dir}-${subCanvas1SliceIndex}-${fixedSubViewSize}`;
        redrawCanvas(subCanvas1Ref, dir, subCanvas1SliceIndex, fixedSubViewSize, cacheKey);
    };

    // Effects to redraw canvases when dependencies change
    useEffect(redrawMainCanvas, [sliceIndex, direction, niiData, coordinates, markers, focus, selectedContacts]);
    useEffect(redrawSubCanvas0, [subCanvas0SliceIndex, subCanvas0Direction, niiData, coordinates, focus, selectedContacts]);
    useEffect(redrawSubCanvas1, [subCanvas1SliceIndex, subCanvas1Direction, niiData, coordinates, focus, selectedContacts]);

    /**
     * Handles mouse down event on main canvas. For clicking on marker and start of selection tool
     * @param {MouseEvent} event - Mouse event
     * @param {React.RefObject} canvasRef - Canvas ref
     */
    const handleMouseDown = (event, canvasRef) => {
        if (canvasRef !== mainCanvasRef) return;

        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        // Check if user is clicking on a marker
        const clickedMarker = markers.find(marker => {
            const distance = Math.sqrt((mouseX - marker.x) ** 2 + (mouseY - marker.y) ** 2);
            return distance <= 6;
        });

        if (!clickedMarker && event.button === 0) {
            // Start selection if not clicking on a marker and left mouse button
            setIsSelecting(true);
            setSelectionStart({ x: mouseX, y: mouseY });
            setSelectionEnd({ x: mouseX, y: mouseY });
        }
    };

    /**
     * Handles mouse up event on main canvas. Handle end end of selection
     * @param {MouseEvent} event - Mouse event
     * @param {React.RefObject} canvasRef - Canvas ref
     */
    const handleMouseUp = (event, canvasRef) => {
        if (canvasRef !== mainCanvasRef || !isSelecting) return;

        setIsSelecting(false);

        // Calculate selection rectangle
        const x1 = Math.min(selectionStart.x, selectionEnd.x);
        const y1 = Math.min(selectionStart.y, selectionEnd.y);
        const x2 = Math.max(selectionStart.x, selectionEnd.x);
        const y2 = Math.max(selectionStart.y, selectionEnd.y);

        // Find markers within the selection rectangle
        const selectedMarkers = markers.filter(marker => {
            return marker.x >= x1 && marker.x <= x2 && marker.y >= y1 && marker.y <= y2;
        });

        // Update selected contacts
        if (selectedMarkers.length > 0) {
            setSelectedContacts(selectedMarkers.map(m => m.contact.id));
        } else {
            setSelectedContacts([]);
        }
    };

    /**
     * Handles mouse move event on canvas. For selection tool and detail view of contact when hovering on top of contact
     * @param {MouseEvent} event - Mouse event
     * @param {React.RefObject} canvasRef - Canvas ref
     */
    const handleMouseMove = (event, canvasRef) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (isSelecting && canvasRef === mainCanvasRef) {
            setSelectionEnd({ x: mouseX, y: mouseY });
            return;
        }

        // Check if the mouse is over any marker
        const hovered = markers.find(marker => {
            const distance = Math.sqrt((mouseX - marker.x) ** 2 + (mouseY - marker.y) ** 2);
            return distance <= 6;
        });

        if (hovered) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }

        setHoveredMarker(hovered ? hovered : hoveredMarker);
    };

    const handleMouseLeave = () => {
        const canvas = mainCanvasRef.current;
        if (canvas) {
            canvas.style.cursor = 'default'; // Reset cursor to default when mouse leaves the canvas
        }
    };

    /**
     * Handle focusing on a contact.
     * Will change slices of all the canvases so that it will display the focused contact
     */
    const focusOnContact = () => {
        if (!focus) return

        const coord = coordinates.find(c => c.Electrode + c.Contact === focus.id);
        if (!coord || !niiData) return;

        const { x, y, z } = transformCoordinates(coord);

        // Update slice indices to focus on the contact
        switch (getDirectionDimension(direction)) {
            case 1: setSliceIndex(Math.round(x)); break;
            case 2: setSliceIndex(Math.round(y)); break;
            case 3: setSliceIndex(Math.round(z)); break;
        }

        switch (getDirectionDimension(subCanvas0Direction)) {
            case 1: setSubCanvas0SliceIndex(Math.round(x)); break;
            case 2: setSubCanvas0SliceIndex(Math.round(y)); break;
            case 3: setSubCanvas0SliceIndex(Math.round(z)); break;
        }

        switch (getDirectionDimension(subCanvas1Direction)) {
            case 1: setSubCanvas1SliceIndex(Math.round(x)); break;
            case 2: setSubCanvas1SliceIndex(Math.round(y)); break;
            case 3: setSubCanvas1SliceIndex(Math.round(z)); break;
        }
    };
    useEffect(focusOnContact, [focus, niiData, coordinates]);

    /**
     * Handles canvas click event
     * @param {WheelEvent} event - Mouse event
     * @param {Function} setter - Call back function to set slice on the canvas
     * @param {React.RefObject} currentSliceRef - Reference for current slice
     * @param {React.RefObject} maxRef - Reference for max slice index
     */
    const handleScroll = (event, setter, currentSliceRef, maxRef) => {
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        const newSlice = Math.max(0, Math.min(currentSliceRef.current - delta, maxRef.current - 1));
        setter(newSlice);
    };

    /**
     * Handles main canvas click event. Handle marking and focusing
     * @param {MouseEvent} event - Mouse event
     * @param {React.RefObject} canvasRef - Canvas ref
     */
    const handleCanvasClick = (event, canvasRef) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const clickX = event.offsetX;
        const clickY = event.offsetY;

        // Check if the click is within any marker's bounds
        markers.forEach(marker => {
            const distance = Math.sqrt((clickX - marker.x) ** 2 + (clickY - marker.y) ** 2);
            if (distance <= 6) {
                switch (event.detail) { // Identify if it is first click or second click
                    case 1:
                        if (selectedContacts.length > 0 && selectedContacts.includes(marker.contact.id)) {
                            selectedContacts.forEach(contactId => {
                                onContactClick(contactId, (contact) => {
                                    return {
                                        ...contact,
                                        surgeonMark: !(contact.surgeonMark)
                                    };
                                });
                            });
                        } else {
                            // Otherwise just mark the clicked contact
                            onContactClick(marker.contact.id, (contact) => {
                                return {
                                    ...contact,
                                    surgeonMark: !(contact.surgeonMark)
                                };
                            });

                            setSelectedContacts([]);
                        }

                        break;
                    case 2:
                        // UNDO the first click
                        if (selectedContacts.length > 0 && selectedContacts.includes(marker.contact.id)) {
                            selectedContacts.forEach(contactId => {
                                onContactClick(contactId, (contact) => {
                                    return {
                                        ...contact,
                                        surgeonMark: !(contact.surgeonMark)
                                    };
                                });
                            });
                        } else {
                            onContactClick(marker.contact.id, (contact) => {
                                return {
                                    ...contact,
                                    focus: true,
                                    surgeonMark: !(contact.surgeonMark)
                                };
                            });
                        }
                        onContactClick(marker.contact.id, (contact) => {
                            return {
                                ...contact,
                                focus: true
                            };
                        });
                        setFocus(marker.contact);

                        setSelectedContacts([]);

                        break;
                }

                setHoveredMarker(
                    {
                        ...marker,
                        contact: {
                            ...marker.contact,
                            surgeonMark: !(marker.contact.surgeonMark)
                        }
                    }
                );
            }
        });
    };

    // Register all the event handler for main canvas
    useEffect(() => {
        if (!isLoaded) return;

        const mainCanvas = mainCanvasRef.current;
        const handleWheel = (e) => handleScroll(e, setSliceIndex, sliceIndexRef, maxSlicesRef);
        const handleClick = (e) => handleCanvasClick(e, mainCanvasRef);
        const handleMove = (e) => handleMouseMove(e, mainCanvasRef);
        const handleLeave = () => handleMouseLeave();
        const handleDown = (e) => handleMouseDown(e, mainCanvasRef);
        const handleUp = (e) => handleMouseUp(e, mainCanvasRef);

        if (mainCanvas) {
            mainCanvas.addEventListener('wheel', handleWheel);
            mainCanvas.addEventListener('click', handleClick);
            mainCanvas.addEventListener('mousemove', handleMove);
            mainCanvas.addEventListener('mouseleave', handleLeave);
            mainCanvas.addEventListener('mousedown', handleDown);
            mainCanvas.addEventListener('mouseup', handleUp);
            return () => {
                mainCanvas.removeEventListener('wheel', handleWheel);
                mainCanvas.removeEventListener('click', handleClick);
                mainCanvas.removeEventListener('mousemove', handleMove);
                mainCanvas.removeEventListener('mouseleave', handleLeave);
                mainCanvas.removeEventListener('mousedown', handleDown);
                mainCanvas.removeEventListener('mouseup', handleUp);
            };
        }
    }, [isLoaded, markers]);

    /**
     * Handles sub canvas click event. Handle switching perspectives
     * @param {Number} clickedSubIndex - Which sub canvas that got the click. 0 or 1
     */
    const handleSubCanvasClick = useCallback((clickedSubIndex) => {
        // Get current directions before any updates
        const oldMainDirection = direction;
        const targetSubDirection = clickedSubIndex === 0 ? subCanvas0Direction : subCanvas1Direction;

        const oldMainSliceIndex = sliceIndex;
        let oldSubCanvasSliceIndex;

        // Update main view to clicked subcanvas's direction
        setDirection(targetSubDirection);

        // Update clicked subcanvas to old main direction
        if (clickedSubIndex === 0) {
            oldSubCanvasSliceIndex = subCanvas0SliceIndex;
            setSubCanvas0Direction(oldMainDirection);
            const newMax = niiData.hdr.dime.dim[getDirectionDimension(oldMainDirection)];
            setMaxSubCanvas0Slices(newMax);
            setSubCanvas0SliceIndex(oldMainSliceIndex);
        } else {
            oldSubCanvasSliceIndex = subCanvas1SliceIndex;
            setSubCanvas1Direction(oldMainDirection);
            const newMax = niiData.hdr.dime.dim[getDirectionDimension(oldMainDirection)];
            setMaxSubCanvas1Slices(newMax);
            setSubCanvas1SliceIndex(oldMainSliceIndex);
        }

        // Update main view parameters
        const newMainMax = niiData.hdr.dime.dim[getDirectionDimension(targetSubDirection)];
        setMaxSlices(newMainMax);
        setSliceIndex(oldSubCanvasSliceIndex);
    }, [direction, sliceIndex, subCanvas0SliceIndex, subCanvas1SliceIndex, subCanvas0Direction, subCanvas1Direction, niiData]);

    // Register all the event handler for sub canvas 0
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

    // Register all the event handler for sub canvas 1
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

    /**
     * Convert string representation of direction to number representation of direction
     * @param {String} [dir] - Direction to convert to number from. Default to direction of main canvas
     * @returns {Number} Number assigned to each direction. 1, 2, or 3
     */
    const getDirectionDimension = (dir = direction) => {
        switch(dir) {
            case 'Axial': return 3;
            case 'Coronal': return 2;
            case 'Sagittal': return 1;
            default: return 3;
        }
    };

    /**
     * Load NIFTI image and sets up the canvas accordingly
     * @param {Event} event - File input event
     * @async
     */
    const handleNIfTIFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsLoadingNifti(true);
            const arrayBuffer = await file.arrayBuffer();
            let nii = load_untouch_nii(file.name, arrayBuffer);
            nii = nifti_anatomical_conversion(nii);
            nii = {
                img: nii.img,
                hdr: nii.hdr
            }

            const isRGB = (nii.hdr.dime.datatype === 128 && nii.hdr.dime.bitpix === 24) ||
                    (nii.hdr.dime.datatype === 511 && nii.hdr.dime.bitpix === 96);
            const niftiData = { ...nii, isRGB };
            setNiiData(niftiData);

            // Save NIfTI data to IndexedDB
            if (savedState.fileId) {
                await niftiStorage.saveNiftiFile(savedState.fileId, niftiData);
            }

            const slices = nii.hdr.dime.dim[getDirectionDimension()];
            const subCanvas0Slices = nii.hdr.dime.dim[getDirectionDimension(subCanvas0Direction)];
            const subCanvas1Slices = nii.hdr.dime.dim[getDirectionDimension(subCanvas1Direction)];

            setMaxSlices(slices);
            setMaxSubCanvas0Slices(subCanvas0Slices);
            setMaxSubCanvas1Slices(subCanvas1Slices);

            setSliceIndex(Math.floor(slices / 2));
            setSubCanvas0SliceIndex(Math.floor(subCanvas0Slices / 2));
            setSubCanvas1SliceIndex(Math.floor(subCanvas1Slices / 2));

            clearImageDataCache();

            setHoveredMarker(null);
            setSelectedContacts([]);

            onLoad(true);
        } catch (error) {
            console.error('Error loading NIfTI file:', error);
            showError('Error loading NIfTI file: ' + error.message);
        } finally {
            setIsLoadingNifti(false);
        }
    };

    /**
     * Handles upload of CSV file for coordinates
     * @param {Event} event - File input event
     * @async
     */
    const handleCSVFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const { identifier, data } = await parseCSVFile(file, true, showError);
            if (identifier === "coordinates") {
                // Check for columns
                if (Array.isArray(data)
                    && data.length > 0
                    && data[0].Electrode
                    && data[0].Contact
                    && data[0].x
                    && data[0].y
                    && data[0].z) {
                    setCoordinates(data); // Store CSV coordinates in state
                    setSuccessMessage('Coordinates loaded successfully');
                    setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
                } else {
                    showError("Please check the column name of the CSV data. Required: [Electrode,Contact,x,y,z]");
                }
            } else {
                showError("Unknown CSV file format");
            }
        } catch (error) {
            showError("Error parsing CSV file: " + error.message);
        }
        setHoveredMarker(null);
    };

    /**
     * Gets canvas dimensions for given direction
     * @param {Object} nii - NIfTI data
     * @param {number} dir - Direction/dimension
     * @returns {Array} [cols, rows] dimensions
     */
    const getCanvasDimensions = (nii, dir) => {
        switch(dir) {
            case 1: return [nii.hdr.dime.dim[2], nii.hdr.dime.dim[3]];
            case 2: return [nii.hdr.dime.dim[1], nii.hdr.dime.dim[3]];
            case 3: return [nii.hdr.dime.dim[1], nii.hdr.dime.dim[2]];
            default: return [fixedMainViewSize, fixedMainViewSize];
        }
    };


    /**
     * Scales image data and populate it in specified canvas
     * @param {ImageData} imageData - Image data to populate
     * @param {Object} nii - NIfTI data
     * @param {number} dir - Perspective of the canvas
     * @param {number} slice - Slice index
     * @param {number} imageSize - Desired length of the longer side
     */
    const populateImageData = (imageData, nii, dir, slice, imageSize) => {
        const [cols, rows] = getCanvasDimensions(nii, dir);
        const maxDim = imageSize || Math.max(cols, rows);

        let scaleX, scaleY;

        switch(dir) {
            case 3:
                scaleX = nii.hdr.dime.pixdim[1];
                scaleY = nii.hdr.dime.pixdim[2];
                break;
            case 2:
                scaleX = nii.hdr.dime.pixdim[1];
                scaleY = nii.hdr.dime.pixdim[3];
                break;
            case 1:
                scaleX = nii.hdr.dime.pixdim[2];
                scaleY = nii.hdr.dime.pixdim[3];
                break;
        }

        const effectiveCols = cols * scaleX;
        const effectiveRows = rows * scaleY;

        const scale = maxDim / Math.max(effectiveCols, effectiveRows);

        const isRGB = nii.isRGB;
        const data = imageData.data;

        // Calculate the offsets to center the image
        const offsetX = Math.floor((maxDim - effectiveCols * scale) / 2);
        const offsetY = Math.floor((maxDim - effectiveRows * scale) / 2);

        // Initialize the entire imageData with black pixels
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            data[i + 3] = 255; // A (fully opaque)
        }

        // Precompute row and column mappings)
        const rowMap = new Array(maxDim).fill().map((_, row) => Math.floor((maxDim - 1 - row - offsetY) / scale / scaleY));
        const colMap = new Array(maxDim).fill().map((_, col) => Math.floor((col + offsetX) / scale / scaleX));

        for (let y = 0; y < maxDim; y++) {
            const originalY = rowMap[y];
            for (let x = 0; x < maxDim; x++) {
                const originalX = colMap[x];
                let pixelValue = 0;

                // Only process pixels within the bounds of the original image
                if (originalX >= 0 && originalX < cols && originalY >= 0 && originalY < rows) {
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

    /**
     * Remove nifti image and clean up the state variable
     */
    const removeNifti = async () => {
        // Bring tiles back
        onLoad(false)

        // Let indexedDB to delete the image as we remove metadata on the page
        let promsie = niftiStorage.deleteNiftiFile(savedState.fileId);

        // Remove states for user interaction
        setMarkers([]);
        setHoveredMarker(null)
        setSelectedContacts([])
        setIsSelecting(false)
        setSelectionStart({x: 0, y: 0})
        setSelectionEnd({x: 0, y: 0})
        setFocus(null)

        // Remove states for each canvas
        setSliceIndex(0)
        setMaxSlices(0)
        setDirection('Axial')

        setSubCanvas0SliceIndex(0)
        setMaxSubCanvas0Slices(0)
        setSubCanvas0Direction('Coronal')

        setSubCanvas1SliceIndex(0)
        setMaxSubCanvas1Slices(0)
        setSubCanvas1Direction('Sagittal')

        // Indexed db should be cleared out by here.
        await promsie;

        // Remove NIFTI data
        setNiiData(null)
    }

    return (
        <div className="p-1 lg:p-2 mx-2 lg:mx-5 bg-gray-100">
            <div className="flex space-x-2 mb-4
                            lg:space-x-4 lg:mb-8">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileUpload}
                    style={{ display: 'none' }}
                    id="coorInput"
                />
                <div className="flex flex-col items-center gap-2">
                    <button
                        className="border-solid border-2 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 hover:bg-sky-700 hover:text-white transition-colors duration-200"
                        onClick={() => document.getElementById('coorInput').click()}
                    >
                        Open Coordinate File
                    </button>
                    {successMessage && (
                        <div className="text-green-600 text-sm">
                            {successMessage}
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    accept=".nii"
                    onChange={handleNIfTIFileUpload}
                    style={{ display: 'none' }}
                    id="niftiInput"
                />
                <div className="flex flex-col items-center gap-2">
                    <button
                        className="border-solid border-2 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 hover:bg-sky-700 hover:text-white transition-colors duration-200"
                        onClick={() => document.getElementById('niftiInput').click()}
                        disabled={isLoadingNifti}
                    >
                        Open NIfTI File
                    </button>
                    {isLoadingNifti && (
                        <div className="flex items-center text-sky-700 text-sm">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-sky-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading NIfTI file...
                        </div>
                    )}
                </div>
                {isLoaded && (
                <button
                    className="border-solid border-2 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 hover:bg-sky-700 hover:text-white transition-colors duration-200"
                    onClick={removeNifti}
                >
                    Remove NIfTI image
                </button>)}
            </div>
            {isLoaded && (
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-6">
                    <div className="flex justify-center relative">
                        <canvas
                            ref={mainCanvasRef}
                            width={fixedMainViewSize}
                            height={fixedMainViewSize}
                            className={"max-w-[" + fixedMainViewSize + "] max-h-[" + fixedMainViewSize + "] border border-gray-300 rounded-lg shadow-sm"}
                        />
                        <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white px-1 py-1 rounded text-xs flex-row
                                        lg:top-2 lg:right-2 lg:px-2 lg:text-sm">
                            {hoveredMarker && (
                                <p className="justify-end flex">X: {hoveredMarker.originalCoord[0]}, Y: {hoveredMarker.originalCoord[1]}, Z: {hoveredMarker.originalCoord[2]}</p>
                            )}
                            {selectedContacts.length !== 0 && (
                                <p className="justify-end flex">Selected: {selectedContacts.join(", ")}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:gap-6">
                        <div className="flex gap-3 lg:gap-6 justify-center">
                            <canvas
                                ref={subCanvas0Ref}
                                width={fixedSubViewSize}
                                height={fixedSubViewSize}
                                className={"max-w-[" + fixedSubViewSize + "] max-h-[" + fixedSubViewSize + "] border border-gray-300 rounded-lg shadow-sm"}
                            />
                            <canvas
                                ref={subCanvas1Ref}
                                width={fixedSubViewSize}
                                height={fixedSubViewSize}
                                className={"max-w-[" + fixedSubViewSize + "] max-h-[" + fixedSubViewSize + "] border border-gray-300 rounded-lg shadow-sm"}
                            />
                        </div>

                        <div className="bg-white p-2 lg:p-4 rounded-lg shadow-md w-full">
                            <h2 className="text-base font-semibold text-gray-800 border-b pb-1 mb-2
                                           lg:text-xl lg:pb-1 lg:mb-2">
                                {hoveredMarker !== null ? hoveredMarker.contact.id : "Hover over a contact..."}
                            </h2>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs lg:text-sm text-gray-600">Location</p>
                                    <p className="text-sm md:text-base lg:text-lg font-medium text-gray-900 break-words">
                                        {hoveredMarker !== null ? hoveredMarker.contact.associatedLocation : ""}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs lg:text-sm text-gray-600">Mark</p>
                                    <p className="text-sm md:text-base lg:text-lg font-medium text-gray-900">
                                        {hoveredMarker !== null ? getMarkName(hoveredMarker.contact) : ""}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs lg:text-sm text-gray-600">Surgeon Marked</p>
                                    <p className="text-sm md:text-base lg:text-lg font-medium text-gray-900">
                                        {hoveredMarker !== null ? (hoveredMarker.contact.surgeonMark ? 'Yes' : 'No') : ""}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Contact component for displaying individual electrode contacts
 * @component
 * @param {Object} contact - Data for the contact
 * @param {Function} onClick - Handler to reflect the change on contact that was clicked
 * @returns {JSX.Element} A tile that shows information about the contact
 */
const Contact = ({ contact, onClick }) => {

    return (
        <li
            className={`w-[75px] p-2 rounded-lg shadow-sm cursor-pointer flex-shrink-0 transition-transform transform hover:scale-105
                        lg:w-[100px] lg:p-4 ${getMarkColor(contact)}`}
            onClick={() => {
                onClick(contact.id, (contact) => {
                    return {
                        ...contact,
                        surgeonMark: !(contact.surgeonMark)
                    };
                });
            }}
        >
            <p className="text-base lg:text-xl font-bold text-gray-800">{contact.index}</p>
            <p className="text-xs lg:text-sm font-medium text-gray-600 truncate" title={contact.associatedLocation}>
                {contact.associatedLocation}
            </p>
        </li>
    );
};

/**
 * Gets CSS class for contact based on mark status
 * @param {Object} contact - Data for the contact
 * @returns {string} CSS classes for the contact
 */
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
        case 3:
            mark = "bg-stone-300 ";
            break;
    }

    if (contact.surgeonMark) {
        mark += "border-2 border-stone-500";
    }
    else {
        mark += "border border-gray-300";
    }
    return mark;
}

/**
 * Gets display name for contact mark status
 * @param {Object} contact - Contact data
 * @returns {string} Display name for mark status
 */
function getMarkName(contact) {
    switch (contact.mark) {
        case 0:
            return "Not Involved";
        case 1:
            return "Seizure Onset Zone";
        case 2:
            return "Epileptic Network";
        case 3:
            return "Out Of Brain";
    }
}

export default Resection
