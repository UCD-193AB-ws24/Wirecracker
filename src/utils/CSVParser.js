import Papa from 'papaparse';

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
export function parseCSVFile( file ) {
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

            if (lines.length < 2 || (lines[0].trim() !== Identifiers.TEST_PLANNING && 
                lines[0].trim() !== Identifiers.LOCALIZATION) || lines[1].trim() !== IDENTIFIER_LINE_2) {
                reject(new Error("Invalid file. The first line must be the correct identifier."));
                return;
            }

            const identifier = lines[0].trim();
            // Parse CSV content excluding the identifier line
            const csvWithoutIdentifier = lines.slice(2).join("\n");

            if (identifier === Identifiers.LOCALIZATION) {
                resolve({ identifier, data: parseLocalization(csvWithoutIdentifier) });
                return;
            }

            Papa.parse(csvWithoutIdentifier, {
                header: true,
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
            parsedData[label] = {};
        }
        parsedData[label][contactNumber] = {
            electrodeDescription,
            contactDescription,
            associatedLocation
        };
    });
    
    return parsedData;
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
        const headers = ["Label", "ContactNumber", "ElectrodeDescription", "ContactDescription", "AssociatedLocation", "Mark", "SurgeonMark", "x", "y", "z"];
        csvContent += headers.join(",") + "\n";
        
        Object.entries(data).forEach(([label, contacts]) => {
            Object.entries(contacts).forEach(([contactNumber, contactData]) => {
                // Skip the 'description' key, as it's not a contact
                if (contactNumber === 'description') return;

                const {
                    electrodeDescription,
                    contactDescription,
                    associatedLocation
                } = contactData;

                const row = [label, contactNumber, electrodeDescription, contactDescription, associatedLocation, "", "", "", "", ""];
                csvContent += row.join(",") + "\n";
            });
        });
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
