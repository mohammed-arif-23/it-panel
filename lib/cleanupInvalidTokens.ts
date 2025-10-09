// Cleanup invalid FCM tokens from database
import { createClient } from '@supabase/supabase-js';

export async function cleanupInvalidTokens() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  try {
    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;

    console.log(`Found ${subscriptions?.length || 0} total subscriptions`);

    // For domain migration, you can:
    // 1. Delete all old domain subscriptions
    // 2. Keep native app tokens (they don't change with domain)
    
    // Option 1: Clean slate - remove all subscriptions
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .neq('id', ''); // Delete all
    
    if (deleteError) throw deleteError;
    
    console.log('✅ Cleared all push subscriptions for fresh start');
    
    // Option 2: Remove only web subscriptions (keep native)
    // const { error: deleteError } = await supabase
    //   .from('push_subscriptions')
    //   .delete()
    //   .ilike('endpoint', '%fcm.googleapis.com%'); // Web push endpoints
    
    return { success: true, message: 'Subscriptions cleaned' };
  } catch (error) {
    console.error('Error cleaning tokens:', error);
    return { success: false, error };
  }
}

// API endpoint to trigger cleanup
export async function POST(request: Request) {
  const result = await cleanupInvalidTokens();
  return Response.json(result);
}
