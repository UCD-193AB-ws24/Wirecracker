import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import * as CSVParser from "../CSVParser";
import Papa from 'papaparse';

// Mocks
vi.mock("papaparse", () => ({
    __esModule: true,
    default: {
        parse: vi.fn(),
        unparse: vi.fn(),
    },
}));
vi.mock("../pages/ContactDesignation/contact", () => {
    return {
        __esModule: true,
        default: function Contact(associatedLocation, mark, surgeonMark) {
            this.associatedLocation = associatedLocation;
            this.mark = mark;
            this.surgeonMark = surgeonMark;
        },
    };
});


describe("CSVParser Identifiers", () => {
    test("should have all expected keys and values", () => {
        expect(CSVParser.Identifiers.TEST_PLANNING).toContain("### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR TEST PLANNING ###");
        expect(CSVParser.Identifiers.LOCALIZATION).toContain("### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR LOCALIZATION ###");
        expect(CSVParser.Identifiers.DESIGNATION).toContain("### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR DESIGNATION ###");
        expect(CSVParser.Identifiers.STIMULATION).toContain("### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR CCEPS / SEIZURE RECREATION PLANNING ###");
        expect(CSVParser.Identifiers.STIMULATION_FUNCTION).toContain("### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR FUNCTIONAL MAPPING PLANNING ###");
        expect(CSVParser.Identifiers.STIMULATION_RECREATION).toContain("### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR SEIZURE RECREATION PLANNING ###");
        expect(CSVParser.Identifiers.STIMULATION_CCEP).toContain("### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR CCEPS PLANNING ###");
        expect(CSVParser.Identifiers.RESECTION).toContain("### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR RESECTION ###");
    });
});

