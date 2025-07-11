import Papa from 'papaparse';
import contact from '../pages/ContactDesignation/contact';

const IDENTIFIER_LINE_2 = "### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###";

/**
 * Enum for different identifiers fr different pages
 * @readonly
 * @enum {string}
 */
export const Identifiers = Object.freeze({
    TEST_PLANNING:           "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR TEST PLANNING ###",
    LOCALIZATION:            "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR LOCALIZATION ###",
    DESIGNATION:             "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR DESIGNATION ###",
    STIMULATION:             "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR CCEPS / SEIZURE RECREATION PLANNING ###",
    STIMULATION_FUNCTION:    "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR FUNCTIONAL MAPPING PLANNING ###",
    STIMULATION_RECREATION:   "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR SEIZURE RECREATION PLANNING ###",
    STIMULATION_CCEP:         "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR CCEPS PLANNING ###",
    RESECTION:               "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR RESECTION ###",
});

/**
 * Parses a CSV file and returns the parsed data.
 *
 * @param {File} file - The CSV file to be parsed.
 * @param {boolean} coordinates - Whether the file is a coordinates file.
 * @param {Function} showError - Function to display error messages.
 * @returns {Promise<{ identifier: string, data: Object }>} A promise that resolves with the identifier and parsed CSV data.
 */
export function parseCSVFile(file, coordinates = false, showError = null) {
    return new Promise((resolve, reject) => {
        if (!file) {
            const errorMsg = "No file provided.";
            if (showError) showError(errorMsg);
            reject(new Error(errorMsg));
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const fileContent = e.target.result;
            const lines = fileContent.split(/\r?\n/);

            if (!coordinates && (lines.length < 2 ||
                (
                    !lines[0].trim().includes(Identifiers.TEST_PLANNING) &&
                    !lines[0].trim().includes(Identifiers.LOCALIZATION) &&
                    !lines[0].trim().includes(Identifiers.DESIGNATION) &&
                    !lines[0].trim().includes(Identifiers.STIMULATION) &&
                    !lines[0].trim().includes(Identifiers.STIMULATION_FUNCTION) &&
                    !lines[0].trim().includes(Identifiers.STIMULATION_RECREATION) &&
                    !lines[0].trim().includes(Identifiers.STIMULATION_CCEP) &&
                    !lines[0].trim().includes(Identifiers.RESECTION)
                ) || !lines[1].trim().includes(IDENTIFIER_LINE_2) )) {
                const errorMsg = "Invalid file. The first line must be the correct identifier.";
                if (showError) showError(errorMsg);
                reject(new Error(errorMsg));
                return;
            }

            let identifier;
            let csvWithoutIdentifier;
            let metadata = {
                patientId: '',
                creationDate: null,
                modifiedDate: null,
                fileId: null
            };

            if (!coordinates) { 
                identifier = lines[0].trim();
                // Extract metadata from the CSV header
                for (let i = 2; i < 6; i++) {
                    if (lines[i].startsWith('PatientID:')) {
                        metadata.patientId = lines[i].split('PatientID:')[1].trim();
                    } else if (lines[i].startsWith('CreatedDate:')) {
                        metadata.creationDate = lines[i].split('CreatedDate:')[1].trim();
                    } else if (lines[i].startsWith('ModifiedDate:')) {
                        metadata.modifiedDate = lines[i].split('ModifiedDate:')[1].trim();
                    } else if (lines[i].startsWith('FileID:')) {
                        metadata.fileId = lines[i].split('FileID:')[1].trim();
                    }
                }
                // Parse CSV content excluding the identifier and metadata lines
                csvWithoutIdentifier = lines.slice(6).join("\n");
            } else {
                identifier = "coordinates";
                csvWithoutIdentifier = lines.join("\n");
            }

            if (identifier.includes(Identifiers.LOCALIZATION)) {
                resolve({ identifier, data: parseLocalization(csvWithoutIdentifier), metadata });
                return;
            }
            else if (identifier.includes(Identifiers.DESIGNATION) || identifier.includes(Identifiers.RESECTION)) {
                // First parse as localization to get the original structure
                const localizationData = parseLocalization(csvWithoutIdentifier);
                // Then parse as designation for the current state
                const designationData = parseDesignation(csvWithoutIdentifier);
                resolve({ 
                    identifier, 
                    data: {
                        originalData: localizationData,
                        data: designationData
                    },
                    metadata
                });
                return;
            }
            else if (identifier.includes(Identifiers.STIMULATION) || identifier.includes(Identifiers.STIMULATION_FUNCTION) || identifier.includes(Identifiers.STIMULATION_RECREATION) || identifier.includes(Identifiers.STIMULATION_CCEP)) {
                const stimulationData = parseStimulation(csvWithoutIdentifier);
                resolve({identifier, data: stimulationData, metadata});
                return;
            }
            else if (identifier.includes(Identifiers.TEST_PLANNING)) {
                resolve({ identifier, data: parseTests(csvWithoutIdentifier), metadata });
                return;
            }

            Papa.parse(csvWithoutIdentifier, {
                header: true,
                comments: "#",
                skipEmptyLines: true,
                dynamicTyping: true, // Ensures correct data types for numbers
                complete: function (results) {
                    resolve({ identifier, data: results.data, metadata });
                },
                error: function (err) {
                    if (showError) showError("Parsing error: " + err.message);
                    reject(new Error("Parsing error: " + err.message));
                }
            });
        };

        reader.onerror = function () {
            if (showError) showError("Error reading file.");
            reject(new Error("Error reading file."));
        };

        reader.readAsText(file);
    });
}

