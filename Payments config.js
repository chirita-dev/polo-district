/* ==================================================
   POLO DISTRICT — payments config
   Paste your Paystack PUBLIC key below (Settings ->
   API Keys & Webhooks in your Paystack dashboard).
   Use the pk_test_... key while testing, switch to
   pk_live_... only once you're ready to take real
   payments. NEVER put your SECRET key in this file —
   it must never appear in any file your browser loads.
   ================================================== */
const PAYSTACK_PUBLIC_KEY = "PASTE_YOUR_PAYSTACK_PUBLIC_KEY_HERE";

/* All charges are processed in NGN (kobo), regardless of
   which currency the shopper has selected for browsing. */