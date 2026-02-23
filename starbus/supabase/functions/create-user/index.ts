import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Always respond with 200, encode success/error in body
// so the Supabase JS client doesn't swallow the real error message.
const respond = (data: object) =>
    new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const body = await req.json().catch(() => null);
        if (!body) return respond({ error: 'Invalid JSON body.' });

        const { email, password, full_name, branch_id } = body;

        if (!email) return respond({ error: 'Email is required.' });
        if (!password) return respond({ error: 'Password is required.' });
        if (!full_name) return respond({ error: 'Full name is required.' });
        if (!branch_id) return respond({ error: 'You must assign the worker to a branch.' });
        if (password.length < 6) return respond({ error: 'Password must be at least 6 characters.' });

        // Create auth user
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: { full_name, branch_id, role: 'branch_worker' }
        });

        if (createError) {
            console.error('createUser error:', createError.message);
            return respond({ error: createError.message });
        }

        // Upsert profile (handles cases where DB trigger may have already created it)
        if (data?.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: email.trim().toLowerCase(),
                    full_name,
                    branch_id,
                    role: 'branch_worker'
                }, { onConflict: 'id' });

            if (profileError) {
                console.error('Profile upsert error:', profileError.message);
                // User was created in auth, profile failed — still partially ok
                return respond({
                    success: true,
                    warning: 'Worker account created but profile setup had an issue: ' + profileError.message
                });
            }
        }

        return respond({ success: true });

    } catch (err) {
        console.error('Fatal error:', err);
        return respond({ error: 'Unexpected server error: ' + String(err) });
    }
});
