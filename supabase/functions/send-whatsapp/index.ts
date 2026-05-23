import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const {
            receiver_phone,
            receiver_name,
            sender_name,
            tracking_number,
            origin_branch,
            destination_branch,
        } = await req.json();

        if (!receiver_phone || !tracking_number) {
            throw new Error("Missing required fields: receiver_phone, tracking_number");
        }

        // --- Meta API Credentials from Supabase Secrets ---
        const META_PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID') ?? '';
        const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN') ?? '';

        if (!META_PHONE_NUMBER_ID || !META_ACCESS_TOKEN) {
            throw new Error("Meta API credentials are not configured in Supabase Secrets.");
        }

        // --- Format the phone number ---
        // WhatsApp API requires E.164 format (e.g., +252612345678)
        // Remove leading zeros or plus signs, then ensure it starts with country code
        let formattedPhone = receiver_phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
        }

        // --- Build the WhatsApp message ---
        // Using a simple TEXT message (works in dev/sandbox mode)
        // For production, use an approved Template message instead.
        const messageText =
            `📦 *STARBUS - Shipment Notification*\n\n` +
            `Hello *${receiver_name || 'Customer'}*,\n\n` +
            `A package has been registered for you at our *${origin_branch || 'nearest'}* branch and is on its way to *${destination_branch || 'your branch'}*.\n\n` +
            `*Sender:* ${sender_name || 'N/A'}\n` +
            `*Tracking #:* \`${tracking_number}\`\n\n` +
            `Please show this tracking number when picking up your package.\n\n` +
            `_This is an automated message from STARBUS Logistics._`;

        // --- Call Meta Graph API ---
        const metaApiUrl = `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedPhone,
            type: "text",
            text: {
                preview_url: false,
                body: messageText,
            },
        };

        const metaResponse = await fetch(metaApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const metaResult = await metaResponse.json();

        if (!metaResponse.ok) {
            console.error("Meta API Error:", JSON.stringify(metaResult));
            throw new Error(metaResult?.error?.message || "Failed to send WhatsApp message.");
        }

        console.log("WhatsApp sent successfully:", JSON.stringify(metaResult));

        return new Response(
            JSON.stringify({ success: true, message_id: metaResult.messages?.[0]?.id }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        );

    } catch (error) {
        console.error("send-whatsapp function error:", error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});
