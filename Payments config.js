/* ==================================================
   POLO DISTRICT — payments config
   This holds your Paystack PUBLIC key only. Never put
   your SECRET key here or in any other file the browser
   loads — it must stay inside Paystack's dashboard only.
   ================================================== */
const PAYSTACK_PUBLIC_KEY = "pk_live_b9a82a72c868dca93afc2ec0d02328cd02d4d116";

/* This is a LIVE key — real payments will be charged to real
   cards from this point on. Make sure you've fully tested the
   checkout flow (cart, Paystack popup, order saved in Supabase)
   with a test key before relying on this in production. */

/* All charges are processed in NGN (kobo), regardless of
   which currency the shopper has selected for browsing. */