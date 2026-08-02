/* ==================================================
   POLO DISTRICT — payments config
   This holds your Paystack PUBLIC key only. Never put
   your SECRET key here or in any other file the browser
   loads — it must stay inside Paystack's dashboard only.
   ================================================== */
const PAYSTACK_PUBLIC_KEY = "pk_live_b9a82a72c868dca93afc2ec0d02328cd02d4d116";

/* ---------- Processing fee (passed on to the customer) ----------
   These match Paystack's published rates for LOCAL Nigerian cards:
   1.5% + ₦100 per transaction, capped at ₦2,000, waived under ₦2,500,
   plus 7.5% VAT charged on top of that fee.
   International cards are charged a higher rate by Paystack (3.9% + ₦100,
   no cap) — this calculator can't know in advance which card type a
   shopper will use, so it estimates using the local rate. This means on
   the rare international-card order, the actual Paystack deduction may
   be slightly higher than what was collected here. Fine for a small
   store; revisit if a meaningful share of orders start using foreign
   cards.

   IMPORTANT: because the fee is now added to the total IN THIS CODE,
   make sure the "customer bears transaction fee" toggle in the
   Paystack dashboard (Settings -> Preferences) is switched OFF —
   otherwise Paystack would add its own fee on top of this one too,
   and the customer would be charged twice for the same fee. */
const PAYSTACK_FEE_RATE = 0.015;       // 1.5%
const PAYSTACK_FLAT_FEE = 100;         // ₦100
const PAYSTACK_FEE_CAP = 2000;         // never more than ₦2,000
const PAYSTACK_FEE_WAIVER_BELOW = 2500; // no flat fee under this amount
const PAYSTACK_VAT_RATE = 0.075;       // 7.5% VAT on the fee itself

/* This is a LIVE key — real payments will be charged to real
   cards from this point on. */

/* All charges are processed in NGN (kobo), regardless of
   which currency the shopper has selected for browsing. */