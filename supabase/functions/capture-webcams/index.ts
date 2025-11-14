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
    
    // Convert UTC to PST (UTC-8) to determine time slot
    const pstOffset = -8 * 60; // PST is UTC-8
    const pstTime = new Date(now.getTime() + pstOffset * 60 * 1000);
    const hour = pstTime.getUTCHours();
    
    // Determine time slot based on PST time (only 7:30 AM and 1:30 PM)
    let timeSlot = '7:30 AM'; // default
    if (hour >= 13) timeSlot = '1:30 PM'; // After 1 PM PST
    else timeSlot = '7:30 AM'; // Before 1 PM PST

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
          // Verkada cameras - screenshot the embed page
          console.log(`Processing Verkada camera: ${camera.name}`);
          
          const urlboxKey = Deno.env.get('SCREENSHOTONE_API_KEY'); // Using same env var name for Urlbox
          if (!urlboxKey) {
            console.error('Urlbox API key not configured');
            results.push({
              camera: camera.name,
              success: false,
              error: 'Screenshot API key not configured'
            });
            continue;
          }

          try {
            // Screenshot the camera's embed URL using Urlbox
            const pageUrl = camera.source_url;
            
            console.log(`Fetching screenshot from Urlbox for: ${camera.name}`);
            
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
              const errorText = await screenshotResponse.text();
              console.error(`Screenshot API error: ${screenshotResponse.status} - ${errorText}`);
              results.push({
                camera: camera.name,
                success: false,
                error: `Screenshot failed: ${screenshotResponse.status}`
              });
              continue;
            }

            // Urlbox sync API returns JSON with renderUrl
            const responseData = await screenshotResponse.json();
            console.log(`Urlbox response:`, responseData);
            
            if (!responseData.renderUrl) {
              console.error('No renderUrl in Urlbox response:', responseData);
              results.push({
                camera: camera.name,
                success: false,
                error: 'No render URL returned'
              });
              continue;
            }

            // Fetch the actual screenshot from the render URL
            console.log(`Fetching rendered image from: ${responseData.renderUrl}`);
            const imageResponse = await fetch(responseData.renderUrl);
            
            if (!imageResponse.ok) {
              console.error(`Failed to fetch rendered image: ${imageResponse.status}`);
              results.push({
                camera: camera.name,
                success: false,
                error: `Failed to download render: ${imageResponse.status}`
              });
              continue;
            }

            const screenshotBlob = await imageResponse.blob();
            const screenshotBuffer = await screenshotBlob.arrayBuffer();
            const screenshotBytes = new Uint8Array(screenshotBuffer);

            console.log(`Screenshot downloaded, size: ${screenshotBytes.length} bytes`);

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
