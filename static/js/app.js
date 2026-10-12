// nevartrend Client State & Cart Engine

const CartEngine = {
  getCart: function() {
    try {
      const cart = localStorage.getItem('nevartrend_cart');
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      return [];
    }
  },

  saveCart: function(cart) {
    localStorage.setItem('nevartrend_cart', JSON.stringify(cart));
    this.updateUI();
  },

  addItem: function(item) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(function(i) {
      return i.product_id === item.product_id && i.fabric_id === item.fabric_id;
    });
    
    if (existingIndex > -1) {
      cart[existingIndex].meters = parseFloat((cart[existingIndex].meters + item.meters).toFixed(1));
      cart[existingIndex].total_price = Math.round(cart[existingIndex].meters * cart[existingIndex].unit_price);
    } else {
      cart.push({
        id: 'ITEM-' + Date.now(),
        product_id: item.product_id,
        product_title: item.product_title,
        product_code: item.product_code || item.product_id,
        fabric_id: item.fabric_id,
        fabric_name: item.fabric_name,
        unit_price: item.unit_price,
        meters: item.meters,
        total_price: Math.round(item.meters * item.unit_price),
        image: item.image
      });
    }

    this.saveCart(cart);
    this.openDrawer();
    this.showToast('Desen ve kumaş sepetinize eklendi!', 'success');
  },

  removeItem: function(index) {
    const cart = this.getCart();
    cart.splice(index, 1);
    this.saveCart(cart);
    this.showToast('Ürün sepetten çıkarıldı.', 'info');
  },

  updateMeters: function(index, meters) {
    const cart = this.getCart();
    if (cart[index]) {
      const m = Math.max(0.5, parseFloat(meters) || 1);
      cart[index].meters = parseFloat(m.toFixed(1));
      cart[index].total_price = Math.round(cart[index].meters * cart[index].unit_price);
      this.saveCart(cart);
    }
  },

  clearCart: function() {
    localStorage.removeItem('nevartrend_cart');
    this.updateUI();
  },

  getSubtotal: function() {
    const cart = this.getCart();
    return cart.reduce(function(sum, item) { return sum + item.total_price; }, 0);
  },

  getDiscount: function() {
    const coupon = this.getCoupon();
    if (!coupon) return 0;
    const subtotal = this.getSubtotal();
    if (coupon.discount_pct) {
      return Math.round(subtotal * (coupon.discount_pct / 100));
    }
    return 0;
  },

  getShippingFee: function() {
    const subtotal = this.getSubtotal();
    const coupon = this.getCoupon();
    if (coupon && coupon.free_shipping) return 0;
    if (subtotal >= 1000 || subtotal === 0) return 0;
    return 79.90;
  },

  getTotal: function() {
    return Math.max(0, this.getSubtotal() - this.getDiscount() + this.getShippingFee());
  },

  getCoupon: function() {
    try {
      const c = localStorage.getItem('nevartrend_coupon');
      return c ? JSON.parse(c) : null;
    } catch(e) { return null; }
  },

  applyCoupon: function(couponObj) {
    localStorage.setItem('nevartrend_coupon', JSON.stringify(couponObj));
    this.updateUI();
  },

  removeCoupon: function() {
    localStorage.removeItem('nevartrend_coupon');
    this.updateUI();
  },

  updateUI: function() {
    const cart = this.getCart();
    const totalCount = cart.length;
    const subtotal = this.getSubtotal();
    const discount = this.getDiscount();
    const shipping = this.getShippingFee();
    const grandTotal = this.getTotal();

    document.querySelectorAll('.cart-count-badge').forEach(function(el) {
      el.textContent = totalCount;
      el.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    const drawerList = document.getElementById('cart-drawer-items');
    if (drawerList) {
      if (cart.length === 0) {
        drawerList.innerHTML = `
          <div class="text-center py-12 px-4">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <i data-lucide="shopping-bag" class="w-8 h-8"></i>
            </div>
            <p class="font-medium text-slate-700">Sepetiniz Henüz Boş</p>
            <p class="text-xs text-slate-500 mt-1">Beğendiğiniz desenleri istediğiniz kumaşa bastırın.</p>
            <a href="/fabrics" class="inline-block mt-4 px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 transition">Kumaşları Keşfet</a>
          </div>
        `;
      } else {
        drawerList.innerHTML = cart.map(function(item, idx) {
          return `
            <div class="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm mb-2.5">
              <img src="${item.image}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0 border" alt="${item.product_title}">
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                  <h4 class="text-sm font-semibold text-slate-800 truncate pr-2">${item.product_title}</h4>
                  <button onclick="CartEngine.removeItem(${idx})" class="text-slate-400 hover:text-red-500 transition p-1">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
                <p class="text-xs text-emerald-700 font-medium">${item.fabric_name}</p>
                <div class="flex items-center justify-between mt-2">
                  <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button onclick="CartEngine.updateMeters(${idx}, ${item.meters - 0.5})" class="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold">-</button>
                    <span class="px-2 py-0.5 text-xs font-semibold text-slate-800">${item.meters} m</span>
                    <button onclick="CartEngine.updateMeters(${idx}, ${item.meters + 0.5})" class="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold">+</button>
                  </div>
                  <span class="text-sm font-bold text-slate-900">${item.total_price.toLocaleString('tr-TR')} TL</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    const drawerSubtotal = document.getElementById('drawer-subtotal');
    if (drawerSubtotal) drawerSubtotal.textContent = subtotal.toLocaleString('tr-TR') + ' TL';

    const freeShippingThreshold = 1000;
    const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);
    const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

    const progressBar = document.getElementById('free-shipping-progress');
    const freeShippingText = document.getElementById('free-shipping-text');
    if (progressBar) progressBar.style.width = freeShippingProgress + '%';
    if (freeShippingText) {
      if (subtotal >= freeShippingThreshold) {
        freeShippingText.innerHTML = '<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="check-circle-2" class="w-4 h-4"></i> Harika! Ücretsiz Kargo Kazandınız!</span>';
      } else {
        freeShippingText.innerHTML = 'Ücretsiz Kargo için <strong class="text-emerald-700">' + remainingForFree.toFixed(0) + ' TL</strong> daha ekleyin!';
      }
    }

    const cartTableBody = document.getElementById('cart-page-items');
    if (cartTableBody) {
      if (cart.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-12 text-slate-500">Sepetinizde ürün bulunmamaktadır.</td></tr>';
      } else {
        cartTableBody.innerHTML = cart.map(function(item, idx) {
          return `
            <tr class="border-b border-slate-100 hover:bg-slate-50/50">
              <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                  <img src="${item.image}" class="w-16 h-16 rounded-xl object-cover border" alt="${item.product_title}">
                  <div>
                    <a href="/product/${item.product_id}" class="font-bold text-slate-800 hover:text-emerald-700 text-sm block">${item.product_title}</a>
                    <span class="text-xs text-slate-400">Kod: ${item.product_code}</span>
                  </div>
                </div>
              </td>
              <td class="py-4 px-4 text-sm font-medium text-slate-700">
                <span class="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs font-semibold border border-emerald-100">${item.fabric_name}</span>
              </td>
              <td class="py-4 px-4 text-sm text-slate-600 font-semibold">${item.unit_price} TL / m</td>
              <td class="py-4 px-4">
                <div class="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                  <button onclick="CartEngine.updateMeters(${idx}, ${item.meters - 0.5})" class="px-3 py-1 text-slate-500 hover:bg-slate-100">-</button>
                  <span class="w-14 text-center text-sm font-bold">${item.meters} m</span>
                  <button onclick="CartEngine.updateMeters(${idx}, ${item.meters + 0.5})" class="px-3 py-1 text-slate-500 hover:bg-slate-100">+</button>
                </div>
              </td>
              <td class="py-4 px-4 font-bold text-slate-900 text-base">${item.total_price.toLocaleString('tr-TR')} TL</td>
              <td class="py-4 px-4 text-right">
                <button onclick="CartEngine.removeItem(${idx})" class="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    document.querySelectorAll('.summary-subtotal').forEach(function(el) { el.textContent = subtotal.toLocaleString('tr-TR') + ' TL'; });
    document.querySelectorAll('.summary-discount').forEach(function(el) { el.textContent = discount > 0 ? '-' + discount.toLocaleString('tr-TR') + ' TL' : '0 TL'; });
    document.querySelectorAll('.summary-shipping').forEach(function(el) { el.textContent = shipping === 0 ? 'Ücretsiz' : shipping.toFixed(2) + ' TL'; });
    document.querySelectorAll('.summary-grandtotal').forEach(function(el) { el.textContent = grandTotal.toLocaleString('tr-TR') + ' TL'; });

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  openDrawer: function() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.remove('translate-x-full');
      overlay.classList.remove('hidden');
      setTimeout(function() { overlay.classList.remove('opacity-0'); }, 10);
    }
  },

  closeDrawer: function() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.add('translate-x-full');
      overlay.classList.add('opacity-0');
      setTimeout(function() { overlay.classList.add('hidden'); }, 300);
    }
  },

  showToast: function(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm text-white font-medium transform transition-all duration-300 translate-y-3 opacity-0 ' + (type === 'success' ? 'bg-emerald-800' : 'bg-slate-900');
    toast.innerHTML = '<i data-lucide="' + (type === 'success' ? 'check-circle' : 'info') + '" class="w-4 h-4"></i> <span>' + message + '</span>';
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    
    setTimeout(function() {
      toast.classList.remove('translate-y-3', 'opacity-0');
    }, 20);

    setTimeout(function() {
      toast.classList.add('opacity-0', 'translate-y-3');
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  CartEngine.updateUI();
});
