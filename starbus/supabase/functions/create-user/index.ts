import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Setup Supabase Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Parse request body
        const { email, password, full_name, branch_id } = await req.json()

        // Validation
        if (!email || !password || !full_name || !branch_id) {
            throw new Error("Missing required fields: email, password, full_name, branch_id");
        }

        // 3. Create User
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name,
                branch_id: branch_id,
                role: 'branch_worker'
            }
        })

        if (createError) throw createError

        // 4. Manual Profile Creation (Redundancy check)
        // The DB trigger *should* do this, but if it fails, this ensures the profile exists.
        // We use upsert to avoid conflict if the trigger already worked.
        if (data.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: email,
                    full_name: full_name,
                    branch_id: branch_id,
                    role: 'branch_worker'
                })

            if (profileError) {
                console.error("Manual profile creation failed:", profileError)
                // Return error to client so they know it failed
                return new Response(
                    JSON.stringify({ error: "User created but profile failed: " + profileError.message }),
                    {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                        status: 500
                    },
                )
            }
        }

        return new Response(
            JSON.stringify(data),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400
            },
        )
    }
})
