// Döner Ordering Website - Main JavaScript
// Material Design 3 Implementation with collaborative ordering

class DonerOrderingApp {
  constructor() {
    // Configuration
    this.config = {
      orderDeadlineTime: '11:15',
      resetTime: '14:00', // 2 PM
      refreshInterval: 5000, // 5 seconds
      storageKeys: {
        orders: 'doner_shared_orders',
        userName: 'user_session_name',
        lastReset: 'last_reset_date',
        adminPhone: 'admin_phone_number'
      }
    };

    // State
    this.currentUser = null;
    this.orders = [];
    this.isOrderingOpen = true;
    this.selectedCategory = 'all';
    
    // Initialize app
    this.init();
  }

  init() {
    this.loadUserSession();
    this.loadSharedOrders();
    this.setupEventListeners();
    this.renderProducts();
    this.updateUI();
    this.startPeriodicUpdates();
    this.checkTimeBasedControls();
  }

  // User Session Management
  loadUserSession() {
    this.currentUser = sessionStorage.getItem(this.config.storageKeys.userName);
    if (this.currentUser) {
      document.getElementById('customerName').value = this.currentUser;
    }
  }

  saveUserSession(name) {
    this.currentUser = name;
    sessionStorage.setItem(this.config.storageKeys.userName, name);
  }

