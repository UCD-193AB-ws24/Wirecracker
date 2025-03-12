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
    console.log('Received localization save request:', req.body);
    
    const { electrodes, fileId } = req.body;
    
    // Input validation
    if (!electrodes) {
      return res.status(400).json({ success: false, error: 'Missing electrodes data' });
    }
    
    if (!fileId) {
      return res.status(400).json({ success: false, error: 'Missing file ID' });
    }
    
    if (Object.keys(electrodes).length === 0) {
      return res.status(400).json({ success: false, error: 'Electrodes data is empty' });
    }
    
    // Check if the files table exists
    try {
      const { data: filesTableData, error: filesTableError } = await supabase
        .from('files')
        .select('*')
        .limit(1);
        
      if (filesTableError) {
        console.error('Error checking files table:', filesTableError);
        return res.status(500).json({ 
          success: false, 
          error: `Database error: ${filesTableError.message}`,
          details: 'Failed to verify files table exists'
        });
      }
    } catch (tableCheckError) {
      console.error('Exception checking files table:', tableCheckError);
      return res.status(500).json({ 
        success: false, 
        error: tableCheckError.message,
        details: 'Failed to verify files table exists'
      });
    }
    
    // Process the save operation
    await saveLocalizationToDatabase(electrodes, fileId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving localization:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
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
 * @param {string} fileId - The unique file identifier
 */
async function saveLocalizationToDatabase(data, fileId) {
  try {
    console.log('Processing electrode data for saving...');
    
    // Insert into electrode table
    const electrodeData = Object.keys(data).map(label => ({
      acronym: generateAcronym(data[label].description),  // Generate acronym from description
      description: data[label].description, // Use description as electrode_desc
      contact_number: Object.keys(data[label]).length - 1 // Subtract 1 to exclude the 'description' key
    }));

    console.log('Inserting electrode data:', electrodeData);
    
    const { data: insertedElectrodes, error: electrodeError } = await supabase
      .from('electrode')
      .insert(electrodeData)
      .select();

    if (electrodeError) {
      console.error('Error inserting electrodes:', electrodeError);
      throw new Error(`Failed to insert electrodes: ${electrodeError.message}`);
    }

    // Create a mapping of electrode labels to their database IDs
    const electrodeIdMap = {};
    insertedElectrodes.forEach(electrode => {
      electrodeIdMap[electrode.acronym] = electrode.id;
    });

    console.log('Electrode ID mapping:', electrodeIdMap);

    // Collect all unique regions from the data
    const uniqueRegions = new Set();
    Object.values(data).forEach(contacts => {
      Object.values(contacts).forEach(contactData => {
        if (typeof contactData === 'object' && contactData.associatedLocation) {
          if (contactData.associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactData.contactDescription.split('+');
            uniqueRegions.add(desc1);
            uniqueRegions.add(desc2);
          }
          else if (contactData.associatedLocation === 'GM' || contactData.associatedLocation === 'GM/WM') {
            uniqueRegions.add(contactData.contactDescription);
          }
        }
      });
    });

    console.log('Unique regions:', Array.from(uniqueRegions));
    
    // Insert new regions and get a mapping of region names to IDs
    const regionIdMap = await insertRegionsAndGetIds(Array.from(uniqueRegions));
    
    console.log('Region ID mapping:', regionIdMap);

    // Get the highest existing ID in the localization table
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('localization')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error('Error getting max localization ID:', maxIdError);
      throw new Error(`Failed to get max localization ID: ${maxIdError.message}`);
    }

    let nextId = maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
    console.log('Next localization ID:', nextId);

    // Insert into localization table with file_id
    const localizationData = [];
    Object.entries(data).forEach(([label, contacts]) => {
      Object.entries(contacts).forEach(([contactNumber, contactData]) => {
        if (contactNumber === 'description') return; // Skip the description key
        if (typeof contactData !== 'object' || !contactData.associatedLocation) return; // Skip invalid entries

        const { contactDescription, associatedLocation } = contactData;
        const acronym = generateAcronym(data[label].description);

        // Handle GM/GM case: Split into two entries
        if (associatedLocation === 'GM/GM') {
          const [desc1, desc2] = contactDescription.split('+');
          localizationData.push(
            {
              id: nextId++,
              electrode_id: electrodeIdMap[acronym],
              contact: contactNumber,
              tissue_type: 'GM',
              region_id: regionIdMap[desc1], // Use region ID from the map
              file_id: fileId // Add file ID to localization record
            },
            {
              id: nextId++,
              electrode_id: electrodeIdMap[acronym],
              contact: contactNumber,
              tissue_type: 'GM',
              region_id: regionIdMap[desc2], // Use region ID from the map
              file_id: fileId // Add file ID to localization record
            }
          );
        } else {
          localizationData.push({
            id: nextId++,
            electrode_id: electrodeIdMap[acronym],
            contact: contactNumber,
            tissue_type: associatedLocation,
            region_id: regionIdMap[contactDescription], // Use region ID from the map
            file_id: fileId // Add file ID to localization record
          });
        }
      });
    });

    console.log(`Inserting ${localizationData.length} localization records...`);
    
    if (localizationData.length === 0) {
      console.warn('No localization data to insert');
      return;
    }

    const { error: localizationError } = await supabase
      .from('localization')
      .insert(localizationData, { defaultToNull: true });

    if (localizationError) {
      console.error('Error inserting localization data:', localizationError);
      throw new Error(`Failed to insert localization data: ${localizationError.message}`);
    }

    console.log("Data successfully saved to the database.");
  } catch (error) {
    console.error("Error saving data to the database:", error);
    throw error; // Re-throw to propagate to the API endpoint handler
  }
}

export default router;
