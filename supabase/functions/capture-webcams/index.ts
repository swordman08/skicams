import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security: Maximum image size (10MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Security: Allowed domains for external image sources
const ALLOWED_DOMAINS = [
  'backend.roundshot.com',
  'api.urlbox.io',
  'urlbox.io',
  's3.urlbox.io'
];

// Security: Validate URL is from allowed domain
function isAllowedDomain(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ALLOWED_DOMAINS.some(domain => url.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

// Security: Validate content type is an image
function isValidImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.startsWith('image/');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Authenticate request using webhook secret
    const webhookSecret = Deno.env.get('CAPTURE_WEBHOOK_SECRET');
    const authHeader = req.headers.get('Authorization');
    
    // If webhook secret is configured, require it for authentication
    if (webhookSecret) {
      const providedSecret = authHeader?.replace('Bearer ', '');
      if (providedSecret !== webhookSecret) {
        console.error('Unauthorized: Invalid or missing webhook secret');
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    } else {
      console.warn('CAPTURE_WEBHOOK_SECRET not configured - endpoint is unprotected');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting webcam capture process...');

    // Get all active cameras
    const { data: cameras, error: camerasError } = await supabase
      .from('cameras')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (camerasError) {
      console.error('Error fetching cameras:', camerasError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch cameras' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Found ${cameras?.length || 0} active cameras`);

    const results: Array<{ camera: string; success: boolean }> = [];
    const now = new Date();
    
    // Convert UTC to PST (UTC-8) to determine time slot
    const pstOffset = -8 * 60; // PST is UTC-8
    const pstTime = new Date(now.getTime() + pstOffset * 60 * 1000);
    const hour = pstTime.getUTCHours();
    
    // Determine time slot based on PST time (7:30 AM, 12:00 PM, and 3:30 PM)
    let timeSlot = '7:30 AM'; // default
    if (hour >= 15) timeSlot = '3:30 PM'; // After 3 PM PST
    else if (hour >= 12) timeSlot = '12:00 PM'; // After 12 PM PST
    else timeSlot = '7:30 AM'; // Before 12 PM PST

    for (const camera of cameras || []) {
      try {
        console.log(`Processing camera: ${camera.name} (${camera.source_type})`);

        // Security: Validate source URL domain
        if (!isAllowedDomain(camera.source_url)) {
          console.error(`Blocked: Source URL domain not in allowlist for camera ${camera.name}`);
          results.push({ camera: camera.name, success: false });
          continue;
        }

        if (camera.source_type === 'roundshot') {
          // Download image from Roundshot
          console.log(`Fetching image from allowed source for camera: ${camera.name}`);
          const imageResponse = await fetch(camera.source_url);
          
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image for ${camera.name}: HTTP ${imageResponse.status}`);
            results.push({ camera: camera.name, success: false });
            continue;
          }

          // Security: Validate content type
          const contentType = imageResponse.headers.get('content-type');
          if (!isValidImageContentType(contentType)) {
            console.error(`Invalid content type for ${camera.name}: ${contentType}`);
            results.push({ camera: camera.name, success: false });
            continue;
          }

          const imageBlob = await imageResponse.blob();
          
          // Security: Check image size before processing
          if (imageBlob.size > MAX_IMAGE_SIZE) {
            console.error(`Image too large for ${camera.name}: ${imageBlob.size} bytes`);
            results.push({ camera: camera.name, success: false });
            continue;
          }

          const imageBuffer = await imageBlob.arrayBuffer();
          const imageBytes = new Uint8Array(imageBuffer);

          console.log(`Image downloaded for ${camera.name}, size: ${imageBytes.length} bytes`);

          // Generate filename
          const timestamp = now.toISOString().replace(/[:.]/g, '-');
          const filename = `${camera.slug}/${timestamp}.jpg`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('webcam-snapshots')
            .upload(filename, imageBytes, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
            });

          if (uploadError) {
            console.error(`Upload error for ${camera.name}:`, uploadError);
            results.push({ camera: camera.name, success: false });
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('webcam-snapshots')
            .getPublicUrl(filename);

          console.log(`Image uploaded successfully for ${camera.name}`);

          // Create snapshot record
          const { error: snapshotError } = await supabase
            .from('snapshots')
            .insert({
              camera_id: camera.id,
              image_url: publicUrl,
              captured_at: now.toISOString(),
              time_slot: timeSlot,
              file_size_bytes: imageBytes.length,
            });

          if (snapshotError) {
            console.error(`Snapshot record error for ${camera.name}:`, snapshotError);
            results.push({ camera: camera.name, success: false });
            continue;
          }

          results.push({ camera: camera.name, success: true });

        } else if (camera.source_type === 'verkada') {
          // Verkada cameras - screenshot the embed page
          console.log(`Processing Verkada camera: ${camera.name}`);
          
          const urlboxKey = Deno.env.get('SCREENSHOTONE_API_KEY');
          if (!urlboxKey) {
            console.error('Urlbox API key not configured');
            results.push({ camera: camera.name, success: false });
            continue;
          }

          try {
            // Screenshot the camera's embed URL using Urlbox
            const pageUrl = camera.source_url;
            
            console.log(`Requesting screenshot for camera: ${camera.name}`);
            
            // Use Urlbox's API with minimal parameters
            const screenshotResponse = await fetch('https://api.urlbox.io/v1/render/sync', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${urlboxKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: pageUrl,
                width: 1920,
                height: 1080,
                format: 'jpg',
                delay: 15000
              }),
            });
            
            if (!screenshotResponse.ok) {
              console.error(`Screenshot API error for ${camera.name}: HTTP ${screenshotResponse.status}`);
              results.push({ camera: camera.name, success: false });
              continue;
            }

            // Urlbox sync API returns JSON with renderUrl
            const responseData = await screenshotResponse.json();
            console.log(`Urlbox response received for ${camera.name}`);
            
            if (!responseData.renderUrl) {
              console.error(`No renderUrl for ${camera.name}`);
              results.push({ camera: camera.name, success: false });
              continue;
            }

            // Security: Validate render URL is from Urlbox
            if (!isAllowedDomain(responseData.renderUrl)) {
              console.error(`Blocked: Render URL domain not in allowlist for ${camera.name}`);
              results.push({ camera: camera.name, success: false });
              continue;
            }

            // Fetch the actual screenshot from the render URL
            console.log(`Fetching rendered image for ${camera.name}`);
            const imageResponse = await fetch(responseData.renderUrl);
            
            if (!imageResponse.ok) {
              console.error(`Failed to fetch rendered image for ${camera.name}: HTTP ${imageResponse.status}`);
              results.push({ camera: camera.name, success: false });
              continue;
            }

            // Security: Validate content type
            const contentType = imageResponse.headers.get('content-type');
            if (!isValidImageContentType(contentType)) {
              console.error(`Invalid content type for ${camera.name}: ${contentType}`);
              results.push({ camera: camera.name, success: false });
              continue;
            }

            const screenshotBlob = await imageResponse.blob();

            // Security: Check image size before processing
            if (screenshotBlob.size > MAX_IMAGE_SIZE) {
              console.error(`Screenshot too large for ${camera.name}: ${screenshotBlob.size} bytes`);
              results.push({ camera: camera.name, success: false });
              continue;
            }

            const screenshotBuffer = await screenshotBlob.arrayBuffer();
            const screenshotBytes = new Uint8Array(screenshotBuffer);

            console.log(`Screenshot downloaded for ${camera.name}, size: ${screenshotBytes.length} bytes`);

            // Generate filename
            const timestamp = now.toISOString().replace(/[:.]/g, '-');
            const filename = `${camera.slug}/${timestamp}.jpg`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from('webcam-snapshots')
              .upload(filename, screenshotBytes, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
              });

            if (uploadError) {
              console.error(`Upload error for ${camera.name}:`, uploadError);
              results.push({ camera: camera.name, success: false });
              continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('webcam-snapshots')
              .getPublicUrl(filename);

            console.log(`Screenshot uploaded successfully for ${camera.name}`);

            // Create snapshot record
            const { error: snapshotError } = await supabase
              .from('snapshots')
              .insert({
                camera_id: camera.id,
                image_url: publicUrl,
                captured_at: now.toISOString(),
                time_slot: timeSlot,
                file_size_bytes: screenshotBytes.length,
              });

            if (snapshotError) {
              console.error(`Snapshot record error for ${camera.name}:`, snapshotError);
              results.push({ camera: camera.name, success: false });
              continue;
            }

            results.push({ camera: camera.name, success: true });

          } catch (error) {
            console.error(`Error processing Verkada camera ${camera.name}:`, error);
            results.push({ camera: camera.name, success: false });
          }
        }

      } catch (error) {
        console.error(`Error processing camera ${camera.name}:`, error);
        results.push({ camera: camera.name, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Webcam capture complete: ${successCount}/${results.length} successful`);

    // Security: Return minimal response - only success counts, no internal details
    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: successCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Webcam capture error:', error);
    // Security: Return generic error message
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred during webcam capture' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