/**
 * Parses localization CSV data into a nested dictionary format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A nested dictionary with the format { Label: { ContactNumber: {"electrodeDescription": "Left Entorhinal", "contactDescription": "Left Entorhinal", "associatedLocation": "GM"}, ... }, ... }
 */
function parseLocalization(csvData) {
    const parsedData = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    
    rows.forEach(row => {
        const label = row.Label.trim();
        const contactNumber = row.ContactNumber.trim();
        const electrodeDescription = row.ElectrodeDescription.trim();
        const contactDescription = row.ContactDescription.trim();
        const associatedLocation = row.AssociatedLocation.trim();
        const electrodeType = row.Type ? row.Type.trim() : 'DIXI'; // Default to DIXI if not specified
        
        if (!parsedData[label]) {
            parsedData[label] = { 
                'description': electrodeDescription,
                'type': electrodeType // Store the electrode type
            };
        }
        parsedData[label][contactNumber] = {
            contactDescription,
            associatedLocation
        };
    });
    
    return parsedData;
}

/**
 * Parses designation CSV data into a data structure format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A data structure with the format [{ label: 'A'', contacts: [contact, contact, ...] }, ... ]
 */
function parseDesignation(csvData) {
    const parsedData = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    
    // First pass: Group by electrode label and collect contacts
    rows.forEach(row => {
        const label = row.Label.trim();
        const contactNumber = parseInt(row.ContactNumber);
        let associatedLocation = row.AssociatedLocation.trim();
        const contactDescription = row.ContactDescription.trim();
        const electrodeDescription = row.ElectrodeDescription.trim();
        const mark = parseInt(row.Mark) || 0; // Default to 0 if not specified
        const surgeonMark = parseInt(row.SurgeonMark) === 1; // Convert to boolean from int (0 or 1)
        const electrodeType = row.Type ? row.Type.trim() : 'DIXI'; // Default to DIXI if not specified
        
        // Process associated location based on GM presence
        if (associatedLocation === 'GM') {
            associatedLocation = contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            associatedLocation = `${contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactDescription.split('+');
            associatedLocation = `${desc1}/${desc2}`;
        }
        // For other cases (like WM), keep the original associatedLocation
        
        if (!parsedData[label]) {
            parsedData[label] = {
                label: label,
                contacts: [],
                type: electrodeType // Store the electrode type
            };
        }
        
        const contactObj = {
            ...(new contact(associatedLocation, mark, surgeonMark)),
            id: `${label}${contactNumber}`,
            index: contactNumber,
            __electrodeDescription__: electrodeDescription,
            __contactDescription__: contactDescription,
        };
        
        // Add to contacts array at the correct index (contactNumber - 1)
        // Ensure the array is large enough
        while (parsedData[label].contacts.length < contactNumber) {
            parsedData[label].contacts.push(null);
        }
        parsedData[label].contacts[contactNumber - 1] = contactObj;
    });
    
    // Convert to array format matching demo data
    return Object.values(parsedData).map(electrode => ({
        label: electrode.label,
        contacts: electrode.contacts.filter(contact => contact !== null), // Remove any null entries
        type: electrode.type // Include the electrode type in the output
    }));
}

/**
 * Parses stimulation CSV data into a data structure format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A data structure with the format [{ label: 'A'', contacts: [contact, contact, ...] }, ... ]
 */
function parseStimulation(csvData) {
    const parsedData = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    const planOrder = [];

    // First pass: Group by electrode label and collect contacts
    rows.forEach(row => {
        const label = row.Label.trim();
        const contactNumber = parseInt(row.ContactNumber);
        let associatedLocation = row.AssociatedLocation.trim();
        const contactDescription = row.ContactDescription.trim();
        const mark = parseInt(row.Mark) || 0; // Default to 0 if not specified)
        const surgeonMark = row.SurgeonMark.trim() === "true"; // Convert to boolean
        const pair = parseInt(row.Pair);
        const isPlanning = row.IsPlanning.trim() === "true";
        const electrodeDescription = row.ElectrodeDescription.trim();
        const frequency = parseFloat(row.Frequency) || 105; // TODO : ask what default value should be
        const duration = parseFloat(row.Duration) || 3.0;
        const current = parseFloat(row.Current) || 2.445;
        const order = parseInt(row.PlanOrder) || -1;

        // Process associated location based on GM presence
        if (associatedLocation === 'GM') {
            associatedLocation = contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            associatedLocation = `${contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactDescription.split('+');
            associatedLocation = `${desc1}/${desc2}`;
        }
        // For other cases (like WM), keep the original associatedLocation

        if (!parsedData[label]) {
            parsedData[label] = {
                label: label,
                contacts: []
            };
        }

        const contactObj = {
            ...(new contact(associatedLocation, mark, surgeonMark)),
            __electrodeDescription__: electrodeDescription,
            __contactDescription__: contactDescription,
            id: label + contactNumber,
            index: contactNumber,
            pair: pair,
            isPlanning: isPlanning,
            duration: duration,
            frequency: frequency,
            current: current,
            order: order
        };

        if (isPlanning && order >= 0) {
            planOrder[order] = contactObj.id;
        }

        // Add to contacts array at the correct index (contactNumber - 1)
        // Ensure the array is large enough
        while (parsedData[label].contacts.length < contactNumber) {
            parsedData[label].contacts.push(null);
        }
        parsedData[label].contacts[contactNumber - 1] = contactObj;
    });

    // Convert to array format matching demo data
    return {
        data: Object.values(parsedData).map(electrode => ({
            label: electrode.label,
            contacts: electrode.contacts.filter(contact => contact !== null) // Remove any null entries
        })),
        planOrder: planOrder.filter(Boolean) // Remove any null/undefined entries
    };
}

/**
 * Parses stimulation CSV data into a data structure format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A data structure with the format [{ label: 'A'', contacts: [contact, contact, ...] }, ... ]
 */
function parseTests(csvData) {
    const parsedData = {};
    const tests = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    let hasAnyTests = false;

    // First pass: Group by electrode label and collect contacts
    rows.forEach(row => {
        const label = row.Label.trim();
        const contactNumber = parseInt(row.ContactNumber);
        let associatedLocation = row.AssociatedLocation.trim();
        const contactDescription = row.ContactDescription.trim();
        const mark = parseInt(row.Mark) || 0; // Default to 0 if not specified
        const surgeonMark = row.SurgeonMark.trim() === "true"; // Convert to boolean
        const pair = parseInt(row.Pair);
        const electrodeDescription = row.ElectrodeDescription.trim();
        const frequency = parseFloat(row.Frequency) || 105;
        const duration = parseFloat(row.Duration) || 3.0;
        const current = parseFloat(row.Current) || 2.445;
        const testID = row.TestID.trim() || "No test";
        const isPlanning = row.IsPlanning ? row.IsPlanning.trim() === "true" : true; // Default to true if not specified

        // Process associated location based on GM presence
        if (associatedLocation === 'GM') {
            associatedLocation = contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            associatedLocation = `${contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactDescription.split('+');
            associatedLocation = `${desc1}/${desc2}`;
        }

        if (!parsedData[label]) {
            parsedData[label] = {
                label: label,
                contacts: []
            };
        }

        const contactObj = {
            ...(new contact(associatedLocation, mark, surgeonMark)),
            __electrodeDescription__: electrodeDescription,
            __contactDescription__: contactDescription,
            id: label + contactNumber,
            electrodeLabel: label,
            index: contactNumber,
            pair: pair,
            duration: duration,
            frequency: frequency,
            current: current,
            isPlanning: isPlanning
        };

        // Add to contacts array at the correct index (contactNumber - 1)
        // Ensure the array is large enough
        while (parsedData[label].contacts.length < contactNumber) {
            parsedData[label].contacts.push(null);
        }
        parsedData[label].contacts[contactNumber - 1] = contactObj;

        // Add test ID to the contact's test list
        if (testID !== "No test") {
            hasAnyTests = true;
            if (!tests[contactObj.id]) {
                tests[contactObj.id] = [];
            }
            tests[contactObj.id].push({id: parseInt(testID)});
        }
    });

    // Convert to array format matching demo data
    return {
        contacts: Object.values(parsedData).map(electrode => ({
            label: electrode.label,
            contacts: electrode.contacts.filter(contact => contact !== null) // Remove any null entries
        })),
        tests: hasAnyTests ? tests : {}
    };
}

/**
 * Saves a CSV file from data and downloads it or returns the data.
 * 
 * @param {string} identifier - The identifier for the first line.
 * @param {Object} data - The data to be saved.
 * @param {string} patientId - The patient ID for the first line.
 * @param {string} createdDate - The created date for the first line.
 * @param {string} modifiedDate - The modified date for the first line.
 * @param {boolean} download - Whether to download the file or return the data.
 * @returns {Object|void} The parsed data if download is false, otherwise void.
 */
export function saveCSVFile(identifier, data, patientId = '', createdDate = null, modifiedDate = null, download = true, fileId = null) {
    const currentDate = new Date().toISOString();
    const finalPatientId = patientId || data.patientId || '';
    const finalCreatedDate = createdDate || currentDate;
    const finalModifiedDate = modifiedDate || currentDate;
    const finalFileId = fileId || data.fileId || '';

    let csvContent = `${identifier}\n${IDENTIFIER_LINE_2}\n`;
    csvContent += `PatientID:${finalPatientId}\n`;
    csvContent += `CreatedDate:${finalCreatedDate}\n`;
    csvContent += `ModifiedDate:${finalModifiedDate}\n`;
    csvContent += `FileID:${finalFileId}\n`;
    let returnData = [];
    
    if (identifier === Identifiers.LOCALIZATION) {
        const headers = ["Label", "ContactNumber", "ElectrodeDescription", "ContactDescription", "AssociatedLocation", "Mark", "SurgeonMark", "Type"];
        csvContent += headers.join(",") + "\n";
        
        Object.entries(data).forEach(([label, contacts]) => {
            const electrodeDescription = contacts.description;
            const electrodeType = contacts.type || 'DIXI'; // Default to DIXI if not specified
            Object.entries(contacts).forEach(([contactNumber, contactData]) => {
                // Skip the 'description' and 'type' keys, as they're not contacts
                if (contactNumber === 'description' || contactNumber === 'type') return;

                const {
                    contactDescription,
                    associatedLocation
                } = contactData;

                const row = [label, contactNumber, electrodeDescription, contactDescription, associatedLocation, 0, 0, electrodeType];
                csvContent += row.join(",") + "\n";
                
                if (!download) {
                    returnData.push({
                        Label: label,
                        ContactNumber: parseInt(contactNumber),
                        ElectrodeDescription: electrodeDescription,
                        AssociatedLocation: associatedLocation,
                        ContactDescription: contactDescription,
                        Mark: 0,
                        SurgeonMark: 0,
                        Type: electrodeType
                    });
                }
            });
        });
    }
    
    if (download) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "anatomy_" + new Date().toISOString().split('T')[0] + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        switch (identifier) {
            case Identifiers.DESIGNATION: return parseDesignation(Papa.unparse(returnData));
            case Identifiers.STIMULATION: return parseStimulation(Papa.unparse(returnData));
        }
        return parseDesignation(Papa.unparse(returnData));
    }
}

/**
 * Saves a CSV file from data and downloads it or returns the data.
 * 
 * @param {Object[]} designationData - The data to be saved.
 * @param {Object[]} localizationData - The localization data to be used.
 * @param {string} patientId - The patient ID for the first line.
 * @param {string} createdDate - The created date for the first line.
 * @param {string} modifiedDate - The modified date for the first line.
 * @param {boolean} download - Whether to download the file or return the data.
 * @param {string} type - The type of designation data.
 * @returns {string} The CSV content.
 */
export function saveDesignationCSVFile(designationData, localizationData, patientId = '', createdDate = null, modifiedDate = null, download = true, type = 'designation', fileId = null) {
    const currentDate = new Date().toISOString();
    const finalPatientId = patientId || localizationData.patientId || '';
    const finalCreatedDate = createdDate || currentDate;
    const finalModifiedDate = modifiedDate || currentDate;
    const finalFileId = fileId || designationData.fileId || '';

    let csvContent = `${type === 'resection' ? Identifiers.RESECTION : Identifiers.DESIGNATION}\n${IDENTIFIER_LINE_2}\n`;
    csvContent += `PatientID:${finalPatientId}\n`;
    csvContent += `CreatedDate:${finalCreatedDate}\n`;
    csvContent += `ModifiedDate:${finalModifiedDate}\n`;
    csvContent += `FileID:${finalFileId}\n`;
    const headers = ["Label", "ContactNumber", "ElectrodeDescription", "ContactDescription", "AssociatedLocation", "Mark", "SurgeonMark", "Type"];
    csvContent += headers.join(",") + "\n";

    // Create a map of electrode contacts for quick lookup
    const contactMap = {};
    designationData.forEach(electrode => {
        contactMap[electrode.label] = electrode.contacts;
    });

    // Use localization data structure but include marks from designation
    Object.entries(localizationData).forEach(([label, contacts]) => {
        const electrodeDescription = contacts.description;
        const electrodeType = contacts.type || 'DIXI'; // Default to DIXI if not specified
        const designationContacts = contactMap[label] || [];

        Object.entries(contacts).forEach(([contactNumber, contactData]) => {
            // Skip the 'description' and 'type' keys
            if (contactNumber === 'description' || contactNumber === 'type') return;

            const {
                contactDescription,
                associatedLocation
            } = contactData;

            // Find corresponding designation contact
            const designationContact = designationContacts.find(c => c.index === parseInt(contactNumber));
            const mark = designationContact ? designationContact.mark : 0;
            const surgeonMark = designationContact ? (designationContact.surgeonMark ? 1 : 0) : 0;

            const row = [
                label,
                contactNumber,
                electrodeDescription,
                contactDescription,
                associatedLocation,
                mark,
                surgeonMark,
                electrodeType
            ];
            csvContent += row.join(",") + "\n";
        });
    });

    if (download) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${type === 'resection' ? 'neurosurgery' : 'epilepsy'}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return csvContent;
}

/**
 * Saves a CSV file from data and downloads it or returns the data.
 *
 * @param {Object[]} stimulationData - The data to be saved.
 * @param {string} planOrder - The plan order for the stimulation.
 * @param {string} type - The type of stimulation.
 * @param {string} patientId - The patient ID for the first line.
 * @param {string} createdDate - The created date for the first line.
 * @param {string} modifiedDate - The modified date for the first line.
 * @param {boolean} download - Whether to download the file or return the data.
 * @returns {string} The CSV content.
 */
export function saveStimulationCSVFile(stimulationData, planOrder, type = 'mapping', patientId = '', createdDate = null, modifiedDate = null, download = true, fileId = null) {
    const currentDate = new Date().toISOString();
    const finalPatientId = patientId || stimulationData.patientId || '';
    const finalCreatedDate = createdDate || currentDate;
    const finalModifiedDate = modifiedDate || currentDate;
    const finalFileId = fileId || stimulationData.fileId || '';

    let csvContent = '';
    switch(type) {
        case 'mapping':
            csvContent = `${Identifiers.STIMULATION_FUNCTION}\n${IDENTIFIER_LINE_2}\n`;
            break;
        case 'recreation':
            csvContent = `${Identifiers.STIMULATION_RECREATION}\n${IDENTIFIER_LINE_2}\n`;
            break;
        case 'ccep':
            csvContent = `${Identifiers.STIMULATION_CCEP}\n${IDENTIFIER_LINE_2}\n`;
            break;
        default:
            throw new Error('Invalid stimulation type');
    }
    
    csvContent += `PatientID:${finalPatientId}\n`;
    csvContent += `CreatedDate:${finalCreatedDate}\n`;
    csvContent += `ModifiedDate:${finalModifiedDate}\n`;
    csvContent += `FileID:${finalFileId}\n`;
    const headers = ["Label", "ContactNumber", "ElectrodeDescription", "ContactDescription", "AssociatedLocation", "Mark", "SurgeonMark", "Pair", "IsPlanning", "Frequency", "Duration", "Current", "PlanOrder", "Type"];
    csvContent += headers.join(",") + "\n";

    // Create a map of electrode contacts for quick lookup
    const contactMap = {};
    stimulationData.forEach(electrode => {
        contactMap[electrode.label] = electrode.contacts;
    });

    // Reconstruct the data
    const output = stimulationData.map(electrode => {
        return electrode.contacts.map(contact => {
            let order = contact.isPlanning ? planOrder.indexOf(contact.id) : -1;
            return [
                electrode.label,
                contact.index,
                contact.__electrodeDescription__,
                contact.__contactDescription__,
                contact.associatedLocation,
                contact.mark,
                contact.surgeonMark,
                contact.pair,
                contact.isPlanning,
                contact.frequency,
                contact.duration,
                contact.current,
                order,
                type
            ].join(",");
        }).join("\n");
    })

    csvContent += output.join("\n");

    if (download) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `stimulation_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return csvContent;
}

/**
 * Saves a CSV file from data and downloads it or returns the data.
 *
 * @param {Object[]} testData - The test data to be saved.
 * @param {Object[]} contacts - Contacts associated with tests.
 * @param {string} patientId - The patient ID for the first line.
 * @param {string} createdDate - The created date for the first line.
 * @param {string} modifiedDate - The modified date for the first line.
 * @param {boolean} download - Whether to download the file or return the data.
 * @returns {string} The CSV content.
 */
export function saveTestCSVFile(testData, contacts, patientId = '', createdDate = null, modifiedDate = null, download = true, fileId = null) {
    const currentDate = new Date().toISOString();
    const finalPatientId = patientId || '';
    const finalCreatedDate = createdDate || currentDate;
    const finalModifiedDate = modifiedDate || currentDate;
    const finalFileId = fileId || testData.fileId || '';

    let csvContent = `${Identifiers.TEST_PLANNING}\n${IDENTIFIER_LINE_2}\n`;
    csvContent += `PatientID:${finalPatientId}\n`;
    csvContent += `CreatedDate:${finalCreatedDate}\n`;
    csvContent += `ModifiedDate:${finalModifiedDate}\n`;
    csvContent += `FileID:${finalFileId}\n`;
    const headers = [
            "Label",
            "ContactNumber",
            "ElectrodeDescription",
            "ContactDescription",
            "AssociatedLocation",
            "Mark",
            "SurgeonMark",
            "Pair",
            "Frequency",
            "Duration",
            "Current",
            "TestID",
            "TestName",
            "IsPlanning"
        ];

    // Create CSV rows
    const rows = contacts.map(electrode => {
        return electrode.contacts.map(contact => {
            const contactTests = testData[contact.id] || [];
            if (contactTests.length === 0) {
                return [
                    electrode.label, // Label
                    contact.index, // ContactNumber
                    contact.__electrodeDescription__, // ElectrodeDescription
                    contact.__contactDescription__, // ContactDescription
                    contact.associatedLocation, // AssociatedLocation
                    contact.mark, // Mark
                    contact.surgeonMark, // SurgeonMark
                    contact.pair, // Pair
                    contact.frequency, // Frequency
                    contact.duration, // Duration
                    contact.current, // Current
                    "No test", // No test
                    "No test name", // No test name
                    contact.isPlanning // IsPlanning
                ].join(",");
            }
            return contactTests.map(test => {
                return [
                    electrode.label, // Label
                    contact.index, // ContactNumber
                    contact.__electrodeDescription__, // ElectrodeDescription
                    contact.__contactDescription__, // ContactDescription
                    contact.associatedLocation, // AssociatedLocation
                    contact.mark, // Mark
                    contact.surgeonMark, // SurgeonMark
                    contact.pair, // Pair
                    contact.frequency, // Frequency
                    contact.duration, // Duration
                    contact.current, // Current
                    test.id, // TestID
                    test.name || "", // TestName
                    contact.isPlanning // IsPlanning
                ].join(",");
            });
        }).join("\n");
    });

    // Combine headers and rows into CSV format
    csvContent += [
        headers.join(','), // Header row
        ...rows // Data rows
    ].join('\n');

    if (download) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "neuropsychology_" + new Date().toISOString().split('T')[0] + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return csvContent;
}
