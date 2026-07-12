// ==================================================
// POLO DISTRICT — create-nomba-order (Supabase Edge Function)
// Creates a Nomba checkout order server-side, so the secret
// credentials never touch the browser. Deploy with:
//   supabase functions deploy create-nomba-order
// Then set your secrets (see PAYMENTS.md):
//   supabase secrets set NOMBA_CLIENT_ID=... NOMBA_PRIVATE_KEY=... NOMBA_ACCOUNT_ID=...
// ==================================================
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const NOMBA_BASE_URL = "https://api.nomba.com"; // use https://sandbox.nomba.com while testing

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken() {
  const clientId = Deno.env.get("NOMBA_CLIENT_ID");
  const privateKey = Deno.env.get("NOMBA_PRIVATE_KEY");
  const accountId = Deno.env.get("NOMBA_ACCOUNT_ID");

  const res = await fetch(`${NOMBA_BASE_URL}/v1/auth/token/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accountId: accountId ?? "",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: privateKey,
    }),
  });
  if (!res.ok) throw new Error("Could not authenticate with Nomba");
  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { reference, amount, email, phone } = await req.json();
    if (!reference || !amount) {
      return new Response(JSON.stringify({ error: "Missing reference or amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken();
    const accountId = Deno.env.get("NOMBA_ACCOUNT_ID");

    const orderRes = await fetch(`${NOMBA_BASE_URL}/v1/checkout/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        accountId: accountId ?? "",
      },
      body: JSON.stringify({
        order: {
          orderReference: reference,
          callbackUrl: Deno.env.get("SITE_URL") ?? "",
          customerEmail: email,
          customerPhone: phone,
          amount: amount,
          currency: "NGN",
        },
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      throw new Error("Nomba order creation failed: " + errText);
    }
    const orderData = await orderRes.json();

    return new Response(
      JSON.stringify({ checkoutLink: orderData.data?.checkoutLink, orderReference: orderData.data?.orderReference }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});