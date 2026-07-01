require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
    
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${profiles.length} profiles.`);

  for (const profile of profiles) {
    if (profile.email === 'danylo.oliveira73@gmail.com') {
      console.log(`Skipping main account: ${profile.email}`);
      continue;
    }
    
    // If it's Danylo's extra account, maybe delete it or leave it? We'll ask.
    if (profile.email === 'danylo.oliveira.lider@rlsaomiguel.com' || profile.email === 'danylo.rede@rlsaomiguel.com') {
      console.log(`Found extra Danylo account: ${profile.email} (ID: ${profile.id}, role: ${profile.role})`);
      continue;
    }

    if (profile.email && (profile.email.includes('@rlsaomiguel.com') || profile.email.includes('@videirasaomiguel.com'))) {
      const newEmail = profile.email.split('@')[0] + '@radicaislivres.com';
      console.log(`Updating ${profile.email} -> ${newEmail}`);
      
      // Update in auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
        profile.user_id,
        { email: newEmail }
      );
      
      if (authError) {
        console.error(`  Auth Error for ${profile.email}:`, authError.message);
      } else {
        // Update in profiles
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ email: newEmail })
          .eq('id', profile.id);
          
        if (profileUpdateError) {
          console.error(`  Profile Update Error for ${profile.email}:`, profileUpdateError.message);
        } else {
          console.log(`  Success!`);
        }
      }
    }
  }
}

run();