describe("parseCSVFile", () => {
    let file, onLoad, onError;
    beforeEach(() => {
        file = new Blob([""]);
        global.FileReader = vi.fn(() => ({
            readAsText: vi.fn(function () {
                setTimeout(() => {
                    if (onLoad) this.onload({ target: { result: onLoad } });
                    if (onError) this.onerror();
                }, 0);
            }),
            onload: null,
            onerror: null,
        }));
    });

    test("rejects if no file", async () => {
        await expect(CSVParser.parseCSVFile(null)).rejects.toThrow("No file provided.");
    });

    test("rejects if invalid identifier", async () => {
        onLoad = "INVALID\n### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###\n";
        await expect(CSVParser.parseCSVFile(file)).rejects.toThrow("Invalid file. The first line must be the correct identifier.");
    });

    test("calls showError on invalid identifier", async () => {
        onLoad = "INVALID\n### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###\n";
        const showError = vi.fn();
        await expect(CSVParser.parseCSVFile(file, false, showError)).rejects.toThrow();
        expect(showError).toHaveBeenCalledWith("Invalid file. The first line must be the correct identifier.");
    });

    test("parses LOCALIZATION identifier", async () => {
        onLoad = `${CSVParser.Identifiers.LOCALIZATION}\n### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###\nPatientID:pid\nCreatedDate:cd\nModifiedDate:md\nFileID:fid\nLabel,ContactNumber,ElectrodeDescription,ContactDescription,AssociatedLocation,Type\nA,1,Desc,ContDesc,GM,DIXI\n`;
        Papa.parse.mockReturnValueOnce({
            data: [
                { Label: "A", ContactNumber: "1", ElectrodeDescription: "Desc", ContactDescription: "ContDesc", AssociatedLocation: "GM", Type: "DIXI" },
            ],
        });
        const result = await CSVParser.parseCSVFile(file);
        expect(result.identifier).toBe(CSVParser.Identifiers.LOCALIZATION);
        expect(result.data).toBeDefined();
        expect(result.metadata.patientId).toBe("pid");
    });

    test("parses DESIGNATION identifier", async () => {
        onLoad = `${CSVParser.Identifiers.DESIGNATION}\n### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###\nPatientID:pid\nCreatedDate:cd\nModifiedDate:md\nFileID:fid\nLabel,ContactNumber,ElectrodeDescription,ContactDescription,AssociatedLocation,Mark,SurgeonMark,Type\nA,1,Desc,ContDesc,GM,1,1,DIXI\n`;
        Papa.parse.mockReturnValueOnce({
            data: [
                { Label: "A", ContactNumber: "1", ElectrodeDescription: "Desc", ContactDescription: "ContDesc", AssociatedLocation: "GM", Mark: "1", SurgeonMark: "1", Type: "DIXI" },
            ],
        });
        Papa.parse.mockReturnValueOnce({
            data: [
                { Label: "A", ContactNumber: "1", ElectrodeDescription: "Desc", ContactDescription: "ContDesc", AssociatedLocation: "GM", Mark: "1", SurgeonMark: "1", Type: "DIXI" },
            ],
        });
        const result = await CSVParser.parseCSVFile(file);
        expect(result.identifier).toBe(CSVParser.Identifiers.DESIGNATION);
        expect(result.data.originalData).toBeDefined();
        expect(result.data.data).toBeDefined();
    });

    test("parses STIMULATION identifier", async () => {
        onLoad = `${CSVParser.Identifiers.STIMULATION}\n### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###\nPatientID:pid\nCreatedDate:cd\nModifiedDate:md\nFileID:fid\nLabel,ContactNumber,ElectrodeDescription,ContactDescription,AssociatedLocation,Mark,SurgeonMark,Pair,IsPlanning,Frequency,Duration,Current,PlanOrder\nA,1,Desc,ContDesc,GM,1,true,1,true,100,3,2,0\n`;
        Papa.parse.mockReturnValueOnce({
            data: [
                { Label: "A", ContactNumber: "1", ElectrodeDescription: "Desc", ContactDescription: "ContDesc", AssociatedLocation: "GM", Mark: "1", SurgeonMark: "true", Pair: "1", IsPlanning: "true", Frequency: "100", Duration: "3", Current: "2", PlanOrder: "0" },
            ],
        });
        const result = await CSVParser.parseCSVFile(file);
        expect(result.identifier).toBe(CSVParser.Identifiers.STIMULATION);
        expect(result.data.data).toBeDefined();
        expect(result.data.planOrder).toBeDefined();
    });

    test("parses TEST_PLANNING identifier", async () => {
        onLoad = `${CSVParser.Identifiers.TEST_PLANNING}\n### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###\nPatientID:pid\nCreatedDate:cd\nModifiedDate:md\nFileID:fid\nLabel,ContactNumber,ElectrodeDescription,ContactDescription,AssociatedLocation,Mark,SurgeonMark,Pair,Frequency,Duration,Current,TestID,TestName,IsPlanning\nA,1,Desc,ContDesc,GM,1,true,1,100,3,2,5,TestName,true\n`;
        Papa.parse.mockReturnValueOnce({
            data: [
                { Label: "A", ContactNumber: "1", ElectrodeDescription: "Desc", ContactDescription: "ContDesc", AssociatedLocation: "GM", Mark: "1", SurgeonMark: "true", Pair: "1", Frequency: "100", Duration: "3", Current: "2", TestID: "5", TestName: "TestName", IsPlanning: "true" },
            ],
        });
        const result = await CSVParser.parseCSVFile(file);
        expect(result.identifier).toBe(CSVParser.Identifiers.TEST_PLANNING);
        expect(result.data.contacts).toBeDefined();
        expect(result.data.tests).toBeDefined();
    });

    test("parses coordinates mode", async () => {
        onLoad = "x,y,z\n1,2,3\n";
        Papa.parse.mockReturnValueOnce({
            data: [
                { x: "1", y: "2", z: "3" },
            ],
        });
        const result = await CSVParser.parseCSVFile(file, true);
        expect(result.identifier).toBe("coordinates");
        expect(result.data[0].x).toBe("1");
    });

    test("calls showError on file read error", async () => {
        onError = true;
        const showError = vi.fn();
        await expect(CSVParser.parseCSVFile(file, false, showError)).rejects.toThrow("Invalid file. The first line must be the correct identifier.");
        expect(showError).toHaveBeenCalledWith("Invalid file. The first line must be the correct identifier.");
    });
});

