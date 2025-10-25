import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [], // { productId, name, price, qty }
  mechanicName: '',
  mechanicFee: 0,
  customerName: '',
  vehiclePlate: '',
  cashReceived: 0,

  // derived
  subtotal() {
    return get().items.reduce((s, it) => s + it.price * it.qty, 0);
  },
  total() {
    return get().subtotal() + (Number(get().mechanicFee) || 0);
  },
  change() {
    const ch = (Number(get().cashReceived) || 0) - get().total();
    return ch < 0 ? 0 : ch;
  },

  // actions
  reset() {
    set({
      items: [],
      mechanicName: '',
      mechanicFee: 0,
      customerName: '',
      vehiclePlate: '',
      cashReceived: 0,
    });
  },
  addItem(p) {
    const exists = get().items.find(i => i.productId === p.id);
    if (exists) {
      set({ items: get().items.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i) });
    } else {
      set({ items: [...get().items, { productId: p.id, name: p.name, price: p.price, qty: 1 }] });
    }
  },
  inc(productId) {
    set({ items: get().items.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i) });
  },
  dec(productId) {
    set({
      items: get().items
        .map(i => i.productId === productId ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0),
    });
  },
  remove(productId) {
    set({ items: get().items.filter(i => i.productId !== productId) });
  },

  setMechanicName(v) { set({ mechanicName: v }); },
  setMechanicFee(v) { set({ mechanicFee: Number(String(v).replace(/\D/g,'')) || 0 }); },
  setCustomerName(v) { set({ customerName: v }); },
  setVehiclePlate(v) { set({ vehiclePlate: v }); },
  setCashReceived(v) { set({ cashReceived: Number(String(v).replace(/\D/g,'')) || 0 }); },
}));
