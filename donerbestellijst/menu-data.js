// Menu Data for Döner Ordering Website
// Based on prijslijst.txt with Material Design 3 categorization

const menuData = {
  categories: {
    fries: {
      name: "French Fries (Patat)",
      icon: "🍟",
      color: "#F39C12"
    },
    doner: {
      name: "Döner Options", 
      icon: "🥙",
      color: "#E74C3C"
    },
    wraps: {
      name: "Wraps & Sandwiches",
      icon: "🌯", 
      color: "#9B59B6"
    },
    pizza: {
      name: "Pizza",
      icon: "🍕",
      color: "#E67E22"
    },
    menu: {
      name: "Menu Deals",
      icon: "🍽️",
      color: "#27AE60"
    }
  },

  products: [
    // French Fries (Patat)
    {
      id: "patat_zonder",
      name: "Patat Zonder",
      description: "Plain fries - crispy and golden",
      price: 4.00,
      category: "fries",
      image: "🍟",
      allergens: ["gluten"],
      vegan: true,
      options: []
    },
    {
      id: "patat_saus",
      name: "Patat Met Saus", 
      description: "Fries with your choice of sauce",
      price: 4.50,
      category: "fries",
      image: "🍟",
      allergens: ["gluten"],
      vegan: false,
      options: [
        { name: "Mayo", price: 0 },
        { name: "Ketchup", price: 0 },
        { name: "Curry", price: 0 },
        { name: "Andalouse", price: 0 }
      ]
    },
    {
      id: "patat_speciaal",
      name: "Patat Speciaal",
      description: "Special fries with sauce and onions",
      price: 5.00,
      category: "fries", 
      image: "🍟",
      allergens: ["gluten"],
      vegan: false,
      options: []
    },

    // Döner Options
    {
      id: "doner_box",
      name: "Döner Box",
      description: "Choice of meat/veggie with potato salad and sauce",
      price: 8.50,
      category: "doner",
      image: "🥙",
      allergens: ["gluten", "dairy"],
      vegan: false,
      options: [
        { name: "Chicken", price: 0 },
        { name: "Veal", price: 0 },
        { name: "Falafel", price: 0, vegan: true },
        { name: "Halloumi", price: 0, vegetarian: true }
      ]
    },
    {
      id: "drum_doner",
      name: "Drum Döner",
      description: "Traditional drum döner with your choice of filling",
      price: 8.50,
      category: "doner",
      image: "🥙",
      allergens: ["gluten"],
      vegan: false,
      options: [
        { name: "Chicken", price: 0 },
        { name: "Veal", price: 0 },
        { name: "Falafel", price: 0, vegan: true },
        { name: "Halloumi", price: 0, vegetarian: true }
      ]
    },
    {
      id: "drum_doner_menu",
      name: "Drum Döner Menu",
      description: "Drum döner with salad, sauce and drink included",
      price: 14.00,
      category: "doner",
      image: "🥙",
      allergens: ["gluten"],
      vegan: false,
      popular: true,
      options: [
        { name: "Chicken", price: 0 },
        { name: "Veal", price: 0 },
        { name: "Falafel", price: 0, vegan: true },
        { name: "Halloumi", price: 0, vegetarian: true }
      ]
    },

    // Wraps & Sandwiches
    {
      id: "kapsalon_klein",
      name: "Kapsalon Klein",
      description: "Small portion with fries, cheese, salad and sauce",
      price: 8.00,
      category: "wraps",
      image: "🌯",
      allergens: ["gluten", "dairy"],
      vegan: false,
      options: [
        { name: "Chicken", price: 0 },
        { name: "Veal", price: 0 },
        { name: "Falafel", price: 0, vegan: true },
        { name: "Halloumi", price: 0, vegetarian: true }
      ]
    },
    {
      id: "kapsalon_groot",
      name: "Kapsalon Groot", 
      description: "Large portion with fries, cheese, salad and sauce",
      price: 10.00,
      category: "wraps",
      image: "🌯",
      allergens: ["gluten", "dairy"],
      vegan: false,
      popular: true,
      options: [
        { name: "Chicken", price: 0 },
        { name: "Veal", price: 0 },
        { name: "Falafel", price: 0, vegan: true },
        { name: "Halloumi", price: 0, vegetarian: true }
      ]
    },
    {
      id: "broodje_falafel",
      name: "Broodje Falafel",
      description: "Falafel sandwich with fresh salad and sauce",
      price: 7.00,
      category: "wraps",
      image: "🥪",
      allergens: ["gluten"],
      vegan: true,
      options: []
    },
    {
      id: "broodje_halloumi",
      name: "Broodje Halloumi",
      description: "Grilled halloumi sandwich with salad and sauce",
      price: 7.00,
      category: "wraps",
      image: "🥪",
      allergens: ["gluten", "dairy"],
      vegetarian: true,
      options: []
    },
    {
      id: "broodje_doner",
      name: "Broodje Döner",
      description: "Döner sandwich with salad and sauce",
      price: 7.50,
      category: "wraps",
      image: "🥪",
      allergens: ["gluten"],
      vegan: false,
      options: [
        { name: "Chicken", price: 0 },
        { name: "Veal", price: 0 }
      ]
    },

    // Pizza
    {
      id: "turkse_pizza_salade",
      name: "Turkse Pizza Salade",
      description: "Turkish pizza topped with fresh salad",
      price: 4.50,
      category: "pizza",
      image: "🍕",
      allergens: ["gluten"],
      vegan: false,
      options: []
    },
    {
      id: "turkse_pizza_kaas",
      name: "Turkse Pizza Kaas",
      description: "Turkish pizza with melted cheese",
      price: 5.50,
      category: "pizza",
      image: "🍕",
      allergens: ["gluten", "dairy"],
      vegetarian: true,
      options: []
    },
    {
      id: "turkse_pizza_deluxe",
      name: "Turkse Pizza Deluxe",
      description: "Turkish pizza with premium toppings",
      price: 8.50,
      category: "pizza",
      image: "🍕",
      allergens: ["gluten", "dairy"],
      vegan: false,
      popular: true,
      options: []
    },

    // Menu Deals
    {
      id: "doner_menu",
      name: "Döner Menu",
      description: "Complete döner meal with salad, sauce and drink",
      price: 13.00,
      category: "menu",
      image: "🍽️",
      allergens: ["gluten"],
      vegan: false,
      popular: true,
      options: [
        { name: "Chicken", price: 0 },
        { name: "Veal", price: 0 }
      ]
    }
  ],

  // Helper functions
  getProductById: function(id) {
    return this.products.find(product => product.id === id);
  },

  getProductsByCategory: function(category) {
    if (category === 'all') {
      return this.products;
    }
    return this.products.filter(product => product.category === category);
  },

  getPopularProducts: function() {
    return this.products.filter(product => product.popular);
  },

  getVeganProducts: function() {
    return this.products.filter(product => product.vegan);
  },

  getVegetarianProducts: function() {
    return this.products.filter(product => product.vegetarian || product.vegan);
  },

  searchProducts: function(query) {
    const searchTerm = query.toLowerCase();
    return this.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  },

  formatPrice: function(price) {
    return `€${price.toFixed(2)}`;
  },

  generateProductHTML: function(product) {
    const hasOptions = product.options && product.options.length > 0;
    const dietaryBadges = [];
    
    if (product.vegan) dietaryBadges.push('<span class="dietary-badge vegan">🌱 Vegan</span>');
    if (product.vegetarian) dietaryBadges.push('<span class="dietary-badge vegetarian">🥬 Vegetarian</span>');
    if (product.popular) dietaryBadges.push('<span class="dietary-badge popular">⭐ Popular</span>');

    return `
      <div class="md-card product-card" data-product-id="${product.id}" data-category="${product.category}">
        <div class="product-image">
          <span class="product-emoji">${product.image}</span>
          ${dietaryBadges.length > 0 ? `<div class="dietary-badges">${dietaryBadges.join('')}</div>` : ''}
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div class="product-price">${this.formatPrice(product.price)}</div>
          ${hasOptions ? `
            <div class="product-options">
              <select class="md-select" id="options-${product.id}">
                <option value="">Choose option...</option>
                ${product.options.map(option => 
                  `<option value="${option.name}">${option.name}${option.price > 0 ? ` (+€${option.price.toFixed(2)})` : ''}</option>`
                ).join('')}
              </select>
            </div>
          ` : ''}
          <div class="product-actions">
            <button class="md-button md-button--filled add-to-order-btn" 
                    data-product-id="${product.id}" 
                    ${hasOptions ? 'disabled' : ''}>
              <span class="button-icon">➕</span>
              <span class="button-text">Add to Order</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = menuData;
}