describe("saveCSVFile", () => {
    let origBlob, origCreateElement, origCreateObjectURL, origAppendChild, origRemoveChild;
    beforeEach(() => {
        origBlob = global.Blob;
        origCreateElement = document.createElement;
        origCreateObjectURL = global.URL.createObjectURL;
        origAppendChild = document.body.appendChild;
        origRemoveChild = document.body.removeChild;
        global.Blob = vi.fn();
        document.createElement = vi.fn(() => ({
            click: vi.fn(),
            set href(val) {},
            set download(val) {},
        }));
        global.URL.createObjectURL = vi.fn(() => "blob:url");
        document.body.appendChild = vi.fn();
        document.body.removeChild = vi.fn();
        Papa.unparse.mockReturnValue("csvstring");
    });
    afterEach(() => {
        global.Blob = origBlob;
        document.createElement = origCreateElement;
        global.URL.createObjectURL = origCreateObjectURL;
        document.body.appendChild = origAppendChild;
        document.body.removeChild = origRemoveChild;
    });

    test("calls Blob and triggers download for LOCALIZATION", () => {
        const data = {
            A: {
                description: "Desc",
                type: "DIXI",
                1: { contactDescription: "ContDesc", associatedLocation: "GM" },
            },
        };
        CSVParser.saveCSVFile(CSVParser.Identifiers.LOCALIZATION, data, "pid", "cd", "md", true, "fid");
        expect(global.Blob).toHaveBeenCalled();
        expect(document.createElement).toHaveBeenCalledWith("a");
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });

    test("returns parsed data if download=false", () => {
        const data = {
            A: {
                description: "Desc",
                type: "DIXI",
                1: { contactDescription: "ContDesc", associatedLocation: "GM" },
            },
        };
        Papa.unparse.mockReturnValueOnce("csvstring");
        CSVParser.saveCSVFile(CSVParser.Identifiers.DESIGNATION, data, "pid", "cd", "md", false, "fid");
        expect(Papa.unparse).toHaveBeenCalled();
    });
});

describe("saveDesignationCSVFile", () => {
    let origBlob, origCreateElement, origCreateObjectURL, origAppendChild, origRemoveChild;
    beforeEach(() => {
        origBlob = global.Blob;
        origCreateElement = document.createElement;
        origCreateObjectURL = global.URL.createObjectURL;
        origAppendChild = document.body.appendChild;
        origRemoveChild = document.body.removeChild;
        global.Blob = vi.fn();
        document.createElement = vi.fn(() => ({
            click: vi.fn(),
            set href(val) {},
            set download(val) {},
        }));
        global.URL.createObjectURL = vi.fn(() => "blob:url");
        document.body.appendChild = vi.fn();
        document.body.removeChild = vi.fn();
    });
    afterEach(() => {
        global.Blob = origBlob;
        document.createElement = origCreateElement;
        global.URL.createObjectURL = origCreateObjectURL;
        document.body.appendChild = origAppendChild;
        document.body.removeChild = origRemoveChild;
    });

    test("calls Blob and triggers download", () => {
        const designationData = [
            { label: "A", contacts: [{ index: 1, mark: 1, surgeonMark: true }] },
        ];
        const localizationData = {
            A: {
                description: "Desc",
                type: "DIXI",
                1: { contactDescription: "ContDesc", associatedLocation: "GM" },
            },
        };
        CSVParser.saveDesignationCSVFile(designationData, localizationData, "pid", "cd", "md", true, "designation", "fid");
        expect(global.Blob).toHaveBeenCalled();
        expect(document.createElement).toHaveBeenCalledWith("a");
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });

    test("returns CSV string", () => {
        const designationData = [
            { label: "A", contacts: [{ index: 1, mark: 1, surgeonMark: true }] },
        ];
        const localizationData = {
            A: {
                description: "Desc",
                type: "DIXI",
                1: { contactDescription: "ContDesc", associatedLocation: "GM" },
            },
        };
        const result = CSVParser.saveDesignationCSVFile(designationData, localizationData, "pid", "cd", "md", false, "designation", "fid");
        expect(typeof result).toBe("string");
        expect(result).toContain("Label,ContactNumber,ElectrodeDescription");
    });
});

