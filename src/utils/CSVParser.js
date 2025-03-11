import Papa from 'papaparse';
import contact from '../pages/ContactDesignation/contact';

const IDENTIFIER_LINE_2 = "### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###";

/**
 * Enum for different identifiers fr different pages
 * @readonly
 * @enum {string}
 */
export const Identifiers = Object.freeze({
    TEST_PLANNING:  "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR TEST PLANNING ###",
    LOCALIZATION:   "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR LOCALIZATION ###",
});

/**
 * Parses a CSV file and returns the parsed data.
 *
 * @param {File} file - The CSV file to be parsed.
 * @returns {Promise<{ identifier: string, data: Object }>} A promise that resolves with the identifier and parsed CSV data.
 */
export function parseCSVFile( file, coordinates = false ) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file provided."));
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const fileContent = e.target.result;
            const lines = fileContent.split(/\r?\n/);

            console.log(lines[0].trim());
            console.log(lines[1].trim());

            if (!coordinates && (lines.length < 2 || (lines[0].trim() !== Identifiers.TEST_PLANNING && 
                lines[0].trim() !== Identifiers.LOCALIZATION) || lines[1].trim() !== IDENTIFIER_LINE_2)) {
                reject(new Error("Invalid file. The first line must be the correct identifier."));
                return;
            }

            let identifier;
            if (!coordinates) {
                identifier = lines[0].trim();
            } else {
                identifier = "coordinates";
            }
            // Parse CSV content excluding the identifier line
            const csvWithoutIdentifier = lines.slice(2).join("\n");

            if (identifier === Identifiers.LOCALIZATION) {
                resolve({ identifier, data: parseLocalization(csvWithoutIdentifier) });
                return;
            }
            else if (identifier === "designation") {
                resolve({ identifier, data: parseDesignation(csvWithoutIdentifier) });
                return;
            }

            Papa.parse(csvWithoutIdentifier, {
                header: true,
                comments: "#",
                skipEmptyLines: true,
                dynamicTyping: true, // Ensures correct data types for numbers
                complete: function (results) {
                    resolve({ identifier, data: results.data });
                },
                error: function (err) {
                    reject(new Error("Parsing error: " + err.message));
                }
            });
        };

        reader.onerror = function () {
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
        
        if (!parsedData[label]) {
            parsedData[label] = { 'description' : electrodeDescription };
        }
        parsedData[label][contactNumber] = {
            contactDescription,
            associatedLocation
        };
    });
    
    return parsedData;
}

/**
 * Parses localization CSV data into a nested dictionary format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A data structure with the format [{ label: 'A'', contacts: [contact, contact, ...] }, ... ]
 */
function parseDesignation(csvData) {
    const parsedData = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    
    // First pass: Group by electrode label and collect contacts
    rows.forEach(row => {
        const label = row.Electrode.trim();
        const contactNumber = parseInt(row.Contact);
        let associatedLocation = row.AssociatedLocation;
        const contactDescription = row.ContactDescription;
        const mark = parseInt(row.Mark) || 0; // Default to 0 if not specified
        const surgeonMark = parseInt(row.SurgeonMark) === 1; // Convert to boolean from int (0 or 1)
        
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
        
        const contactObj = new contact(associatedLocation, mark, surgeonMark);
        
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
        contacts: electrode.contacts.filter(contact => contact !== null) // Remove any null entries
    }));
}

/**
 * Saves a CSV file from data and downloads it.
 * 
 * @param {string} identifier - The identifier for the first line.
 * @param {Object} data - The data to be saved.
 */
export function saveCSVFile(identifier, data) {
    let csvContent = `${identifier}\n${IDENTIFIER_LINE_2}\n`;
    
    if (identifier === Identifiers.LOCALIZATION) {
        const headers = ["Label", "ContactNumber", "ElectrodeDescription", "ContactDescription", "AssociatedLocation", "Mark", "SurgeonMark"];
        csvContent += headers.join(",") + "\n";
        
        Object.entries(data).forEach(([label, contacts]) => {
            const electrodeDescription = contacts.description;
            Object.entries(contacts).forEach(([contactNumber, contactData]) => {
                // Skip the 'description' key, as it's not a contact
                if (contactNumber === 'description') return;

                const {
                    contactDescription,
                    associatedLocation
                } = contactData;

                const row = [label, contactNumber, electrodeDescription, contactDescription, associatedLocation, 0, 0];
                csvContent += row.join(",") + "\n";
            });
        });
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "localization_" + new Date().toISOString().split('T')[0] + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
