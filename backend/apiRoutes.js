import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import cors from 'cors';

dotenv.config();
const router = express.Router();  

// Supabase Client Initialization
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.use(cors());
router.use(express.json());

// lazy solution
const TABLE_NAMES = [
  "cort_gm",
  "cort",
  "function",
  "function_test",
  "gm",
  "gm_function",
  "reference",
  "stimulation",
  "tag",
  "test",
  "test_tag",
  "electrode",
  "localization",
  "region_name"
];

// Fetch table names
router.get("/tables", async (req, res) => {
  res.json({ tables: TABLE_NAMES });
});

// Fetch data from a specific table
router.get("/tables/:table", async (req, res) => {
  const { table } = req.params;
  
  if (!TABLE_NAMES.includes(table)) {
    return res.status(400).json({ error: "Invalid table name" });
  }

  try {
    const { data, error } = await supabase.from(table).select("*").limit(100);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Error fetching table data" });
  }
});

// Endpoint to save localization data
router.post('/save-localization', async (req, res) => {
  try {
    const data = req.body; // Data sent from the frontend
    await saveLocalizationToDatabase(data);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving localization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generates an acronym from a description.
 * @param {string} description - The description to generate an acronym from.
 * @returns {string} - The generated acronym.
 */
function generateAcronym(description) {
  return description
    .split('')
    .filter(char => char >= 'A' && char <= 'Z')
    .join('');
}

/**
 * Inserts new regions into the region_name table and returns a mapping of region names to their IDs.
 * @param {string[]} regions - Array of region names.
 * @returns {Object} - A mapping of region names to their IDs.
 */
async function insertRegionsAndGetIds(regions) {
  const regionIdMap = {};

  // Fetch existing regions
  const { data: existingRegions, error: fetchError } = await supabase
    .from('region_name')
    .select('id, name');

  if (fetchError) throw fetchError;

  // Add existing regions to the map
  existingRegions.forEach(region => {
    regionIdMap[region.name] = region.id;
  });

  // Filter out regions that already exist
  const newRegions = regions.filter(region => region && !regionIdMap[region]);

  if (newRegions.length > 0) {
    // Insert new regions
    const { data: insertedRegions, error: insertError } = await supabase
      .from('region_name')
      .insert(newRegions.map(name => ({ name })))
      .select();

    if (insertError) throw insertError;

    // Add new regions to the map
    insertedRegions.forEach(region => {
      regionIdMap[region.name] = region.id;
    });
  }

  return regionIdMap;
}

/**
 * Saves localization data to the database in the format of the three tables.
 * @param {Object} data - The nested dictionary data from parseLocalization.
 */
async function saveLocalizationToDatabase(data) {
  try {
    // Insert into electrode table
    const electrodeData = Object.keys(data).map(label => ({
      acronym: generateAcronym(data[label].description),  // Generate acronym from description
      description: data[label].description, // Use description as electrode_desc
      contact_number: Object.keys(data[label]).length - 1 // Subtract 1 to exclude the 'description' key
    }));

    const { data: insertedElectrodes, error: electrodeError } = await supabase
      .from('electrode')
      .insert(electrodeData)
      .select();

    if (electrodeError) throw electrodeError;

    // Create a mapping of electrode labels to their database IDs
    const electrodeIdMap = {};
    insertedElectrodes.forEach(electrode => {
      electrodeIdMap[electrode.acronym] = electrode.id;
    });

    // Collect all unique regions from the data
    const uniqueRegions = new Set();
    Object.values(data).forEach(contacts => {
      Object.values(contacts).forEach(contactData => {
        if (contactData.associatedLocation === 'GM/GM') {
          const [desc1, desc2] = contactData.contactDescription.split('+');
          uniqueRegions.add(desc1);
          uniqueRegions.add(desc2);
        }
        else if (contactData.associatedLocation === 'GM' || contactData.associatedLocation === 'GM/WM') {
          uniqueRegions.add(contactData.contactDescription);
        }
      });
    });

    // Insert new regions and get a mapping of region names to IDs
    const regionIdMap = await insertRegionsAndGetIds(Array.from(uniqueRegions));

    // Get the highest existing ID in the localization table
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('localization')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (maxIdError) throw maxIdError;

    let nextId = maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

    // Insert into localization table
    const localizationData = [];
    Object.entries(data).forEach(([label, contacts]) => {
      Object.entries(contacts).forEach(([contactNumber, contactData]) => {
        if (contactNumber === 'description') return; // Skip the description key

        const { contactDescription, associatedLocation } = contactData;
        const acronym = generateAcronym(data[label].description)

        // Handle GM/GM case: Split into two entries
        if (associatedLocation === 'GM/GM') {
          const [desc1, desc2] = contactDescription.split('+');
          localizationData.push(
            {
              id: nextId++,
              electrode_id: electrodeIdMap[acronym],
              contact: contactNumber,
              tissue_type: 'GM',
              region_id: regionIdMap[desc1] // Use region ID from the map
            },
            {
              id: nextId++,
              electrode_id: electrodeIdMap[acronym],
              contact: contactNumber,
              tissue_type: 'GM',
              region_id: regionIdMap[desc2] // Use region ID from the map
            }
          );
        } else {
          localizationData.push({
            id: nextId++,
            electrode_id: electrodeIdMap[acronym],
            contact: contactNumber,
            tissue_type: associatedLocation,
            region_id: regionIdMap[contactDescription] // Use region ID from the map
          });
        }
      });
    });

    const { error: localizationError } = await supabase
      .from('localization')
      .insert(localizationData, { defaultToNull: true });

    if (localizationError) throw localizationError;

    console.log("Data successfully saved to the database.");
  } catch (error) {
    console.error("Error saving data to the database:", error);
  }
}

export default router;