  // Shared Orders Management
  loadSharedOrders() {
    const stored = localStorage.getItem(this.config.storageKeys.orders);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.orders = data.orders || [];
      } catch (e) {
        console.error('Error loading orders:', e);
        this.orders = [];
      }
    }
  }

  saveSharedOrders() {
    const data = {
      orders: this.orders,
      lastUpdated: new Date().toISOString(),
      isOrderingOpen: this.isOrderingOpen
    };
    localStorage.setItem(this.config.storageKeys.orders, JSON.stringify(data));
  }

  // Event Listeners
  setupEventListeners() {
    // Name input
    const nameInput = document.getElementById('customerName');
    nameInput.addEventListener('blur', (e) => {
      const name = e.target.value.trim();
      if (name) {
        this.saveUserSession(name);
        this.updateUI();
      }
    });

    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        this.selectCategory(category);
      });
    });

    // Product options
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('md-select')) {
        const productId = e.target.id.replace('options-', '');
        const addButton = document.querySelector(`[data-product-id="${productId}"]`);
        if (addButton) {
          addButton.disabled = !e.target.value;
        }
      }
    });

    // Add to order buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-order-btn')) {
        const button = e.target.closest('.add-to-order-btn');
        const productId = button.dataset.productId;
        this.addToOrder(productId);
      }
    });

    // Orders toggle
    const toggleBtn = document.getElementById('toggleOrders');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleOrdersSection();
      });
    }

    // FAB SMS button
    const fabBtn = document.getElementById('sendSmsButton');
    if (fabBtn) {
      fabBtn.addEventListener('click', () => {
        this.showAdminPanel();
      });
    }

    // Admin panel
    const adminBtn = document.getElementById('adminButton');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        this.showAdminPanel();
      });
    }

    const closeAdminBtn = document.getElementById('closeAdmin');
    if (closeAdminBtn) {
      closeAdminBtn.addEventListener('click', () => {
        this.hideAdminPanel();
      });
    }

    // Modal overlay click to close
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
      adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
          this.hideAdminPanel();
        }
      });
    }

    // Admin actions
    const sendSmsAdminBtn = document.getElementById('sendSmsAdmin');
    if (sendSmsAdminBtn) {
      sendSmsAdminBtn.addEventListener('click', () => {
        this.sendOrderSMS();
      });
    }

    const resetOrdersBtn = document.getElementById('resetOrders');
    if (resetOrdersBtn) {
      resetOrdersBtn.addEventListener('click', () => {
        this.resetOrders();
      });
    }

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.refreshOrderDisplay();
      }
    });
  }

  // Product Management
  selectCategory(category) {
    this.selectedCategory = category;
    
    // Update tab states
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });
    
    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.setAttribute('aria-selected', 'true');
    }

    this.renderProducts();
  }

  renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const products = menuData.getProductsByCategory(this.selectedCategory);
    
    grid.innerHTML = products.map(product => 
      menuData.generateProductHTML(product)
    ).join('');

    // Add ripple effects to buttons
    this.addRippleEffects();
  }

  addToOrder(productId) {
    if (!this.currentUser) {
      this.showSnackbar('Please enter your name first!', 'error');
      document.getElementById('customerName').focus();
      return;
    }

    if (!this.isOrderingOpen) {
      this.showSnackbar('Ordering is closed for today!', 'error');
      return;
    }

    const product = menuData.getProductById(productId);
    if (!product) return;

    // Get selected option if applicable
    let selectedOption = null;
    const optionSelect = document.getElementById(`options-${productId}`);
    if (optionSelect && optionSelect.value) {
      selectedOption = optionSelect.value;
    } else if (product.options && product.options.length > 0) {
      this.showSnackbar('Please select an option first!', 'error');
      return;
    }

    // Check if user already has this exact item
    const existingOrderIndex = this.orders.findIndex(order => 
      order.customerName === this.currentUser &&
      order.productId === productId &&
      order.selectedOption === selectedOption
    );

    if (existingOrderIndex >= 0) {
      // Increase quantity
      this.orders[existingOrderIndex].quantity += 1;
    } else {
      // Add new order
      const newOrder = {
        id: this.generateUUID(),
        customerName: this.currentUser,
        productId: productId,
        productName: product.name,
        price: product.price,
        quantity: 1,
        selectedOption: selectedOption,
        timestamp: new Date().toISOString(),
        deviceId: this.getDeviceId()
      };
      this.orders.push(newOrder);
    }

    this.saveSharedOrders();
    this.updateUI();
    this.showSnackbar(`${product.name} added to order! 🍽️`, 'success');

    // Reset option select
    if (optionSelect) {
      optionSelect.value = '';
      const addButton = document.querySelector(`[data-product-id="${productId}"]`);
      if (addButton && product.options.length > 0) {
        addButton.disabled = true;
      }
    }
  }

  // Order Management
  removeFromOrder(orderId) {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex >= 0) {
      const order = this.orders[orderIndex];
      if (order.customerName === this.currentUser) {
        this.orders.splice(orderIndex, 1);
        this.saveSharedOrders();
        this.updateUI();
        this.showSnackbar('Item removed from order', 'success');
      }
    }
  }

  updateOrderQuantity(orderId, newQuantity) {
    const order = this.orders.find(order => order.id === orderId);
    if (order && order.customerName === this.currentUser) {
      if (newQuantity <= 0) {
        this.removeFromOrder(orderId);
      } else {
        order.quantity = newQuantity;
        this.saveSharedOrders();
        this.updateUI();
      }
    }
  }

  // UI Updates
  updateUI() {
    this.updateOrderCount();
    this.updateOrdersList();
    this.updateFABState();
    this.updateOrderStatus();
  }

  updateOrderCount() {
    const countElement = document.getElementById('orderCount');
    if (countElement) {
      const totalOrders = this.orders.length;
      const uniqueCustomers = new Set(this.orders.map(o => o.customerName)).size;
      countElement.textContent = `${uniqueCustomers} people, ${totalOrders} items`;
    }
  }

  updateOrdersList() {
    const ordersListElement = document.getElementById('ordersList');
    const emptyOrdersElement = document.getElementById('emptyOrders');
    
    if (!ordersListElement || !emptyOrdersElement) return;

    if (this.orders.length === 0) {
      emptyOrdersElement.style.display = 'block';
      ordersListElement.style.display = 'none';
      return;
    }

    emptyOrdersElement.style.display = 'none';
    ordersListElement.style.display = 'block';

    // Group orders by customer
    const ordersByCustomer = this.groupOrdersByCustomer();
    
    ordersListElement.innerHTML = Object.entries(ordersByCustomer)
      .map(([customerName, customerOrders]) => {
        const isCurrentUser = customerName === this.currentUser;
        const orderItems = customerOrders.map(order => {
          const optionText = order.selectedOption ? ` (${order.selectedOption})` : '';
          return `
            <div class="order-item">
              <div class="order-details">
                <span class="order-customer">${customerName}:</span>
                ${order.productName}${optionText} (${order.quantity}x)
              </div>
              ${isCurrentUser && this.isOrderingOpen ? `
                <div class="order-actions">
                  <button onclick="app.updateOrderQuantity('${order.id}', ${order.quantity - 1})" 
                          title="Decrease quantity">−</button>
                  <button onclick="app.updateOrderQuantity('${order.id}', ${order.quantity + 1})" 
                          title="Increase quantity">+</button>
                  <button onclick="app.removeFromOrder('${order.id}')" 
                          title="Remove item">🗑️</button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
        
        return orderItems;
      }).join('');

    // Update order summary for SMS
    this.updateOrderSummary();
  }

  updateOrderSummary() {
    const summaryElement = document.getElementById('ordersSummary');
    if (!summaryElement) return;

    if (this.orders.length === 0) {
      summaryElement.innerHTML = '';
      return;
    }

    const summary = this.generateOrderSummary();
    summaryElement.innerHTML = `
      <div class="order-summary">
        <h4>📋 Order Summary for Restaurant:</h4>
        <div class="summary-text">${summary}</div>
      </div>
    `;
  }

  updateFABState() {
    const fabBtn = document.getElementById('sendSmsButton');
    if (fabBtn) {
      fabBtn.disabled = this.orders.length === 0;
    }
  }

  updateOrderStatus() {
    const statusElement = document.getElementById('orderStatus');
    if (!statusElement) return;

    if (this.isOrderingOpen) {
      statusElement.textContent = `Open until ${this.config.orderDeadlineTime}`;
      statusElement.style.color = 'var(--md-sys-color-success)';
    } else {
      statusElement.textContent = 'Ordering Closed';
      statusElement.style.color = 'var(--md-sys-color-error)';
    }
  }

  toggleOrdersSection() {
    const content = document.getElementById('ordersContent');
    const toggleBtn = document.getElementById('toggleOrders');
    
    if (content && toggleBtn) {
      const isCollapsed = content.classList.contains('collapsed');
      
      if (isCollapsed) {
        content.classList.remove('collapsed');
        toggleBtn.classList.remove('collapsed');
        toggleBtn.setAttribute('aria-expanded', 'true');
      } else {
        content.classList.add('collapsed');
        toggleBtn.classList.add('collapsed');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    }
  }

  // Time-based Controls
  checkTimeBasedControls() {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');

    // Check if ordering should be closed
    if (currentTime >= this.config.orderDeadlineTime) {
      this.isOrderingOpen = false;
      this.disableOrdering();
    }

    // Check if orders should be reset (after 2 PM on new day)
    this.checkDailyReset();

    // Update countdown timer
    this.updateCountdownTimer();
  }

  checkDailyReset() {
    const now = new Date();
    const today = now.toDateString();
    const lastReset = localStorage.getItem(this.config.storageKeys.lastReset);
    
    if (now.getHours() >= 14 && lastReset !== today) {
      this.resetOrders(true); // Silent reset
      localStorage.setItem(this.config.storageKeys.lastReset, today);
    }
  }

  updateCountdownTimer() {
    const timerElement = document.getElementById('countdownTimer');
    if (!timerElement) return;

    if (!this.isOrderingOpen) {
      timerElement.textContent = 'Ordering closed for today';
      return;
    }

    const now = new Date();
    const deadline = new Date();
    const [hours, minutes] = this.config.orderDeadlineTime.split(':');
    deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // If deadline has passed today, set for tomorrow
    if (now > deadline) {
      deadline.setDate(deadline.getDate() + 1);
    }

    const timeDiff = deadline - now;
    
    if (timeDiff <= 0) {
      timerElement.textContent = 'Ordering closed';
      this.isOrderingOpen = false;
      this.disableOrdering();
      return;
    }

    const hours_left = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes_left = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    timerElement.textContent = `⏰ ${hours_left}h ${minutes_left}m remaining`;
  }

  disableOrdering() {
    // Disable all add to order buttons
    document.querySelectorAll('.add-to-order-btn').forEach(btn => {
      btn.disabled = true;
      btn.textContent = 'Ordering Closed';
    });

    // Update status
    this.updateOrderStatus();
  }

  // Admin Panel
  showAdminPanel() {
    const modal = document.getElementById('adminModal');
    if (modal) {
      modal.classList.add('visible');
      modal.setAttribute('aria-hidden', 'false');
      this.updateAdminStats();
      
      // Load saved phone number
      const savedPhone = localStorage.getItem(this.config.storageKeys.adminPhone);
      if (savedPhone) {
        document.getElementById('phoneNumber').value = savedPhone;
      }
    }
  }

  hideAdminPanel() {
    const modal = document.getElementById('adminModal');
    if (modal) {
      modal.classList.remove('visible');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  updateAdminStats() {
    const statsElement = document.getElementById('adminStats');
    if (!statsElement) return;

    const totalOrders = this.orders.length;
    const uniqueCustomers = new Set(this.orders.map(o => o.customerName)).size;
    const summary = this.generateOrderSummary();

    statsElement.innerHTML = `
      <div class="stat-item">
        <strong>Total Orders:</strong> ${totalOrders}
      </div>
      <div class="stat-item">
        <strong>Customers:</strong> ${uniqueCustomers}
      </div>
      <div class="stat-item">
        <strong>SMS Summary:</strong>
        <div class="sms-preview">${summary || 'No orders yet'}</div>
      </div>
    `;
  }

  // SMS Functionality
  async sendOrderSMS() {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput?.value.trim();

    if (!phoneNumber) {
      this.showSnackbar('Please enter a phone number first!', 'error');
      return;
    }

    if (this.orders.length === 0) {
      this.showSnackbar('No orders to send!', 'error');
      return;
    }

    // Save phone number
    localStorage.setItem(this.config.storageKeys.adminPhone, phoneNumber);

    const summary = this.generateOrderSummary();
    const message = `Döner Orders - ${new Date().toLocaleDateString()}: ${summary}`;

    this.showLoading('Sending SMS...');

    try {
      // In a real implementation, this would call your Azure Communication Services endpoint
      await this.simulateSMSSend(phoneNumber, message);
      
      this.hideLoading();
      this.hideAdminPanel();
      this.showSnackbar('SMS sent successfully! 📱', 'success');
      
      // Mark orders as sent
      this.isOrderingOpen = false;
      this.disableOrdering();
      
    } catch (error) {
      this.hideLoading();
      console.error('SMS sending failed:', error);
      this.showSnackbar('Failed to send SMS. Please try again.', 'error');
    }
  }
  async simulateSMSSend(phoneNumber, message) {
    try {
      // Real API implementation
      const response = await fetch('/api/sms-sender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          message,
          adminPassword: prompt('Enter admin password (leave empty for simulation):') || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `SMS sending failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('SMS API response:', result);
      return result;
      
    } catch (error) {
      // Fallback to simulation if API is not available
      if (error.message.includes('Failed to fetch')) {
        console.log('API not available, falling back to simulation');
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('SMS would be sent to:', phoneNumber);
        console.log('Message:', message);
        return { success: true, messageId: 'sim-' + Date.now() };
      }
      throw error;
    }
  }

  resetOrders(silent = false) {
    if (!silent) {
      if (!confirm('Are you sure you want to reset all orders? This cannot be undone.')) {
        return;
      }
    }

    this.orders = [];
    this.saveSharedOrders();
    this.updateUI();
    
    if (!silent) {
      this.showSnackbar('All orders have been reset', 'success');
      this.hideAdminPanel();
    }
  }

  // Helper Functions
  groupOrdersByCustomer() {
    const grouped = {};
    this.orders.forEach(order => {
      if (!grouped[order.customerName]) {
        grouped[order.customerName] = [];
      }
      grouped[order.customerName].push(order);
    });
    return grouped;
  }

  generateOrderSummary() {
    if (this.orders.length === 0) return '';

    // Combine items by product and option
    const itemCounts = {};
    
    this.orders.forEach(order => {
      const key = order.selectedOption ? 
        `${order.productName} (${order.selectedOption})` : 
        order.productName;
      
      itemCounts[key] = (itemCounts[key] || 0) + order.quantity;
    });

    return Object.entries(itemCounts)
      .map(([item, quantity]) => `${quantity}x ${item}`)
      .join(', ');
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = this.generateUUID();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  refreshOrderDisplay() {
    this.loadSharedOrders();
    this.updateUI();
  }

  startPeriodicUpdates() {
    setInterval(() => {
      this.refreshOrderDisplay();
      this.checkTimeBasedControls();
    }, this.config.refreshInterval);
  }

  // UI Feedback
  showSnackbar(message, type = 'info') {
    const snackbar = document.getElementById('snackbar');
    if (!snackbar) return;

    snackbar.textContent = message;
    snackbar.className = `snackbar ${type}`;
    snackbar.classList.add('visible');

    setTimeout(() => {
      snackbar.classList.remove('visible');
    }, 3000);
  }

  showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.querySelector('.loading-text');
    
    if (overlay) {
      if (text) text.textContent = message;
      overlay.classList.add('visible');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  addRippleEffects() {
    document.querySelectorAll('.md-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.createRipple(e, button);
      });
    });
  }

  createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 300ms cubic-bezier(0.0, 0.0, 0.2, 1.0);
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 300);
  }
}

// Ripple animation CSS (injected dynamically)
const rippleCSS = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;

// Inject ripple CSS
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new DonerOrderingApp();
});

// Make app globally accessible for onclick handlers
window.app = app;
