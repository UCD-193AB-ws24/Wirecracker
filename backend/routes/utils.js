import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase Client Initialization
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Table names constant
export const TABLE_NAMES = [
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

/**
 * Handles file record management in the database.
 * Creates a new file record if it doesn't exist, or updates an existing one.
 * @param {string} fileId - The unique identifier for the file
 * @param {string} fileName - The name of the file
 * @param {string} creationDate - The creation date of the file
 * @param {string} modifiedDate - The last modified date of the file
 * @param {string} token - The authorization token for the user session
 * @param {string} patientId - The ID of the patient associated with the file
 * @returns {Promise<void>} - Resolves when the operation is complete, throws on error
 */
export async function handleFileRecord(fileId, fileName, creationDate, modifiedDate, token, patientId) {
  // Check if file record already exists
  const { data: existingFile } = await supabase
    .from('files')
    .select('*')
    .eq('file_id', fileId)
    .single();

  if (existingFile) {
    // Update existing file record
    const { error: fileError } = await supabase
      .from('files')
      .update({
        filename: fileName,
        modified_date: modifiedDate,
        patient_id: patientId
      })
      .eq('file_id', fileId);

    if (fileError) throw fileError;
  } else {
    // Get user ID from session
    if (!token) {
      throw new Error('No authentication token provided');
    }
    
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', token)
      .single();
      
    if (!session?.user_id) {
      throw new Error('Invalid or expired session');
    }

    // Insert new file record
    const { error: fileError } = await supabase
      .from('files')
      .insert({
        file_id: fileId,
        owner_user_id: session.user_id,
        filename: fileName,
        creation_date: creationDate,
        modified_date: modifiedDate,
        patient_id: patientId
      });

    if (fileError) throw fileError;
  }
}

/**
 * Generates an acronym from a description.
 * @param {string} description - The description to generate an acronym from.
 * @returns {string} - The generated acronym.
 */
export function generateAcronym(description) {
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
export async function insertRegionsAndGetIds(regions) {
  const regionIdMap = {};

  try {
    // Fetch existing regions
    const { data: existingRegions, error: fetchError } = await supabase
      .from('region_name')
      .select('id, name');

    if (fetchError) {
      console.error('Error fetching existing regions:', fetchError);
      console.error('Error details:', JSON.stringify(fetchError));
      throw fetchError;
    }

    // Create a map of lowercase names to their database versions and IDs
    const existingNamesMap = new Map();
    existingRegions.forEach(region => {
      const lowerName = region.name.toLowerCase();
      existingNamesMap.set(lowerName, {
        id: region.id,
        name: region.name
      });
    });

    // Filter out regions that already exist (case-insensitive)
    const newRegionsSet = new Set();
    const newRegions = regions.filter(region => {
      if (!region) return false;
      const lowerRegion = region.toLowerCase();
      
      // If this region (case-insensitive) already exists
      if (existingNamesMap.has(lowerRegion)) {
        // Use the existing version from the database
        const existing = existingNamesMap.get(lowerRegion);
        regionIdMap[existing.name] = existing.id; // Only map the database version
        return false;
      }
      
      // If we haven't seen this region (case-insensitive) in this batch
      if (!newRegionsSet.has(lowerRegion)) {
        newRegionsSet.add(lowerRegion);
        return true;
      }
      
      return false;
    });

    if (newRegions.length > 0) {
      console.log(`Inserting ${newRegions.length} new regions:`, newRegions);
      
      // Insert new regions
      const { data: insertedRegions, error: insertError } = await supabase
        .from('region_name')
        .insert(newRegions.map(name => ({ name })))
        .select();

      if (insertError) {
        console.error('Error inserting new regions:', insertError);
        console.error('Error details:', JSON.stringify(insertError));
        console.error('New regions data:', newRegions);
        throw insertError;
      }

      console.log(`Successfully inserted ${insertedRegions.length} new regions`);
      
      // Add new regions to the map
      insertedRegions.forEach(region => {
        regionIdMap[region.name] = region.id;
      });
    }

    return regionIdMap;
  } catch (error) {
    console.error('Error in insertRegionsAndGetIds:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
* Saves localization data to the database in the format of the three tables.
* @param {Object} data - The nested dictionary data from parseLocalization.
* @param {number|string} fileId - The unique file identifier
*/
export async function saveLocalizationToDatabase(data, fileId) {
 try {
   console.log(`Starting save process for file ID: ${fileId}`);
   
   // Ensure fileId is an integer
   const numericFileId = typeof fileId === 'string' ? parseInt(fileId) : fileId;
   
   if (isNaN(numericFileId)) {
     throw new Error(`Invalid file ID: ${fileId} (must be a valid number)`);
   }
   
   console.log(`Saving ${Object.keys(data).length} electrodes for file ID: ${numericFileId}`);
   console.log('Sample data structure:', JSON.stringify(Object.entries(data)[0], null, 2));
   
   // Insert into electrode table
   const electrodeData = Object.keys(data).map(label => ({
     acronym: generateAcronym(data[label].description),  // Generate acronym from description
     description: data[label].description, // Use description as electrode_desc
     contact_number: Object.keys(data[label]).filter(key => key !== 'description' && key !== 'type').length, // Subtract description and type keys
     label: label,
     type: data[label].type || 'DIXI' // Include the electrode type, default to DIXI if not specified
   }));

   console.log(`Inserting ${electrodeData.length} electrodes...`);
   
   // Added detailed error checking for electrode insert
   const { data: insertedElectrodes, error: electrodeError } = await supabase
     .from('electrode')
     .insert(electrodeData)
     .select();

   if (electrodeError) {
     console.error('Error inserting electrodes:', electrodeError);
     console.error('Error details:', JSON.stringify(electrodeError));
     console.error('Sample electrode data:', JSON.stringify(electrodeData[0]));
     throw electrodeError;
   }

   console.log(`Successfully inserted ${insertedElectrodes.length} electrodes`);

   // Create a mapping of electrode labels to their database IDs
   const electrodeIdMap = {};
   insertedElectrodes.forEach(electrode => {
     electrodeIdMap[electrode.label] = electrode.id;
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

   console.log(`Found ${uniqueRegions.size} unique regions`);

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
     console.error('Error getting max ID:', maxIdError);
     console.error('Error details:', JSON.stringify(maxIdError));
     throw maxIdError;
   }

   let nextId = maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
   console.log(`Starting localization IDs from ${nextId}`);

   // Insert into localization table with file_id
   const localizationData = [];
   console.log('DEBUG: Starting to build localization records from data structure:');
   console.log('DEBUG: Electrode count:', Object.keys(data).length);
   console.log('DEBUG: Sample electrode data:', JSON.stringify(Object.entries(data)[0], null, 2));
   
   let skippedDescriptionCount = 0;
   let skippedNonObjectCount = 0;
   let skippedNoLocationCount = 0;
   let processedContactCount = 0;
   
   Object.entries(data).forEach(([label, contacts]) => {
     console.log(`DEBUG: Processing electrode "${label}" with ${Object.keys(contacts).length} keys`);
     console.log(`DEBUG: Contact keys:`, Object.keys(contacts));
     
     Object.entries(contacts).forEach(([contactNumber, contactData]) => {
       console.log(`DEBUG: Processing contact "${contactNumber}" for electrode "${label}"`);
       
       if (contactNumber === 'description') {
         console.log(`DEBUG: Skipping "description" key`);
         skippedDescriptionCount++;
         return; // Skip the description key
       }
       
       if (typeof contactData !== 'object') {
         console.log(`DEBUG: Skipping non-object contactData:`, contactData);
         skippedNonObjectCount++;
         return; // Skip invalid entries
       }
       
       if (!contactData.associatedLocation || contactData.associatedLocation === '') {
         console.log(`DEBUG: Setting default 'WM' location for contact without associatedLocation: ${label}/${contactNumber}`);
         console.log(`DEBUG: Original contactData:`, contactData);
         // Instead of skipping, assign default 'WM' as associatedLocation
         contactData.associatedLocation = 'WM';
         
         // If there's no contactDescription either, set a default value
         if (!contactData.contactDescription || contactData.contactDescription === '') {
           contactData.contactDescription = 'Unknown';
         }
       }
       
       processedContactCount++;
       console.log(`DEBUG: Valid contact found - ${label}/${contactNumber}: ${contactData.associatedLocation}`);
       
       const { contactDescription, associatedLocation } = contactData;
       
       if (!electrodeIdMap[label]) {
         console.error(`DEBUG: ERROR - No electrode ID found for label "${label}"`);
         console.log('DEBUG: Available electrode IDs:', electrodeIdMap);
         return; // Skip if no electrode ID found
       }
       
       // Handle GM/GM case: Split into two entries
       if (associatedLocation === 'GM/GM') {
         const [desc1, desc2] = contactDescription.split('+');
         
         if (!regionIdMap[desc1]) {
           console.error(`DEBUG: ERROR - No region ID found for "${desc1}"`);
           console.log('DEBUG: Available region IDs:', regionIdMap);
           return;
         }
         
         if (!regionIdMap[desc2]) {
           console.error(`DEBUG: ERROR - No region ID found for "${desc2}"`);
           console.log('DEBUG: Available region IDs:', regionIdMap);
           return;
         }
         
         console.log(`DEBUG: Adding two GM/GM records for ${label}/${contactNumber} (${desc1}, ${desc2})`);
         
         localizationData.push(
           {
             id: nextId++,
             electrode_id: electrodeIdMap[label],
             contact: contactNumber,
             tissue_type: 'GM',
             region_id: regionIdMap[desc1], // Use region ID from the map
             file_id: numericFileId // Add file ID to localization record
           },
           {
             id: nextId++,
             electrode_id: electrodeIdMap[label],
             contact: contactNumber,
             tissue_type: 'GM',
             region_id: regionIdMap[desc2], // Use region ID from the map
             file_id: numericFileId // Add file ID to localization record
           }
         );
       } else {
         if (!regionIdMap[contactDescription]) {
           console.error(`DEBUG: ERROR - No region ID found for "${contactDescription}"`);
           console.log('DEBUG: Available region IDs:', regionIdMap);
           return;
         }
         
         console.log(`DEBUG: Adding record for ${label}/${contactNumber} (${associatedLocation}/${contactDescription})`);
         
         localizationData.push({
           id: nextId++,
           electrode_id: electrodeIdMap[label],
           contact: contactNumber,
           tissue_type: associatedLocation,
           region_id: regionIdMap[contactDescription], // Use region ID from the map
           file_id: numericFileId // Add file ID to localization record
         });
       }
     });
   });
   
   console.log('DEBUG: Localization data build summary:');
   console.log(`DEBUG: - Skipped description keys: ${skippedDescriptionCount}`);
   console.log(`DEBUG: - Skipped non-object data: ${skippedNonObjectCount}`);
   console.log(`DEBUG: - Skipped no location data: ${skippedNoLocationCount}`);
   console.log(`DEBUG: - Processed valid contacts: ${processedContactCount}`);
   console.log(`DEBUG: - Final record count: ${localizationData.length}`);

   if (localizationData.length === 0) {
     console.warn('No localization data to insert');
     
     // Remove the test insertion that's likely causing errors
     // Just log a warning instead
     console.log('DEBUG: No localization data to save for this file');
     return;
   }

   console.log(`Inserting ${localizationData.length} localization records with file_id: ${numericFileId}`);
   console.log('Sample localization record:', JSON.stringify(localizationData[0], null, 2));
   
   // Try inserting in smaller batches to identify problem records
   try {
     // Remove the single test record insertion - this could be causing the error
     
     // Proceed with full batch insertion directly
     console.log('Proceeding with batch insertion');
     
     const { data: insertedRecords, error: localizationError } = await supabase
       .from('localization')
       .insert(localizationData)
       .select();

     if (localizationError) {
       console.error('Error inserting localization records:', localizationError);
       console.error('Error details:', JSON.stringify(localizationError));
       console.error('Data sample:', JSON.stringify(localizationData.slice(0, 3)));
       
       // Check the table structure to help diagnose
       const { data: tableInfo, error: infoError } = await supabase
         .from('localization')
         .select('*')
         .limit(1);
         
       if (infoError) {
         console.error('Error getting table structure:', infoError);
       } else {
         console.log('Existing table structure sample:', tableInfo);
       }
       
       throw localizationError;
     }

     console.log(`Successfully inserted ${localizationData.length} localization records`);
     
   } catch (batchError) {
     console.error('Batch insertion failed:', batchError);
     
     // Try inserting records one by one to identify problematic records
     console.log('Attempting record-by-record insertion to identify problem...');
     
     for (let i = 0; i < localizationData.length; i++) {
       try {
         const { error: singleError } = await supabase
           .from('localization')
           .insert([localizationData[i]])
           .select();
           
         if (singleError) {
           console.error(`Error at record ${i}:`, singleError);
           console.error('Problematic record:', JSON.stringify(localizationData[i], null, 2));
         }
       } catch (singleRecordError) {
         console.error(`Exception at record ${i}:`, singleRecordError);
       }
     }
     
     // Re-throw the original error
     throw batchError;
   }
   
   // Verify records were saved by counting
   const { count, error: countError } = await supabase
     .from('localization')
     .select('*', { count: 'exact', head: true })
     .eq('file_id', numericFileId);
     
   if (countError) {
     console.warn('Error verifying saved records:', countError);
   } else {
     console.log(`Verification: Found ${count} records with file_id ${numericFileId}`);
     if (count === 0) {
       console.error('CRITICAL: Records appear to have been saved but count is 0');
     }
   }

   return {
     electrodeCount: insertedElectrodes.length,
     localizationCount: localizationData.length,
     fileId: numericFileId
   };
 } catch (error) {
   console.error("Error saving data to the database:", error);
   console.error("Error stack:", error.stack);
   
   // Check database connection
   try {
     const { data, error: pingError } = await supabase
       .from('localization')
       .select('count(*)', { count: 'exact', head: true });
       
     if (pingError) {
       console.error('Database connection issue:', pingError);
     } else {
       console.log('Database connection is working');
     }
   } catch (pingError) {
     console.error('Failed to ping database:', pingError);
   }
   
   throw error; // Re-throw to propagate to the API endpoint handler
 }
}
