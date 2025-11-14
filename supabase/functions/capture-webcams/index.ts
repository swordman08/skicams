import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      throw camerasError;
    }

    console.log(`Found ${cameras?.length || 0} active cameras`);

    const results = [];
    const now = new Date();
    
    // Determine time slot based on current time
    const hour = now.getHours();
    let timeSlot = '10:30 AM'; // default
    if (hour >= 4 && hour < 10) timeSlot = '7:30 AM';
    else if (hour >= 10 && hour < 13) timeSlot = '10:30 AM';
    else if (hour >= 13 && hour < 16) timeSlot = '1:30 PM';
    else if (hour >= 16 && hour < 20) timeSlot = '4:00 PM';

    for (const camera of cameras || []) {
      try {
        console.log(`Processing camera: ${camera.name} (${camera.source_type})`);

        if (camera.source_type === 'roundshot') {
          // Download image from Roundshot
          console.log(`Fetching image from: ${camera.source_url}`);
          const imageResponse = await fetch(camera.source_url);
          
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image: ${imageResponse.status}`);
            results.push({
              camera: camera.name,
              success: false,
              error: `HTTP ${imageResponse.status}`
            });
            continue;
          }

          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          const imageBytes = new Uint8Array(imageBuffer);

          console.log(`Image downloaded, size: ${imageBytes.length} bytes`);

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
            console.error('Upload error:', uploadError);
            results.push({
              camera: camera.name,
              success: false,
              error: uploadError.message
            });
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('webcam-snapshots')
            .getPublicUrl(filename);

          console.log(`Image uploaded successfully: ${publicUrl}`);

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
            console.error('Snapshot record error:', snapshotError);
            results.push({
              camera: camera.name,
              success: false,
              error: snapshotError.message
            });
            continue;
          }

          results.push({
            camera: camera.name,
            success: true,
            url: publicUrl,
            size: imageBytes.length
          });

        } else if (camera.source_type === 'verkada') {
          // Verkada cameras - screenshot the webcam page
          console.log(`Processing Verkada camera: ${camera.name}`);
          
          const screenshotOneKey = Deno.env.get('SCREENSHOTONE_API_KEY');
          if (!screenshotOneKey) {
            console.error('SCREENSHOTONE_API_KEY not configured');
            results.push({
              camera: camera.name,
              success: false,
              error: 'Screenshot API key not configured'
            });
            continue;
          }

          try {
            // Screenshot the Crystal Mountain webcam page
            const pageUrl = 'https://www.crystalmountainresort.com/the-mountain/mountain-report-and-webcams/webcams';
            
            // Build ScreenshotOne API URL
            const screenshotUrl = new URL('https://api.screenshotone.com/take');
            screenshotUrl.searchParams.set('access_key', screenshotOneKey);
            screenshotUrl.searchParams.set('url', pageUrl);
            screenshotUrl.searchParams.set('full_page', 'false');
            screenshotUrl.searchParams.set('viewport_width', '1920');
            screenshotUrl.searchParams.set('viewport_height', '1080');
            screenshotUrl.searchParams.set('device_scale_factor', '1');
            screenshotUrl.searchParams.set('format', 'jpg');
            screenshotUrl.searchParams.set('image_quality', '80');
            screenshotUrl.searchParams.set('block_ads', 'true');
            screenshotUrl.searchParams.set('block_cookie_banners', 'true');
            screenshotUrl.searchParams.set('block_trackers', 'true');
            
            // Add a delay to let the page load
            screenshotUrl.searchParams.set('delay', '3');

            console.log(`Fetching screenshot from: ${screenshotUrl.toString().replace(screenshotOneKey, 'REDACTED')}`);
            
            const screenshotResponse = await fetch(screenshotUrl.toString());
            
            if (!screenshotResponse.ok) {
              const errorText = await screenshotResponse.text();
              console.error(`Screenshot API error: ${screenshotResponse.status} - ${errorText}`);
              results.push({
                camera: camera.name,
                success: false,
                error: `Screenshot failed: ${screenshotResponse.status}`
              });
              continue;
            }

            const screenshotBlob = await screenshotResponse.blob();
            const screenshotBuffer = await screenshotBlob.arrayBuffer();
            const screenshotBytes = new Uint8Array(screenshotBuffer);

            console.log(`Screenshot captured, size: ${screenshotBytes.length} bytes`);

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
              console.error('Upload error:', uploadError);
              results.push({
                camera: camera.name,
                success: false,
                error: uploadError.message
              });
              continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('webcam-snapshots')
              .getPublicUrl(filename);

            console.log(`Screenshot uploaded successfully: ${publicUrl}`);

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
              console.error('Snapshot record error:', snapshotError);
              results.push({
                camera: camera.name,
                success: false,
                error: snapshotError.message
              });
              continue;
            }

            results.push({
              camera: camera.name,
              success: true,
              url: publicUrl,
              size: screenshotBytes.length
            });

          } catch (error) {
            console.error(`Error processing Verkada camera ${camera.name}:`, error);
            results.push({
              camera: camera.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

      } catch (error) {
        console.error(`Error processing camera ${camera.name}:`, error);
        results.push({
          camera: camera.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('Webcam capture complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        timeSlot,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Webcam capture error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
