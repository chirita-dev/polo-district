/* ==================================================
   POLO DISTRICT — vanilla JS
   Products load live from the database (admin.html manages them).
   Cart is stored in this browser (localStorage) per shopper.
   ================================================== */
let LIVE_PRODUCTS = [];
const CURRENCIES = {
  NGN: { symbol: "₦", rate: 1,       digits: 0 },
  USD: { symbol: "$", rate: 1/1550,  digits: 2 },
  GBP: { symbol: "£", rate: 1/1950,  digits: 2 },
  EUR: { symbol: "€", rate: 1/1680,  digits: 2 },
};
const COUNTRIES = {
  Nigeria: {
    Lagos: ["Ikeja", "Lekki", "Victoria Island", "Yaba", "Ikoyi"],
    Abuja: ["Wuse", "Maitama", "Garki", "Asokoro"],
    Rivers: ["Port Harcourt", "Obio-Akpor"],
    Kano: ["Nassarawa", "Fagge", "Tarauni"],
  },
  "United Kingdom": {
    England: ["London", "Manchester", "Birmingham"],
    Scotland: ["Edinburgh", "Glasgow"],
  },
  "United States": {
    "New York": ["Manhattan", "Brooklyn", "Queens"],
    California: ["Los Angeles", "San Francisco", "San Diego"],
    Texas: ["Houston", "Austin", "Dallas"],
  },
  Ghana: {
    "Greater Accra": ["Accra", "Tema"],
    Ashanti: ["Kumasi"],
  },
};
const CART_KEY = "pd_cart";
/* ---------- State ---------- */
const state = {
  currency: "NGN",
  query: "",
  delivery: "home",
  discount: 0,
};
let cart = []; // [{id, name, price, image, qty}]

/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
function formatPrice(amountNGN) {
  const c = CURRENCIES[state.currency];
  const v = amountNGN * c.rate;
  return `${c.symbol}${v.toLocaleString(undefined, {
    minimumFractionDigits: c.digits,
    maximumFractionDigits: 2,
  })}`;
}
function escapeHtml(str = "") {
  return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* ---------- Load products from the database ---------- */
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Could not load products:", error.message);
    LIVE_PRODUCTS = [];
  } else {
    LIVE_PRODUCTS = data || [];
  }
  renderShop();
  renderDrawerCategories();
}
/* ---------- Category nav (drawer) ---------- */
function renderDrawerCategories() {
  const container = $("#drawerCategories");
  const categories = [...new Set(LIVE_PRODUCTS.map((p) => p.category).filter(Boolean))].sort();
  container.innerHTML = categories
    .map((cat) => `<a href="#" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</a>`)
    .join("");
}
/* ---------- Shop rendering ---------- */
function renderShop() {
  const q = state.query.trim().toLowerCase();
  const items = q
    ? LIVE_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    : LIVE_PRODUCTS;
  $("#count").textContent = `${items.length} piece${items.length === 1 ? "" : "s"}`;
  const grid = $("#grid");
  const empty = $("#empty");
  if (items.length === 0) {
    grid.hidden = true;
    empty.hidden = false;
    $("#emptyMsg").textContent = q
      ? "No pieces match your search yet. Our first drop is being finished by hand — check back shortly."
      : "Our inaugural collection is in the final stages of production. Join the list to be the first to receive it.";
  } else {
    empty.hidden = true;
    grid.hidden = false;
    grid.innerHTML = items
      .map(
        (p) => `
        <article class="product">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" />
          <div class="body">
            <p class="cat">${escapeHtml(p.category)}</p>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="price">${formatPrice(p.price)}</p>
            <button type="button" class="add-btn" data-id="${p.id}">Add to bag</button>
          </div>
        </article>`
      )
      .join("");
  }
}

/* ==================================================
   CART
   ================================================== */
