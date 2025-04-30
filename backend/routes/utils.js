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
 * @returns {Promise<void>} - Resolves when the operation is complete, throws on error
 */
export async function handleFileRecord(fileId, fileName, creationDate, modifiedDate, token) {
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
        modified_date: modifiedDate
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
        modified_date: modifiedDate
      });

    if (fileError) throw fileError;
  }
}

export function generateAcronym(description) {
  if (!description) return '';
  return description
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

export async function insertRegionsAndGetIds(regions) {
  const regionIds = [];
  
  for (const region of regions) {
    const { data, error } = await supabase
      .from('region_name')
      .insert({
        name: region.name,
        description: region.description,
        acronym: generateAcronym(region.description)
      })
      .select('id')
      .single();
      
    if (error) throw error;
    regionIds.push(data.id);
  }
  
  return regionIds;
}

export async function saveLocalizationToDatabase(data, fileId) {
  const { error } = await supabase
    .from('localization')
    .insert({
      file_id: fileId,
      localization_data: data
    });
    
  if (error) throw error;
} 