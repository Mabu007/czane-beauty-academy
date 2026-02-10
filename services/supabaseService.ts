import { createClient } from '@supabase/supabase-js';

// Retrieve from env, with fallback to the provided credentials
let supabaseUrl = (process.env.SUPABASE_URL || "https://rfwbaowursfgimdtfdrr.supabase.co").trim();
// Use the provided Anon Key as default if env is missing or empty
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd2Jhb3d1cnNmZ2ltZHRmZHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjE2MTAsImV4cCI6MjA4NjI5NzYxMH0.cgCSZOCWfY8lqGWV9laSKg6Wv_y-61S1AQ3wzD3L-Bc";
let supabaseKey = (process.env.SUPABASE_KEY || DEFAULT_ANON_KEY).trim();

export const setGlobalSupabaseUrl = (url: string) => {
    supabaseUrl = url.trim();
};

export const uploadToSupabase = async (file: File, urlOverride?: string): Promise<string> => {
    const activeUrl = urlOverride || supabaseUrl;

    // 1. Validation and Interactive Prompt for URL
    if (!activeUrl) {
        const input = window.prompt("Missing Supabase Project URL. Please enter your Supabase URL (e.g., https://xyz.supabase.co):");
        if (input) {
            setGlobalSupabaseUrl(input);
        } else {
             throw new Error("Missing Supabase Project URL.");
        }
    }

    // 2. Validation and Interactive Prompt for Key
    // The error "Invalid Compact JWS" happens when a Personal Access Token (starts with sbp_) is used instead of the Project API Key (JWT).
    if (!supabaseKey || supabaseKey.startsWith('sbp_')) {
        const msg = supabaseKey.startsWith('sbp_') 
            ? "Configuration Error: The current SUPABASE_KEY looks like a Personal Access Token (starts with 'sbp_'). The app requires the Project API Key (anon public key)."
            : "Missing Supabase API Key.";
            
        const input = window.prompt(`${msg}\n\nPlease enter your Supabase 'anon' public key (found in Project Settings > API):`);
        if (input) {
            supabaseKey = input.trim();
        } else {
             throw new Error("Missing Supabase API Key. Upload cancelled.");
        }
    }

    const supabase = createClient(activeUrl, supabaseKey);

    // 3. Ensure bucket exists (best effort, requires permissions)
    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === 'courses');
        
        if (!bucketExists) {
            // Try to create if it doesn't exist (might fail with anon key, but worth a try if RLS allows)
            const { error: createError } = await supabase.storage.createBucket('courses', {
                public: true,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: ['image/*', 'application/pdf', 'video/*']
            });
            if (createError) {
                console.warn("Could not create bucket 'courses'. Assuming it exists or permissions are restricted.", createError);
            }
        }
    } catch (e) {
        console.warn("Bucket check failed, attempting upload anyway.", e);
    }

    // 4. Generate path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // 5. Upload
    const { data, error } = await supabase.storage
        .from('courses')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error("Supabase upload error:", error);
        
        // Handle "Bucket not found"
        if (error.message.includes("Bucket not found") || error.message.includes("resource was not found")) {
             const msg = "Setup Required: The storage bucket 'courses' does not exist.\n\n" +
                         "Action Required:\n" +
                         "1. Go to your Supabase Dashboard > Storage.\n" +
                         "2. Create a new bucket named 'courses'.\n" +
                         "3. Set it to 'Public'.\n" +
                         "4. Add a Policy to allow uploads (INSERT/SELECT) for 'anon' role.";
             alert(msg);
             throw new Error("Bucket 'courses' not found. Please create it in your Supabase Dashboard.");
        }

        // Handle RLS / Permissions specifically
        if (error.message.includes("row-level security") || error.statusCode === '403') {
             const msg = "Permission Denied: Storage Policy Missing or Incorrect.\n\n" +
                         "Action Required:\n" +
                         "1. Go to Supabase Dashboard > Storage > Policies.\n" +
                         "2. Under 'courses' bucket, click 'New Policy'.\n" +
                         "3. Select 'For full customization'.\n" +
                         "4. Add Policy Name (e.g. 'Allow Public Uploads').\n" +
                         "5. Allowed Operations: Check 'INSERT' and 'SELECT'.\n" +
                         "6. Target roles: 'anon' (default).\n" +
                         "7. Click Review -> Save.";
             alert(msg);
             throw new Error("Upload failed: Missing RLS Policy for 'anon' role.");
        }

        // If we get an authentication error here, it might be the key again
        if (error.message.includes("JWS") || error.statusCode === '401') {
             throw new Error("Authentication failed: Invalid API Key. Please check your Supabase 'anon' key.");
        }
        throw new Error(`Upload failed: ${error.message}`);
    }

    // 6. Get Public URL
    const { data: publicUrlData } = supabase.storage
        .from('courses')
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
};