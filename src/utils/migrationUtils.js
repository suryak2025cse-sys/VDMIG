/**
 * Media Storage Migration Utility: Supabase Storage -> Cloudinary
 * Safely migrates existing files from Supabase Storage buckets to Cloudinary
 * without data loss or downtime.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cloudinaryUpload } from '../services/cloudinaryService';

export async function migrateStorageToCloudinary({ onProgress } = {}) {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Supabase is in local demo mode. No remote storage to migrate.' };
  }

  const results = {
    dances: { total: 0, migrated: 0, errors: [] },
    gallery: { total: 0, migrated: 0, errors: [] },
    payments: { total: 0, migrated: 0, errors: [] },
    profiles: { total: 0, migrated: 0, errors: [] },
  };

  try {
    // 1. Migrate Dance Songs
    const { data: dances } = await supabase
      .from('dance_performances')
      .select('id, song_url, group_name')
      .not('song_url', 'is', null);

    if (dances && dances.length > 0) {
      results.dances.total = dances.length;
      for (const dance of dances) {
        if (dance.song_url && dance.song_url.includes('supabase.co/storage')) {
          try {
            // Fetch audio from Supabase
            const response = await fetch(dance.song_url);
            const blob = await response.blob();
            const file = new File([blob], `migrated-song-${dance.id}.mp3`, { type: blob.type || 'audio/mpeg' });

            // Upload to Cloudinary
            const cloudResult = await cloudinaryUpload({
              file,
              bucket: 'songs',
              customName: `song-migrated-${dance.id}`,
            });

            // Update database record with Cloudinary URL
            if (cloudResult && cloudResult.url) {
              await supabase
                .from('dance_performances')
                .update({ song_url: cloudResult.url })
                .eq('id', dance.id);
              results.dances.migrated++;
            }
          } catch (err) {
            results.dances.errors.push({ id: dance.id, error: err.message });
          }
        }
      }
    }

    // 2. Migrate Gallery Images
    const { data: gallery } = await supabase
      .from('gallery')
      .select('id, image_url, title')
      .not('image_url', 'is', null);

    if (gallery && gallery.length > 0) {
      results.gallery.total = gallery.length;
      for (const item of gallery) {
        if (item.image_url && item.image_url.includes('supabase.co/storage')) {
          try {
            const response = await fetch(item.image_url);
            const blob = await response.blob();
            const file = new File([blob], `gallery-${item.id}.jpg`, { type: blob.type || 'image/jpeg' });

            const cloudResult = await cloudinaryUpload({
              file,
              bucket: 'gallery',
              customName: `gallery-migrated-${item.id}`,
            });

            if (cloudResult && cloudResult.url) {
              await supabase
                .from('gallery')
                .update({ image_url: cloudResult.url })
                .eq('id', item.id);
              results.gallery.migrated++;
            }
          } catch (err) {
            results.gallery.errors.push({ id: item.id, error: err.message });
          }
        }
      }
    }

    // 3. Migrate Payment Proofs
    const { data: payments } = await supabase
      .from('payments')
      .select('id, screenshot_url')
      .not('screenshot_url', 'is', null);

    if (payments && payments.length > 0) {
      results.payments.total = payments.length;
      for (const pay of payments) {
        if (pay.screenshot_url && pay.screenshot_url.includes('supabase.co/storage')) {
          try {
            const response = await fetch(pay.screenshot_url);
            const blob = await response.blob();
            const file = new File([blob], `payment-${pay.id}.jpg`, { type: blob.type || 'image/jpeg' });

            const cloudResult = await cloudinaryUpload({
              file,
              bucket: 'payment-proofs',
              customName: `pay-migrated-${pay.id}`,
            });

            if (cloudResult && cloudResult.url) {
              await supabase
                .from('payments')
                .update({ screenshot_url: cloudResult.url })
                .eq('id', pay.id);
              results.payments.migrated++;
            }
          } catch (err) {
            results.payments.errors.push({ id: pay.id, error: err.message });
          }
        }
      }
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results,
    };
  }
}
