// ============================================
// PAWCARE PREMIUM 3D INTERACTIVE SCRIPT
// ============================================

// Global cart and wishlist
let cart = [];
let wishlist = [];
let currentPage = 'home';

// ============================================
// 3D CARD TILT EFFECT
// ============================================

function attachCardTilt() {
  const cards = document.querySelectorAll('.product-card, .service-card, .card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      const scale = 1.03;
      
      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale(${scale})
        translateY(-8px)
      `;
      
      // Lighting effect
      const lightX = (x / rect.width) * 100;
      const lightY = (y / rect.height) * 100;
      card.style.backgroundImage = `
        radial-gradient(
          circle at ${lightX}% ${lightY}%,
          rgba(0, 102, 204, 0.1) 0%,
          transparent 50%
        )
      `;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.backgroundImage = '';
    });
  });
}

// ============================================
// PARALLAX SCROLL EFFECT
// ============================================

function attachParallaxEffect() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  window.addEventListener('scroll', () => {
    parallaxElements.forEach(el => {
      const scrollPos = window.scrollY;
      const speed = el.dataset.parallax || 0.5;
      el.style.transform = `translateY(${scrollPos * speed}px)`;
    });
  });
}

// ============================================
// SMOOTH SCROLL & ANIMATIONS
// ============================================

function observeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards`;
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe product cards, service cards, and sections
  document.querySelectorAll('.product-card, .service-card, .card, section').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// INTERACTIVE BUTTONS
// ============================================

function setupInteractiveButtons() {
  const buttons = document.querySelectorAll('.btn, .icon-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Ripple effect
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ============================================
// CART FUNCTIONALITY
// ============================================

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) {
    drawer.classList.toggle('open');
    updateCartDisplay();
  }
}

function addToCart(productName, price) {
  cart.push({
    name: productName,
    price: price,
    id: Date.now()
  });
  
  updateCartBadge();
  showNotification(`✓ ${productName} added to cart!`, 'success');
  
  // Animate cart icon
  const cartBtn = document.querySelector('[onclick*="toggleCart"]');
  if (cartBtn) {
    cartBtn.style.animation = 'pulse 0.5s';
    setTimeout(() => cartBtn.style.animation = '', 500);
  }
}

function updateCartBadge() {
  const badge = document.querySelector('.icon-badge');
  if (badge) {
    badge.textContent = cart.length;
  }
}

function updateCartDisplay() {
  const cartItems = document.getElementById('cartItems');
  if (!cartItems) return;
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">Your cart is empty</p>';
    return;
  }
  
  let html = '';
  let total = 0;
  
  cart.forEach(item => {
    const price = typeof item.price === 'string' ? 
      parseFloat(item.price.replace(/[₱,]/g, '')) : 
      item.price;
    total += price;
    
    html += `
      <div class="cart-item" style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${item.name}</strong>
          <p style="font-size: 12px; color: #666; margin-top: 4px;">₱${price.toFixed(2)}</p>
        </div>
        <button onclick="removeFromCart(${item.id})" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>
      </div>
    `;
  });
  
  cartItems.innerHTML = html;
  
  const subtotalEl = document.getElementById('cartSubtotal');
  if (subtotalEl) {
    subtotalEl.textContent = `₱${total.toFixed(2)}`;
  }
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartDisplay();
  updateCartBadge();
  showNotification('Item removed from cart', 'info');
}

// ============================================
// WISHLIST FUNCTIONALITY
// ============================================

function toggleWishlist(element) {
  element.classList.toggle('active');
  const isActive = element.classList.contains('active');
  element.style.color = isActive ? '#FF0000' : '#999';
  element.textContent = isActive ? '♥' : '♡';
  showNotification(isActive ? '♥ Added to wishlist' : 'Removed from wishlist', 'info');
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function setupSearch() {
  const searchInput = document.getElementById('search-input') || 
                     document.querySelector('[placeholder*="Search"]');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.product-card, .service-card');
      
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query) || query === '') {
          card.style.display = 'block';
          card.style.animation = 'slideUp 0.3s ease-out';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'info') {
  const toast = document.getElementById('toast') || createToast();
  toast.textContent = message;
  toast.className = 'toast active ' + type;
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

function createToast() {
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'toast';
  document.body.appendChild(toast);
  return toast;
}

// ============================================
// FILTER FUNCTIONALITY
// ============================================

function setupFilters() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      filterProducts();
    });
  });
}