describe("saveStimulationCSVFile", () => {
    let origBlob, origCreateElement, origCreateObjectURL, origAppendChild, origRemoveChild;
    beforeEach(() => {
        origBlob = global.Blob;
        origCreateElement = document.createElement;
        origCreateObjectURL = global.URL.createObjectURL;
        origAppendChild = document.body.appendChild;
        origRemoveChild = document.body.removeChild;
        global.Blob = vi.fn();
        document.createElement = vi.fn(() => ({
            click: vi.fn(),
            set href(val) {},
            set download(val) {},
        }));
        global.URL.createObjectURL = vi.fn(() => "blob:url");
        document.body.appendChild = vi.fn();
        document.body.removeChild = vi.fn();
    });
    afterEach(() => {
        global.Blob = origBlob;
        document.createElement = origCreateElement;
        global.URL.createObjectURL = origCreateObjectURL;
        document.body.appendChild = origAppendChild;
        document.body.removeChild = origRemoveChild;
    });

    const stimData = [
        {
            label: "A",
            contacts: [
                {
                    id: "A1",
                    index: 1,
                    __electrodeDescription__: "Desc",
                    __contactDescription__: "ContDesc",
                    associatedLocation: "GM",
                    mark: 1,
                    surgeonMark: true,
                    pair: 1,
                    isPlanning: true,
                    frequency: 100,
                    duration: 3,
                    current: 2,
                },
            ],
        },
    ];
    const planOrder = ["A1"];

    test("calls Blob and triggers download for mapping", () => {
        CSVParser.saveStimulationCSVFile(stimData, planOrder, "mapping", "pid", "cd", "md", true, "fid");
        expect(global.Blob).toHaveBeenCalled();
        expect(document.createElement).toHaveBeenCalledWith("a");
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });

    test("calls Blob and triggers download for recreation", () => {
        CSVParser.saveStimulationCSVFile(stimData, planOrder, "recreation", "pid", "cd", "md", true, "fid");
        expect(global.Blob).toHaveBeenCalled();
    });

    test("calls Blob and triggers download for ccep", () => {
        CSVParser.saveStimulationCSVFile(stimData, planOrder, "ccep", "pid", "cd", "md", true, "fid");
        expect(global.Blob).toHaveBeenCalled();
    });

    test("throws error on invalid type", () => {
        expect(() => CSVParser.saveStimulationCSVFile(stimData, planOrder, "invalid", "pid", "cd", "md", true, "fid")).toThrow("Invalid stimulation type");
    });

    test("returns CSV string", () => {
        const result = CSVParser.saveStimulationCSVFile(stimData, planOrder, "mapping", "pid", "cd", "md", false, "fid");
        expect(typeof result).toBe("string");
        expect(result).toContain("Label,ContactNumber,ElectrodeDescription");
    });
});

describe("saveTestCSVFile", () => {
    let origBlob, origCreateElement, origCreateObjectURL, origAppendChild, origRemoveChild;
    beforeEach(() => {
        origBlob = global.Blob;
        origCreateElement = document.createElement;
        origCreateObjectURL = global.URL.createObjectURL;
        origAppendChild = document.body.appendChild;
        origRemoveChild = document.body.removeChild;
        global.Blob = vi.fn();
        document.createElement = vi.fn(() => ({
            click: vi.fn(),
            set href(val) {},
            set download(val) {},
        }));
        global.URL.createObjectURL = vi.fn(() => "blob:url");
        document.body.appendChild = vi.fn();
        document.body.removeChild = vi.fn();
    });
    afterEach(() => {
        global.Blob = origBlob;
        document.createElement = origCreateElement;
        global.URL.createObjectURL = origCreateObjectURL;
        document.body.appendChild = origAppendChild;
        document.body.removeChild = origRemoveChild;
    });

    const contacts = [
        {
            label: "A",
            contacts: [
                {
                    id: "A1",
                    index: 1,
                    __electrodeDescription__: "Desc",
                    __contactDescription__: "ContDesc",
                    associatedLocation: "GM",
                    mark: 1,
                    surgeonMark: true,
                    pair: 1,
                    frequency: 100,
                    duration: 3,
                    current: 2,
                    isPlanning: true,
                },
            ],
        },
    ];

    test("calls Blob and triggers download with tests", () => {
        const testData = {
            A1: [{ id: 5, name: "TestName" }],
        };
        CSVParser.saveTestCSVFile(testData, contacts, "pid", "cd", "md", true, "fid");
        expect(global.Blob).toHaveBeenCalled();
        expect(document.createElement).toHaveBeenCalledWith("a");
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });

    test("calls Blob and triggers download with no tests", () => {
        const testData = {};
        CSVParser.saveTestCSVFile(testData, contacts, "pid", "cd", "md", true, "fid");
        expect(global.Blob).toHaveBeenCalled();
    });

    test("returns CSV string", () => {
        const testData = {
            A1: [{ id: 5, name: "TestName" }],
        };
        const result = CSVParser.saveTestCSVFile(testData, contacts, "pid", "cd", "md", false, "fid");
        expect(typeof result).toBe("string");
        expect(result).toContain("Label,ContactNumber,ElectrodeDescription");
    });
});