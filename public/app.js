const API_URL = '/api';

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authForm = document.getElementById('auth-form');
const authBtn = document.getElementById('auth-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const isAdminRegCheckbox = document.getElementById('is-admin-reg');
const adminCheckboxGroup = document.getElementById('admin-checkbox-group');
const authTitle = document.getElementById('auth-subtitle');
const authSwitchText = document.getElementById('auth-switch-text');
const logoutBtn = document.getElementById('logout-btn');
const loggedInUserSpan = document.getElementById('logged-in-user');

const productsGrid = document.getElementById('products-grid');
const cartCountSpan = document.getElementById('cart-count');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const viewOrdersBtn = document.getElementById('view-orders-btn');
const ordersModal = document.getElementById('orders-modal');
const closeOrdersBtn = document.getElementById('close-orders');
const ordersList = document.getElementById('orders-list');

const adminAddProductContainer = document.getElementById('admin-add-product-container');
const openAddProductModalBtn = document.getElementById('open-add-product-modal');
const productModal = document.getElementById('product-modal');
const closeProductModalBtn = document.getElementById('close-product-modal');
const addProductForm = document.getElementById('add-product-form');

let isLoginMode = true;
let products = [];
let cart = [];

// Mode Switcher Handler
function setupModeSwitcher() {
    const switchModeBtn = document.getElementById('switch-mode');
    if (switchModeBtn) {
        switchModeBtn.replaceWith(switchModeBtn.cloneNode(true));
        document.getElementById('switch-mode').addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            if (isLoginMode) {
                authTitle.textContent = 'Sign in to your store account';
                authBtn.textContent = 'Login';
                authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="switch-mode">Register</a>';
                adminCheckboxGroup.classList.add('hidden');
            } else {
                authTitle.textContent = 'Create a new store account';
                authBtn.textContent = 'Register';
                authSwitchText.innerHTML = 'Already have an account? <a href="#" id="switch-mode">Login</a>';
                adminCheckboxGroup.classList.remove('hidden');
            }
            setupModeSwitcher();
        });
    }
}
setupModeSwitcher();

// Auth Submit
authBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const isAdmin = isAdminRegCheckbox.checked;

    if (!username || !password) {
        alert('Please fill in all fields.');
        return;
    }

    const endpoint = isLoginMode ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const bodyData = isLoginMode ? { username, password } : { username, password, role: isAdmin ? 'admin' : 'user' };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Auth failed');

        if (isLoginMode) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
            checkAuth();
        } else {
            alert('Registration successful! Please login.');
            isLoginMode = true;
            authTitle.textContent = 'Sign in to your store account';
            authBtn.textContent = 'Login';
            authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="switch-mode">Register</a>';
            adminCheckboxGroup.classList.add('hidden');
            setupModeSwitcher();
        }
    } catch (err) {
        alert(err.message);
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    if (token) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loggedInUserSpan.textContent = `👤 ${username} (${role})`;
        if (role === 'admin') {
            adminAddProductContainer.classList.remove('hidden');
        } else {
            adminAddProductContainer.classList.add('hidden');
        }
        fetchProducts();
    } else {
        authSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
    }
}

// Fetch Products
async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        products = await res.json();
        renderProducts();
    } catch (err) {
        console.error(err);
    }
}

function renderProducts() {
    productsGrid.innerHTML = '';
    if (products.length === 0) {
        productsGrid.innerHTML = '<p>No products available. Add some as an Admin!</p>';
        return;
    }
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image}" class="product-img" alt="${p.title}">
            <div class="product-info">
                <h4 class="product-title">${p.title}</h4>
                <p class="product-desc">${p.description || 'No description'}</p>
                <div class="product-footer">
                    <span class="product-price">$${p.price.toFixed(2)}</span>
                    <button onclick="addToCart('${p._id}')" class="btn primary">Add to Cart</button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// Cart Functionality
window.addToCart = function(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    const existing = cart.find(item => item.product._id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ product, quantity: 1 });
    }
    updateCartCount();
    alert(`Added ${product.title} to cart!`);
};

function updateCartCount() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = totalCount;
}

cartBtn.addEventListener('click', () => {
    renderCartItems();
    cartModal.classList.remove('hidden');
});
closeCartBtn.addEventListener('click', () => cartModal.classList.add('hidden'));

function renderCartItems() {
    cartItemsList.innerHTML = '';
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalSpan.textContent = '0.00';
        return;
    }
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.product.price * item.quantity;
        total += itemTotal;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <strong>${item.product.title}</strong> x ${item.quantity}
            </div>
            <span>$${itemTotal.toFixed(2)}</span>
        `;
        cartItemsList.appendChild(div);
    });
    cartTotalSpan.textContent = total.toFixed(2);
}

checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) return alert('Your cart is empty.');
    const token = localStorage.getItem('token');
    const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const items = cart.map(item => ({ product: item.product._id, quantity: item.quantity }));

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items, totalAmount })
        });
        if (!res.ok) throw new Error('Checkout failed');
        alert('Order placed successfully!');
        cart = [];
        updateCartCount();
        cartModal.classList.add('hidden');
    } catch (err) {
        alert(err.message);
    }
});

// Orders Modal
viewOrdersBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await res.json();
        renderOrders(orders);
        ordersModal.classList.remove('hidden');
    } catch (err) {
        alert('Failed to load orders');
    }
});
closeOrdersBtn.addEventListener('click', () => ordersModal.classList.add('hidden'));

function renderOrders(orders) {
    ordersList.innerHTML = '';
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found.</p>';
        return;
    }
    orders.forEach(o => {
        const div = document.createElement('div');
        div.className = 'order-card';
        div.innerHTML = `
            <p><strong>Order ID:</strong> ${o._id}</p>
            <p><strong>Status:</strong> ${o.status}</p>
            <p><strong>Total:</strong> $${o.totalAmount.toFixed(2)}</p>
            <p><strong>Date:</strong> ${new Date(o.createdAt).toLocaleDateString()}</p>
        `;
        ordersList.appendChild(div);
    });
}

// Admin Add Product
openAddProductModalBtn.addEventListener('click', () => productModal.classList.remove('hidden'));
closeProductModalBtn.addEventListener('click', () => productModal.classList.add('hidden'));

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const title = document.getElementById('prod-title').value;
    const description = document.getElementById('prod-desc').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const image = document.getElementById('prod-image').value || undefined;

    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, price, category, image })
        });
        if (!res.ok) throw new Error('Failed to create product');
        alert('Product added successfully!');
        productModal.classList.add('hidden');
        addProductForm.reset();
        fetchProducts();
    } catch (err) {
        alert(err.message);
    }
});

checkAuth();