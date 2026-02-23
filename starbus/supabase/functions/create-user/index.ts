import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const ok = (payload) => new Response(
        JSON.stringify(payload),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

    const fail = (msg) => new Response(
        JSON.stringify({ error: msg }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL'),
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        );

        let body;
        try {
            body = await req.json();
        } catch (_) {
            return fail('Invalid request body.');
        }

        const { email, password, full_name, branch_id } = body ?? {};

        if (!email) return fail('Email is required.');
        if (!password) return fail('Password is required.');
        if (!full_name) return fail('Full name is required.');
        if (!branch_id) return fail('Please select a branch for this worker.');
        if (password.length < 6) return fail('Password must be at least 6 characters long.');

        // Create the user in auth
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name,
                branch_id: branch_id,
                role: 'branch_worker',
            }
        });

        if (createError) {
            console.error('createUser error:', createError.message);
            return fail(createError.message);
        }

        // Upsert the profile row (in case the DB trigger didn't fire)
        if (data && data.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: email.trim().toLowerCase(),
                    full_name: full_name,
                    branch_id: branch_id,
                    role: 'branch_worker',
                }, { onConflict: 'id' });

            if (profileError) {
                console.error('Profile error:', profileError.message);
                return ok({ success: true, warning: 'User created but profile had an issue: ' + profileError.message });
            }
        }

        return ok({ success: true });

    } catch (err) {
        console.error('Fatal:', String(err));
        return new Response(
            JSON.stringify({ error: String(err) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});
