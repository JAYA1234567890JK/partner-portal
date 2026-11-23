const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');

let supabaseClient;

function getSupabaseClient() {
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    error.status = 503;
    throw error;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return supabaseClient;
}

async function uploadObject(bucket, storagePath, file) {
  const { data, error } = await getSupabaseClient().storage.from(bucket).upload(storagePath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    // Keep upstream diagnostics in the backend log only; never return credentials
    // or raw request details to the browser.
    console.error('[storage] Supabase upload rejected:', {
      bucket,
      statusCode: error.statusCode || null,
      error: error.error || null,
      message: error.message || 'Unknown Storage error',
    });
    const uploadError = new Error('Image upload to Supabase Storage failed.');
    uploadError.status = 502;
    throw uploadError;
  }
  const { data: publicData } = getSupabaseClient().storage.from(bucket).getPublicUrl(data.path);
  return { storagePath: data.path, imageUrl: publicData.publicUrl };
}

async function deleteObjects(bucket, storagePaths) {
  const paths = storagePaths.filter(Boolean);
  if (!paths.length) return;
  const { error } = await getSupabaseClient().storage.from(bucket).remove(paths);
  if (error) {
    const deleteError = new Error('Image could not be deleted from Supabase Storage.');
    deleteError.status = 502;
    throw deleteError;
  }
}

module.exports = { uploadObject, deleteObjects };