function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    cart = [];
  }
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}
function cartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}
function addToCart(productId) {
  const p = LIVE_PRODUCTS.find((x) => x.id === productId);
  if (!p) return;
  const existing = cart.find((x) => x.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 });
  }
  saveCart();
  renderCartBadge();
  renderCartDrawer();
  renderSummary();
}
function changeQty(productId, delta) {
  const item = cart.find((x) => x.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((x) => x.id !== productId);
  saveCart();
  renderCartBadge();
  renderCartDrawer();
  renderSummary();
}
function removeFromCart(productId) {
  cart = cart.filter((x) => x.id !== productId);
  saveCart();
  renderCartBadge();
  renderCartDrawer();
  renderSummary();
}
function clearCart() {
  cart = [];
  saveCart();
  renderCartBadge();
  renderCartDrawer();
  renderSummary();
}
function renderCartBadge() {
  const badge = $("#cartBadge");
  const count = cartCount();
  badge.hidden = count === 0;
  badge.textContent = count;
}
function renderCartDrawer() {
  const container = $("#cartItems");
  if (cart.length === 0) {
    container.innerHTML = `<p class="cart-empty-msg">Your bag is empty.</p>`;
  } else {
    container.innerHTML = cart
      .map(
        (item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="" />
          <div>
            <p class="cart-item-name">${escapeHtml(item.name)}</p>
            <p class="cart-item-price">${formatPrice(item.price)}</p>
            <div class="qty-controls">
              <button type="button" data-qty="-1" data-id="${item.id}">−</button>
              <span>${item.qty}</span>
              <button type="button" data-qty="1" data-id="${item.id}">+</button>
            </div>
          </div>
          <button type="button" class="cart-item-remove" data-remove="${item.id}">Remove</button>
        </div>`
      )
      .join("");
  }
  $("#cartSubtotal").textContent = formatPrice(cartSubtotal());
}

/* ---------- Checkout summary ---------- */
function renderSummary() {
  const subtotal = cartSubtotal();
  const fee = state.delivery === "home" && subtotal > 0 ? 5000 : 0;
  const total = Math.max(0, subtotal + fee - state.discount);
  $("#subtotal").textContent = formatPrice(subtotal);
  $("#fee").textContent = formatPrice(fee);
  $("#total").textContent = formatPrice(total);
  const row = $("#discountRow");
  if (state.discount > 0) {
    row.hidden = false;
    $("#discountVal").textContent = `- ${formatPrice(state.discount)}`;
  } else {
    row.hidden = true;
  }
}

/* ---------- Address dropdowns ---------- */
function initCountries() {
  const country = $("#country");
  country.innerHTML = Object.keys(COUNTRIES)
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");
  country.value = "Nigeria";
  updateStates();
  country.addEventListener("change", updateStates);
  $("#state").addEventListener("change", updateRegions);
}
function updateStates() {
  const c = $("#country").value;
  const stateSel = $("#state");
  stateSel.innerHTML =
    `<option value="">Select state</option>` +
    Object.keys(COUNTRIES[c] || {})
      .map((s) => `<option value="${s}">${s}</option>`)
      .join("");
  updateRegions();
}
function updateRegions() {
  const c = $("#country").value;
  const s = $("#state").value;
  const region = $("#region");
  const list = (COUNTRIES[c] || {})[s] || [];
  region.disabled = !s;
  region.innerHTML =
    `<option value="">Select region</option>` +
    list.map((r) => `<option value="${r}">${r}</option>`).join("");
}

/* ==================================================
   CHECKOUT / PAYMENT
   ================================================== */
function generateReference() {
  return "pd-" + Date.now() + "-" + Math.floor(Math.random() * 1e6);
}
function getCustomerDetails() {
  return {
    firstName: $("#firstName").value.trim(),
    lastName: $("#lastName").value.trim(),
    email: $("#email").value.trim(),
    phone: $("#phone").value.trim(),
    country: $("#country").value,
    state: $("#state").value,
    region: $("#region").value,
  };
}
function validateCheckout() {
  if (cart.length === 0) return "Your bag is empty — add something first.";
  const c = getCustomerDetails();
  if (!c.firstName || !c.lastName) return "Please enter your first and last name.";
  if (!c.email || !c.email.includes("@")) return "Please enter a valid email address.";
  if (!c.phone) return "Please enter a phone number.";
  return null;
}
async function saveOrder({ reference, status }) {
  const c = getCustomerDetails();
  const subtotal = cartSubtotal();
  const fee = state.delivery === "home" && subtotal > 0 ? 5000 : 0;
  const total = Math.max(0, subtotal + fee - state.discount);
  const { error } = await supabaseClient.from("orders").insert([{
    reference,
    customer_name: `${c.firstName} ${c.lastName}`,
    customer_email: c.email,
    customer_phone: c.phone,
    delivery_method: state.delivery,
    payment_method: "paystack",
    country: c.country,
    state: c.state,
    region: c.region,
    items: cart,
    subtotal,
    delivery_fee: fee,
    discount: state.discount,
    total,
    status,
  }]);
  if (error) console.error("Could not save order:", error.message);
}
function showOrderModal(html) {
  $("#orderModalBody").innerHTML = html;
  $("#orderModal").hidden = false;
}

async function payWithPaystack() {
  const total = Math.max(0, cartSubtotal() + (state.delivery === "home" ? 5000 : 0) - state.discount);
  const reference = generateReference();
  const c = getCustomerDetails();
  const paystackInstance = new PaystackPop();
  paystackInstance.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email: c.email,
    amount: Math.round(total * 100), // kobo
    ref: reference,
    metadata: {
      custom_fields: [
        { display_name: "Customer", variable_name: "customer", value: `${c.firstName} ${c.lastName}` },
      ],
    },
    onSuccess: async () => {
      await saveOrder({ reference, status: "pending" });
      clearCart();
      showOrderModal(`
        <span class="pill">✦ Payment received</span>
        <h3 class="display-sm gold-text" style="margin-top:0.75rem;">Thank you!</h3>
        <p class="lede" style="margin-left:0;">
          Your order has been placed. Reference: <strong>${reference}</strong>.
          We'll confirm by email shortly.
        </p>`);
    },
    onCancel: () => {
      $("#checkoutError").textContent = "Payment was cancelled.";
    },
  });
}

async function handlePayNow() {
  $("#checkoutError").textContent = "";
  const validationError = validateCheckout();
  if (validationError) {
    $("#checkoutError").textContent = validationError;
    return;
  }
  payWithPaystack();
}

/* ---------- Wire events ---------- */
function init() {
  $("#year").textContent = new Date().getFullYear();
  loadCart();
  renderCartBadge();
  renderCartDrawer();

  // Currency
  $("#currency").addEventListener("change", (e) => {
    state.currency = e.target.value;
    renderShop();
    renderCartDrawer();
    renderSummary();
  });
  // Search
  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderShop();
  });
  // Add to cart (event delegation on the grid)
  $("#grid").addEventListener("click", (e) => {
    const btn = e.target.closest(".add-btn");
    if (!btn) return;
    addToCart(btn.dataset.id);
    btn.textContent = "Added ✓";
    btn.classList.add("added");
    setTimeout(() => {
      btn.textContent = "Add to bag";
      btn.classList.remove("added");
    }, 1200);
  });
  // Radio-style option cards (delivery)
  $$(".option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      $$(`.option[data-group="${group}"]`).forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );
      if (group === "delivery") state.delivery = value;
      renderSummary();
    });
  });
  // Discount
  $("#applyBtn").addEventListener("click", () => {
    const code = $("#discount").value.trim().toUpperCase();
    state.discount = code === "POLO10" ? 1000 : 0;
    renderSummary();
  });
  // Nav drawer
  $("#menuBtn").addEventListener("click", () => ($("#drawer").hidden = false));
  $("#drawerClose").addEventListener("click", () => ($("#drawer").hidden = true));
  $("#drawer").addEventListener("click", (e) => {
    if (e.target.id === "drawer") $("#drawer").hidden = true;
  });
  // "Shop All" resets the search filter
  $(".drawer-nav").addEventListener("click", (e) => {
    const shopAllLink = e.target.closest("[data-shop-all]");
    const categoryLink = e.target.closest("[data-category]");
    if (shopAllLink) {
      e.preventDefault();
      state.query = "";
      $("#search").value = "";
      renderShop();
      $("#drawer").hidden = true;
      $("#shop").scrollIntoView({ behavior: "smooth" });
    } else if (categoryLink) {
      e.preventDefault();
      state.query = categoryLink.dataset.category;
      $("#search").value = state.query;
      renderShop();
      $("#drawer").hidden = true;
      $("#shop").scrollIntoView({ behavior: "smooth" });
    }
  });
  // Cart drawer
  $("#cartBtn").addEventListener("click", () => ($("#cartDrawer").hidden = false));
  $("#cartClose").addEventListener("click", () => ($("#cartDrawer").hidden = true));
  $("#cartDrawer").addEventListener("click", (e) => {
    if (e.target.id === "cartDrawer") $("#cartDrawer").hidden = true;
  });
  $("#cartCheckoutBtn").addEventListener("click", () => ($("#cartDrawer").hidden = true));
  $("#cartItems").addEventListener("click", (e) => {
    const qtyBtn = e.target.closest("[data-qty]");
    const removeBtn = e.target.closest("[data-remove]");
    if (qtyBtn) changeQty(qtyBtn.dataset.id, Number(qtyBtn.dataset.qty));
    if (removeBtn) removeFromCart(removeBtn.dataset.remove);
  });
  // Order confirmation modal
  $("#orderModalClose").addEventListener("click", () => ($("#orderModal").hidden = true));
  // Pay now
  $("#payNowBtn").addEventListener("click", handlePayNow);

  initCountries();
  loadProducts(); // fetches from the database, then renders
  renderSummary();
}
document.addEventListener("DOMContentLoaded", init);