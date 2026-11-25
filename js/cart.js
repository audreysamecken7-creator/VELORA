const Cart = {
  key: "velora-cart",
  items: [],
  load() {
    try { this.items = JSON.parse(localStorage.getItem(this.key)) || []; }
    catch (_) { this.items = []; }
  },
  save() { localStorage.setItem(this.key, JSON.stringify(this.items)); },
  add(product, quantity = 1, size = "Standard", color = "#111111") {
    const existing = this.items.find(i => i.id === product.id && i.size === size && i.color === color);
    if (existing) existing.quantity += quantity;
    else this.items.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity, size, color });
    this.save();
  },
  remove(id, size, color) {
    this.items = this.items.filter(i => !(i.id === id && i.size === size && i.color === color));
    this.save();
  },
  setQuantity(id, size, color, quantity) {
    const item = this.items.find(i => i.id === id && i.size === size && i.color === color);
    if (!item) return;
    item.quantity = Math.max(1, quantity);
    this.save();
  },
  clear() { this.items = []; this.save(); },
  count() { return this.items.reduce((sum, item) => sum + item.quantity, 0); },
  total() { return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0); }
};
