/* ==================================================
   POLO DISTRICT — Admin (private page, not linked from the storefront)
   Reads/writes products live via Supabase (see supabase-config.js).
   ================================================== */
const $ = (sel) => document.querySelector(sel);

let products = [];
let editingId = null;

/* ---------- Auth ---------- */
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showAdmin();
  } else {
    showLogin();
  }
}
function showLogin() {
  $("#adminLock").hidden = false;
  $("#adminBody").hidden = true;
}
function showAdmin() {
  $("#adminLock").hidden = true;
  $("#adminBody").hidden = false;
  loadProducts();
}
async function handleLogin(e) {
  e.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  $("#loginError").textContent = "";
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    $("#loginError").textContent = "Incorrect email or password.";
    return;
  }
  showAdmin();
}
async function handleLogout() {
  await supabaseClient.auth.signOut();
  showLogin();
}

/* ---------- Load / render products ---------- */
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error(error.message);
    products = [];
  } else {
    products = data || [];
  }
  renderTable();
}
function renderTable() {
  const tbody = $("#productTbody");
  const emptyMsg = $("#tableEmpty");
  if (products.length === 0) {
    tbody.innerHTML = "";
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;
  tbody.innerHTML = products
    .map(
      (p) => `
      <tr>
        <td><img src="${escapeAttr(p.image)}" alt="" onerror="this.style.opacity=0.2" /></td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td>₦${Number(p.price).toLocaleString()}</td>
        <td>
          <button data-action="toggle-stock" data-id="${p.id}" style="background:none; border:none; cursor:pointer; padding:0;">
            <span class="pill" style="${p.in_stock ? "" : "border-color:#ef4444; background:rgba(239,68,68,0.08); color:#ef4444;"}">
              ${p.in_stock ? "In stock" : "Out of stock"}
            </span>
          </button>
        </td>
        <td>
          <div class="admin-row-actions">
            <button data-action="edit" data-id="${p.id}">Edit</button>
            <button data-action="remove" data-id="${p.id}">Remove</button>
          </div>
        </td>
      </tr>`
    )
    .join("");
}
function escapeHtml(str = "") {
  return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function escapeAttr(str = "") {
  return escapeHtml(str);
}

/* ---------- Form handling ---------- */
function resetForm() {
  editingId = null;
  $("#pName").value = "";
  $("#pCategory").value = "";
  $("#pPrice").value = "";
  $("#pInStock").checked = true;
  $("#pImageFile").value = "";
  $("#pImageUrl").value = "";
  $("#formTitle").textContent = "Add a product";
  $("#submitBtn").textContent = "Add product";
  $("#cancelEditBtn").hidden = true;
  $("#formError").textContent = "";
  $("#savingMsg").textContent = "";
}
function fillFormForEdit(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  editingId = id;
  $("#pName").value = p.name;
  $("#pCategory").value = p.category;
  $("#pPrice").value = p.price;
  $("#pInStock").checked = p.in_stock !== false;
  $("#pImageFile").value = "";
  $("#pImageUrl").value = p.image;
  $("#formTitle").textContent = `Editing ${p.name}`;
  $("#submitBtn").textContent = "Save changes";
  $("#cancelEditBtn").hidden = false;
  window.scrollTo({ top: $("#productForm").offsetTop - 20, behavior: "smooth" });
}

async function uploadImageIfNeeded() {
  const file = $("#pImageFile").files[0];
  if (!file) {
    return $("#pImageUrl").value.trim(); // fall back to pasted URL
  }
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const { error: uploadError } = await supabaseClient.storage
    .from("product-images")
    .upload(path, file);
  if (uploadError) throw uploadError;
  const { data } = supabaseClient.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

async function handleSubmit(e) {
  e.preventDefault();
  const name = $("#pName").value.trim();
  const category = $("#pCategory").value.trim();
  const price = Number($("#pPrice").value);

  if (!name || !category || !price || price <= 0) {
    $("#formError").textContent = "Please fill in name, category and a valid price.";
    return;
  }
  const hasNewFile = $("#pImageFile").files.length > 0;
  const hasUrl = $("#pImageUrl").value.trim();
  if (!hasNewFile && !hasUrl) {
    $("#formError").textContent = "Add a photo or paste an image URL.";
    return;
  }
  $("#formError").textContent = "";
  $("#savingMsg").textContent = "Saving...";
  $("#submitBtn").disabled = true;

  try {
    const image = await uploadImageIfNeeded();
    const in_stock = $("#pInStock").checked;
    if (editingId) {
      const { error } = await supabaseClient
        .from("products")
        .update({ name, category, price, image, in_stock })
        .eq("id", editingId);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from("products")
        .insert([{ name, category, price, image, in_stock }]);
      if (error) throw error;
    }
    await loadProducts();
    resetForm();
  } catch (err) {
    $("#formError").textContent = "Something went wrong: " + err.message;
    $("#savingMsg").textContent = "";
  } finally {
    $("#submitBtn").disabled = false;
  }
}

async function handleTableClick(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === "edit") {
    fillFormForEdit(id);
  } else if (btn.dataset.action === "toggle-stock") {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const { error } = await supabaseClient
      .from("products")
      .update({ in_stock: !p.in_stock })
      .eq("id", id);
    if (error) {
      alert("Couldn't update stock status: " + error.message);
      return;
    }
    await loadProducts();
  } else if (btn.dataset.action === "remove") {
    if (!confirm("Remove this product from the shop?")) return;
    const { error } = await supabaseClient.from("products").delete().eq("id", id);
    if (error) {
      alert("Couldn't remove it: " + error.message);
      return;
    }
    await loadProducts();
    if (editingId === id) resetForm();
  }
}

/* ---------- Init ---------- */
function init() {
  $("#loginForm").addEventListener("submit", handleLogin);
  $("#logoutBtn").addEventListener("click", handleLogout);
  $("#productForm").addEventListener("submit", handleSubmit);
  $("#cancelEditBtn").addEventListener("click", resetForm);
  $("#productTbody").addEventListener("click", handleTableClick);
  checkSession();
}
document.addEventListener("DOMContentLoaded", init);