function filterProducts() {
  const checkedFilters = document.querySelectorAll('input[type="checkbox"]:checked');
  const filters = Array.from(checkedFilters).map(el => el.nextElementSibling?.textContent || '');
  
  const cards = document.querySelectorAll('.product-card');
  
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const matches = filters.length === 0 || filters.some(filter => text.includes(filter.toLowerCase()));
    
    if (matches) {
      card.style.display = 'block';
      card.style.animation = 'slideUp 0.3s ease-out';
    } else {
      card.style.display = 'none';
    }
  });
}

// ============================================
// SORT FUNCTIONALITY
// ============================================

function setupSort() {
  const sortSelect = document.querySelector('select');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', (e) => {
    const sortType = e.target.value;
    const container = document.querySelector('.grid, .product-grid');
    if (!container) return;
    
    const items = Array.from(container.querySelectorAll('.product-card'));
    
    items.sort((a, b) => {
      const aPrice = parseFloat(a.querySelector('.product-price')?.textContent.replace(/[₱,]/g, '') || 0);
      const bPrice = parseFloat(b.querySelector('.product-price')?.textContent.replace(/[₱,]/g, '') || 0);
      
      switch(sortType) {
        case 'price-low':
          return aPrice - bPrice;
        case 'price-high':
          return bPrice - aPrice;
        case 'newest':
          return b.dataset.new - a.dataset.new;
        default:
          return 0;
      }
    });
    
    items.forEach(item => container.appendChild(item));
  });
}

// ============================================
// MODAL FUNCTIONALITY
// ============================================

function openModal(title, content) {
  const modal = document.getElementById('modalOverlay');
  if (!modal) return;
  
  const card = document.getElementById('modalCard');
  if (card) {
    card.innerHTML = `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <h2>${title}</h2>
      <div>${content}</div>
    `;
  }
  
  modal.style.display = 'flex';
  modal.style.animation = 'fadeIn 0.3s ease-out';
}

function closeModal() {
  const modal = document.getElementById('modalOverlay');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => modal.style.display = 'none', 300);
  }
}

// ============================================
// AUTHENTICATION
// ============================================

function toggleAuth() {
  const authOverlay = document.getElementById('authOverlay');
  if (authOverlay) {
    authOverlay.style.display = authOverlay.style.display === 'flex' ? 'none' : 'flex';
  }
}

function setupAuthForms() {
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  
  if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showNotification('✓ Successfully signed in!', 'success');
      toggleAuth();
    });
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showNotification('✓ Account created! Welcome to PawCare.', 'success');
      toggleAuth();
    });
  }
}

// ============================================
// FORMS
// ============================================

function setupCheckoutForm() {
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
      }
      
      const total = cart.reduce((sum, item) => {
        const price = typeof item.price === 'string' ? 
          parseFloat(item.price.replace(/[₱,]/g, '')) : 
          item.price;
        return sum + price;
      }, 0);
      
      showNotification(`✓ Order placed! Total: ₱${total.toFixed(2)}`, 'success');
      cart = [];
      updateCartBadge();
      updateCartDisplay();
      
      setTimeout(() => {
        const overlay = document.getElementById('checkoutOverlay');
        if (overlay) overlay.style.display = 'none';
      }, 1500);
    });
  }
}

function setupBookingForm() {
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const petName = document.querySelector('input[name="pet_name"]')?.value;
      showNotification(`✓ Appointment booked for ${petName}! You'll receive a confirmation email.`, 'success');
      
      setTimeout(() => {
        const overlay = document.getElementById('bookingOverlay');
        if (overlay) overlay.style.display = 'none';
        bookingForm.reset();
      }, 1500);
    });
  }
}

// ============================================
// INITIALIZE APP
// ============================================

function initializeApp() {
  console.log('PawCare premium interface initializing...');
  
  // Apply 3D effects
  attachCardTilt();
  attachParallaxEffect();
  observeScrollAnimations();
  
  // Setup interactive features
  setupInteractiveButtons();
  setupSearch();
  setupFilters();
  setupSort();
  setupAuthForms();
  setupCheckoutForm();
  setupBookingForm();
  
  // Setup event listeners
  const cartBtn = document.querySelector('[onclick*="toggleCart"]');
  if (cartBtn) {
    cartBtn.onclick = toggleCart;
  }
  
  const authBtn = document.querySelector('[onclick*="toggleAuth"]');
  if (authBtn) {
    authBtn.onclick = toggleAuth;
  }
  
  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay, .drawer-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  });
  
  updateCartBadge();
  
  console.log('✓ App ready with 3D effects and interactive features');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Smooth scroll on click
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Page visibility handling
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Hello App paused');
  } else {
    console.log('visibility App resumed');
    attachCardTilt(); // Reattach in case elements changed
  }
});
