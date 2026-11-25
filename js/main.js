Cart.load();

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const formatFCFA = value => new Intl.NumberFormat("fr-FR").format(value) + " FCFA";

let visibleCount = 8;
let activeFilter = "All";
let favorites = new Set(JSON.parse(localStorage.getItem("velora-favorites") || "[]"));

function productCard(product) {
  const heart = favorites.has(product.id);
  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-card__media" data-cursor="VIEW">
        ${product.badge ? `<span class="product-badge ${product.badge === "NEW" ? "product-badge--sale" : ""}">${product.badge}</span>` : ""}
        <button class="favorite ${heart ? "active" : ""}" data-favorite="${product.id}" aria-label="Ajouter aux favoris">
          <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"></path></svg>
        </button>
        <img class="main-image" src="${product.image}" alt="${product.name}" loading="lazy">
        <img class="second-image" src="${product.image2}" alt="${product.name} vue alternative" loading="lazy">
        <button class="quick-add" data-add="${product.id}">AJOUTER AU PANIER</button>
      </div>
      <div class="product-card__info">
        <h3>${product.name}</h3>
        <p>${product.category}</p>
        <strong>${formatFCFA(product.price)}</strong>
      </div>
    </article>`;
}

function getFilteredProducts() {
  let list = activeFilter === "All" ? [...PRODUCTS] : PRODUCTS.filter(p => p.category === activeFilter);
  const sort = $("#sort-products").value;
  if (sort === "price-asc") list.sort((a,b) => a.price - b.price);
  if (sort === "price-desc") list.sort((a,b) => b.price - a.price);
  if (sort === "featured") list.sort((a,b) => b.popularity - a.popularity);
  return list;
}

function renderProducts() {
  const grid = $("#product-grid");
  const list = getFilteredProducts().slice(0, visibleCount);
  grid.innerHTML = list.map(productCard).join("");
  grid.classList.remove("is-searching");
  if (window.ProductAnimations) window.ProductAnimations();
}

function updateCart() {
  const count = Cart.count();
  $("#cart-count").textContent = count;
  $("#cart-drawer-count").textContent = `${count} ARTICLE${count > 1 ? "S" : ""}`;
  $("#cart-total").textContent = formatFCFA(Cart.total());
  const countEl = $("#cart-count");
  countEl.classList.remove("bump");
  requestAnimationFrame(() => countEl.classList.add("bump"));

  const container = $("#cart-items");
  if (!Cart.items.length) {
    container.innerHTML = `<div class="cart-empty"><strong>TON PANIER EST VIDE</strong><span>Chaque mouvement commence quelque part.</span></div>`;
  } else {
    container.innerHTML = Cart.items.map(item => `
      <article class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <h3>${item.name}</h3>
          <p>${item.size} · ${formatFCFA(item.price)}</p>
          <div class="quantity-control">
            <button data-cart-minus="${item.id}" data-size="${item.size}" data-color="${item.color}" aria-label="Diminuer">−</button>
            <span>${item.quantity}</span>
            <button data-cart-plus="${item.id}" data-size="${item.size}" data-color="${item.color}" aria-label="Augmenter">+</button>
          </div>
        </div>
        <button class="remove-item" data-cart-remove="${item.id}" data-size="${item.size}" data-color="${item.color}" aria-label="Retirer">×</button>
      </article>`).join("");
  }
}

function openCart() {
  $("#cart-overlay").setAttribute("aria-hidden", "false");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  if (window.gsap) {
    gsap.to("#cart-overlay", {autoAlpha: 1, duration:.35});
    gsap.to("#cart-drawer", {x:0, duration:.55, ease:"power3.out"});
  }
}
function closeCart() {
  $("#cart-overlay").setAttribute("aria-hidden", "true");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
  if (window.gsap) {
    gsap.to("#cart-overlay", {autoAlpha:0, duration:.25});
    gsap.to("#cart-drawer", {x:"100%", duration:.45, ease:"power3.in"});
  }
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  gsap.to(el, {y:0, opacity:1, duration:.35, overwrite:true});
  clearTimeout(el.timer);
  el.timer = setTimeout(() => gsap.to(el, {y:100, opacity:0, duration:.35}), 2600);
}

function flyToCart(source) {
  if (!source) return;
  const rect = source.getBoundingClientRect();
  const cartRect = $("#cart-toggle").getBoundingClientRect();
  const fly = document.createElement("div");
  fly.className = "fly-item";
  fly.style.left = rect.left + rect.width/2 - 22 + "px";
  fly.style.top = rect.top + rect.height/2 - 22 + "px";
  fly.style.setProperty("--tx", cartRect.left - rect.left + "px");
  fly.style.setProperty("--ty", cartRect.top - rect.top + "px");
  document.body.appendChild(fly);
  setTimeout(() => fly.remove(), 750);
}

let selectedSize = "Standard";
let selectedColor = "#111111";
let modalProduct = null;
let modalQuantity = 1;

function openProductModal(id) {
  modalProduct = PRODUCTS.find(p => p.id === Number(id));
  if (!modalProduct) return;
  selectedSize = modalProduct.sizes[0];
  selectedColor = modalProduct.colors[0];
  modalQuantity = 1;
  $("#modal-image").src = modalProduct.image;
  $("#modal-image").alt = modalProduct.name;
  $("#modal-category").textContent = modalProduct.category;
  $("#modal-name").textContent = modalProduct.name;
  $("#modal-price").textContent = formatFCFA(modalProduct.price);
  $("#modal-description").textContent = modalProduct.description;
  $("#qty-value").textContent = "1";
  $("#size-options").innerHTML = modalProduct.sizes.map((size,i) => `<button class="${i===0?"active":""}" data-size="${size}">${size}</button>`).join("");
  $("#color-options").innerHTML = modalProduct.colors.map((color,i) => `<button class="${i===0?"active":""}" data-color="${color}" style="background:${color}" aria-label="Couleur ${i+1}"></button>`).join("");
  $("#modal-thumbs").innerHTML = [modalProduct.image, modalProduct.image2].map((img,i) => `<button class="${i===0?"active":""}" data-thumb="${img}"><img src="${img}" alt=""></button>`).join("");
  const modal = $("#product-modal");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("locked");
  gsap.to(modal, {autoAlpha:1, duration:.3});
  gsap.from(".product-modal", {y:35, scale:.96, duration:.5, ease:"power3.out"});
}
function closeProductModal() {
  const modal = $("#product-modal");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("locked");
  gsap.to(modal, {autoAlpha:0, duration:.25});
}

$("#product-grid").addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  const favoriteButton = event.target.closest("[data-favorite]");
  const media = event.target.closest(".product-card__media");
  if (addButton) {
    const product = PRODUCTS.find(p => p.id === Number(addButton.dataset.add));
    Cart.add(product);
    updateCart();
    flyToCart(addButton);
    toast(`${product.name} ajouté au panier`);
  } else if (favoriteButton) {
    const id = Number(favoriteButton.dataset.favorite);
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    localStorage.setItem("velora-favorites", JSON.stringify([...favorites]));
    favoriteButton.classList.toggle("active");
  } else if (media) {
    openProductModal(media.closest(".product-card").dataset.id);
  }
});

$("#filters").addEventListener("click", event => {
  const button = event.target.closest(".filter");
  if (!button) return;
  $$(".filter").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  activeFilter = button.dataset.filter;
  visibleCount = 12;
  gsap.to(".product-card", {opacity:0, y:-15, duration:.18, stagger:.015, onComplete:renderProducts});
});

$("#sort-products").addEventListener("change", renderProducts);
$("#load-more").addEventListener("click", () => {
  visibleCount += 4;
  renderProducts();
  gsap.from(".product-card", {opacity:0, y:30, stagger:.06, duration:.55, ease:"power3.out"});
});

$$(".category-card").forEach(card => card.addEventListener("click", () => {
  const category = card.dataset.category;
  const filter = $$(".filter").find(b => b.dataset.filter === category);
  if (filter) { filter.click(); }
}));

$("#cart-toggle").addEventListener("click", openCart);
$("#cart-close").addEventListener("click", closeCart);
$("#cart-overlay").addEventListener("click", closeCart);
$("#clear-cart").addEventListener("click", () => { Cart.clear(); updateCart(); toast("Panier vidé"); });
$("#cart-items").addEventListener("click", event => {
  const plus = event.target.closest("[data-cart-plus]");
  const minus = event.target.closest("[data-cart-minus]");
  const remove = event.target.closest("[data-cart-remove]");
  if (plus) {
    const item = Cart.items.find(i => i.id === Number(plus.dataset.cartPlus) && i.size === plus.dataset.size && i.color === plus.dataset.color);
    Cart.setQuantity(item.id,item.size,item.color,item.quantity+1);
  } else if (minus) {
    const item = Cart.items.find(i => i.id === Number(minus.dataset.cartMinus) && i.size === minus.dataset.size && i.color === minus.dataset.color);
    Cart.setQuantity(item.id,item.size,item.color,item.quantity-1);
  } else if (remove) {
    Cart.remove(Number(remove.dataset.cartRemove), remove.dataset.size, remove.dataset.color);
  }
  updateCart();
});

$("#checkout-button").addEventListener("click", () => {
  if (!Cart.items.length) return toast("Votre panier est vide");
  toast("Commande prête — paiement sécurisé");
});

$("#modal-close").addEventListener("click", closeProductModal);
$("#product-modal").addEventListener("click", event => { if (event.target === $("#product-modal")) closeProductModal(); });
$("#size-options").addEventListener("click", event => {
  const button = event.target.closest("[data-size]");
  if (!button) return;
  $$("#size-options button").forEach(b => b.classList.remove("active"));
  button.classList.add("active"); selectedSize = button.dataset.size;
});
$("#color-options").addEventListener("click", event => {
  const button = event.target.closest("[data-color]");
  if (!button) return;
  $$("#color-options button").forEach(b => b.classList.remove("active"));
  button.classList.add("active"); selectedColor = button.dataset.color;
});
$("#modal-thumbs").addEventListener("click", event => {
  const button = event.target.closest("[data-thumb]");
  if (!button) return;
  $$("#modal-thumbs button").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  gsap.fromTo("#modal-image",{opacity:.2,scale:1.03},{opacity:1,scale:1,duration:.45});
  $("#modal-image").src = button.dataset.thumb;
});
$("#qty-minus").addEventListener("click", () => { modalQuantity = Math.max(1,modalQuantity-1); $("#qty-value").textContent=modalQuantity; });
$("#qty-plus").addEventListener("click", () => { modalQuantity++; $("#qty-value").textContent=modalQuantity; });
$("#modal-add").addEventListener("click", () => {
  if (!modalProduct) return;
  Cart.add(modalProduct,modalQuantity,selectedSize,selectedColor);
  updateCart();
  toast(`${modalProduct.name} ajouté au panier`);
  closeProductModal();
  openCart();
});

let testimonialIndex = 0;
function showTestimonial(index) {
  const testimonials = $$(".testimonial");
  testimonialIndex = (index + testimonials.length) % testimonials.length;
  testimonials.forEach((item,i) => item.classList.toggle("active", i === testimonialIndex));
  gsap.fromTo(testimonials[testimonialIndex], {x:40,opacity:0},{x:0,opacity:1,duration:.6,ease:"power3.out"});
  $("#testimonial-index").textContent = `${String(testimonialIndex+1).padStart(2,"0")} / ${String(testimonials.length).padStart(2,"0")}`;
}
$("#testimonial-prev").addEventListener("click", () => showTestimonial(testimonialIndex-1));
$("#testimonial-next").addEventListener("click", () => showTestimonial(testimonialIndex+1));

$("#newsletter-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#email");
  const feedback = $("#form-feedback");
  if (!input.checkValidity()) {
    feedback.textContent = "Veuillez saisir une adresse e-mail valide.";
    gsap.fromTo(".newsletter__field",{x:-8},{x:8,duration:.08,repeat:5,yoyo:true,onComplete(){gsap.set(".newsletter__field",{x:0});}});
    return;
  }
  feedback.textContent = "Bienvenue dans le mouvement — votre accès est confirmé.";
  input.value = "";
  gsap.from(feedback,{y:12,opacity:0,duration:.5,ease:"power3.out"});
});

const searchOverlay = $("#search-overlay");
$("#search-toggle").addEventListener("click", () => {
  searchOverlay.setAttribute("aria-hidden","false");
  gsap.to(searchOverlay,{autoAlpha:1,duration:.35});
  setTimeout(() => $("#global-search").focus(),350);
});
$("#search-close").addEventListener("click", () => {
  gsap.to(searchOverlay,{autoAlpha:0,duration:.25});
  searchOverlay.setAttribute("aria-hidden","true");
});
$("#global-search").addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();
  if (!query) { activeFilter="All"; renderProducts(); return; }
  const matches = PRODUCTS.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(query)).slice(0,8);
  $("#product-grid").innerHTML = matches.map(productCard).join("");
  if (window.ProductAnimations) window.ProductAnimations();
  $("#shop").scrollIntoView({behavior:"smooth"});
});

const menuToggle = $("#menu-toggle");
const mobileMenu = $("#mobile-menu");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded",String(open));
  mobileMenu.setAttribute("aria-hidden",String(!open));
  document.body.classList.toggle("locked",open);
  if (open) gsap.to(mobileMenu,{y:"0%",autoAlpha:1,duration:.55,ease:"power4.out"});
  else gsap.to(mobileMenu,{y:"-100%",autoAlpha:0,duration:.45,ease:"power3.in"});
});
$$(".mobile-menu a").forEach(link => link.addEventListener("click", () => menuToggle.click()));

renderProducts();
updateCart();
