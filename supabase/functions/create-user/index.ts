import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ok = (data) => new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
});

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!SUPABASE_URL || !SERVICE_KEY) {
            return ok({ error: 'Server misconfiguration: missing Supabase credentials.' });
        }

        let body;
        try { body = await req.json(); }
        catch (_) { return ok({ error: 'Invalid request body.' }); }

        const { email, password, full_name, branch_id } = body ?? {};

        if (!email) return ok({ error: 'Email is required.' });
        if (!password) return ok({ error: 'Password is required.' });
        if (!full_name) return ok({ error: 'Full name is required.' });
        if (!branch_id) return ok({ error: 'Please assign the worker to a branch.' });
        if (password.length < 6) return ok({ error: 'Password must be at least 6 characters.' });

        // Create user via Supabase Admin REST API (no supabase-js needed)
        const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
            },
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                password: password,
                email_confirm: true,
                user_metadata: {
                    full_name: full_name,
                    branch_id: branch_id,
                    role: 'branch_worker',
                },
            }),
        });

        const createResult = await createRes.json();

        if (!createRes.ok) {
            const msg = createResult?.msg || createResult?.message || createResult?.error_description || JSON.stringify(createResult);
            return ok({ error: msg });
        }

        const userId = createResult?.id;

        // Upsert profile row for this user
        if (userId) {
            const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY,
                    'Prefer': 'resolution=merge-duplicates',
                },
                body: JSON.stringify({
                    id: userId,
                    email: email.trim().toLowerCase(),
                    full_name: full_name,
                    branch_id: branch_id,
                    role: 'branch_worker',
                }),
            });

            if (!profileRes.ok) {
                const profileErr = await profileRes.text();
                console.error('Profile upsert failed:', profileErr);
                return ok({ success: true, warning: 'User created but profile setup had an issue.' });
            }
        }

        return ok({ success: true });

    } catch (err) {
        console.error('Unhandled error:', String(err));
        return ok({ error: 'Unexpected error: ' + String(err) });
    }
});
