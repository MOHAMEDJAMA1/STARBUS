import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Setup Supabase Admin Client (bypasses RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Parse request body
        let body;
        try {
            body = await req.json();
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid request body' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        const { email, password, full_name, branch_id } = body;

        // Validate
        if (!email || !password || !full_name || !branch_id) {
            return new Response(
                JSON.stringify({ error: `Missing required fields. Got: email=${!!email}, password=${!!password}, full_name=${!!full_name}, branch_id=${!!branch_id}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        if (password.length < 6) {
            return new Response(
                JSON.stringify({ error: 'Password must be at least 6 characters.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Create Auth User
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name,
                branch_id: branch_id,
                role: 'branch_worker'
            }
        });

        if (createError) {
            return new Response(
                JSON.stringify({ error: createError.message }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Ensure profile is created (upsert in case DB trigger already did it)
        if (data.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: email.trim().toLowerCase(),
                    full_name: full_name,
                    branch_id: branch_id,
                    role: 'branch_worker'
                }, { onConflict: 'id' });

            if (profileError) {
                // User was created but profile failed - still partial success
                console.error('Profile creation failed:', profileError.message);
                return new Response(
                    JSON.stringify({
                        warning: 'User created but profile setup failed: ' + profileError.message,
                        user: data.user
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                );
            }
        }

        return new Response(
            JSON.stringify({ success: true, user: data.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Unhandled error:', error);
        return new Response(
            JSON.stringify({ error: String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
