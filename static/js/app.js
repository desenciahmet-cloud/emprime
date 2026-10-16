// emprime.site Client State & Cart Engine

const CartEngine = {
  STORAGE_KEY: 'emprime_cart_v1',

  getCart: function() {
    try {
      const cart = localStorage.getItem(this.STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      console.error('Cart load error:', e);
      return [];
    }
  },

  saveCart: function(cart) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
      this.updateUI();
    } catch (e) {
      console.error('Cart save error:', e);
    }
  },

  addItem: function(item) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(function(i) {
      return i.product_id === item.product_id && i.service_type === item.service_type;
    });

    if (existingIndex > -1) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + (item.quantity || 1);
      cart[existingIndex].total_price = cart[existingIndex].quantity * cart[existingIndex].unit_price;
    } else {
      cart.push({
        id: 'EMP-' + Date.now().toString().slice(-6),
        product_id: item.product_id,
        product_title: item.product_title,
        product_code: item.product_code || item.product_id,
        technique: item.technique || 'Aşındırma / Su Bazlı',
        service_type: item.service_type || 'Dijital Dosya',
        unit_price: Number(item.unit_price) || 0,
        quantity: Number(item.quantity) || 1,
        total_price: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
        image: item.image || '/static/images/emprime/emp_pat_floral_wm.jpg'
      });
    }

    this.saveCart(cart);
    this.openDrawer();
    this.showToast('Hizmet sepetinize eklendi!', 'success');
  },

  removeItem: function(index) {
    const cart = this.getCart();
    cart.splice(index, 1);
    this.saveCart(cart);
    this.showToast('Ürün sepetten çıkarıldı.', 'info');
  },

  updateQuantity: function(index, qty) {
    const cart = this.getCart();
    if (cart[index]) {
      const q = Math.max(1, parseInt(qty) || 1);
      cart[index].quantity = q;
      cart[index].total_price = q * cart[index].unit_price;
      this.saveCart(cart);
    }
  },

  clearCart: function() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateUI();
    this.showToast('Sepet temizlendi.', 'info');
  },

  getTotal: function() {
    const cart = this.getCart();
    return cart.reduce(function(sum, item) {
      return sum + (Number(item.total_price) || 0);
    }, 0);
  },

  updateUI: function() {
    const cart = this.getCart();
    const totalCount = cart.reduce(function(sum, item) { return sum + (item.quantity || 1); }, 0);
    const grandTotal = this.getTotal();

    // Badges
    document.querySelectorAll('.cart-count-badge').forEach(function(el) {
      el.textContent = totalCount;
      el.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    // Subtotal and Total labels
    document.querySelectorAll('.summary-subtotal, .summary-total').forEach(function(el) {
      el.textContent = grandTotal.toLocaleString('tr-TR') + ' TL';
    });

    // Cart Drawer Items Container
    const drawerList = document.getElementById('cart-items-container');
    if (drawerList) {
      if (cart.length === 0) {
        drawerList.innerHTML = `
          <div class="text-center py-12 px-4 space-y-3">
            <div class="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-slate-700">
              <i data-lucide="shopping-bag" class="w-7 h-7"></i>
            </div>
            <p class="font-bold text-white text-sm">Hizmet Sepetiniz Boş</p>
            <p class="text-xs text-slate-400">Özel deseninizi yükleyebilir veya hazır koleksiyonumuzdan renk ayrımı talep edebilirsiniz.</p>
            <a href="#custom-upload-wizard" onclick="CartEngine.closeDrawer()" class="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 rounded-xl text-xs font-extrabold hover:brightness-110 transition shadow-md">
              <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
              <span>Renk Ayrımı İste</span>
            </a>
          </div>
        `;
      } else {
        drawerList.innerHTML = cart.map(function(item, idx) {
          return `
            <div class="flex items-start gap-3 py-3 border-b border-slate-800/80 last:border-b-0">
              <img src="${item.image}" class="w-14 h-14 object-cover rounded-xl border border-slate-700 bg-slate-800 shrink-0" alt="${item.product_title}">
              <div class="flex-1 min-w-0 space-y-1">
                <div class="flex justify-between items-start gap-1">
                  <h4 class="text-xs font-bold text-white leading-tight line-clamp-1">${item.product_title}</h4>
                  <button onclick="CartEngine.removeItem(${idx})" title="Sil" class="text-slate-500 hover:text-rose-400 transition p-0.5">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
                <div class="flex items-center gap-2 text-[10px] text-cyan-400 font-semibold">
                  <span>${item.technique}</span>
                  <span class="text-slate-600">•</span>
                  <span class="text-slate-300">${item.service_type}</span>
                </div>
                <div class="flex items-center justify-between pt-1">
                  <div class="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                    <button onclick="CartEngine.updateQuantity(${idx}, ${(item.quantity || 1) - 1})" class="px-2 py-0.5 text-slate-400 hover:bg-slate-700 text-xs font-bold">-</button>
                    <span class="px-2 py-0.5 text-xs font-extrabold text-white">${item.quantity || 1}</span>
                    <button onclick="CartEngine.updateQuantity(${idx}, ${(item.quantity || 1) + 1})" class="px-2 py-0.5 text-slate-400 hover:bg-slate-700 text-xs font-bold">+</button>
                  </div>
                  <span class="text-xs font-extrabold text-cyan-300">${item.total_price.toLocaleString('tr-TR')} TL</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

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

  checkoutWhatsapp: function() {
    const cart = this.getCart();
    if (cart.length === 0) {
      this.showToast('Sepetinizde ürün bulunmamaktadır.', 'info');
      return;
    }

    let msg = '🌟 *emprime.site Hizmet & Sipariş Talebi*\n\n';
    cart.forEach(function(item, idx) {
      msg += `${idx + 1}. *${item.product_title}*\n`;
      msg += `   • Baskı Türü: ${item.technique}\n`;
      msg += `   • Teslimat: ${item.service_type}\n`;
      msg += `   • Adet/Set: ${item.quantity}\n`;
      msg += `   • Tutar: ${item.total_price.toLocaleString('tr-TR')} TL\n\n`;
    });

    msg += `💰 *Genel Toplam:* ${this.getTotal().toLocaleString('tr-TR')} TL\n\n`;
    msg += `Merhabalar, yukarıdaki renk ayrımı ve film siparişini başlatmak ve teknik detayları iletmek istiyorum.`;

    const waUrl = `https://wa.me/908503000000?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  },

  showToast: function(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transform transition-all duration-300 translate-y-3 opacity-0 border ${
      isSuccess ? 'bg-slate-900 border-cyan-500/50 text-cyan-300 shadow-cyan-950/50' : 'bg-slate-900 border-slate-700 text-slate-200'
    }`;
    toast.innerHTML = `<i data-lucide="${isSuccess ? 'check-circle' : 'info'}" class="w-4 h-4 ${isSuccess ? 'text-cyan-400' : 'text-slate-400'}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    
    setTimeout(function() {
      toast.classList.remove('translate-y-3', 'opacity-0');
    }, 20);

    setTimeout(function() {
      toast.classList.add('opacity-0', 'translate-y-3');
      setTimeout(function() { toast.remove(); }, 300);
    }, 3200);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  CartEngine.updateUI();
});
