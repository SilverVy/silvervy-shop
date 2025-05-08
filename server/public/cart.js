const API_URL = 'https://silvervy-backend.onrender.com/api/cart';

// Проверка авторизации
function checkAuth() {
    return localStorage.getItem('token') !== null;
}

// Получение заголовка с токеном
function getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Обновление счетчика корзины
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    document.querySelectorAll('#cartCounter').forEach(el => el.textContent = cart.length);
}

// Загрузка корзины пользователя с сервера
async function loadUserCart() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}`, {
            method: 'GET',
            headers: getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки корзины');
        }

        const data = await response.json();
        localStorage.setItem('cart', JSON.stringify(data));
        updateCartCounter();
    } catch (error) {
        console.error('Ошибка при загрузке корзины:', error);
    }
}

// Сохранение корзины на сервер
async function saveCartToServer() {
    if (!checkAuth()) return;

    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    try {
        const response = await fetch(`${API_URL}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ items: cart })
        });

        if (!response.ok) {
            throw new Error('Ошибка сохранения корзины');
        }
    } catch (error) {
        console.error('Ошибка при сохранении корзины:', error);
    }
}

// Добавление товара с размером
document.querySelectorAll('.buy-button').forEach(button => {
    button.addEventListener('click', async () => {
        if (!localStorage.getItem('token')) {
            showErrorModal('Для добавления товаров необходимо авторизоваться');
            return;
        }
        const productContainer = button.closest('.product-page, .product-card');

        // Получаем данные товара
        const productName = productContainer.querySelector('h2, h4').textContent;
        const priceElement = productContainer.querySelector('.price');
        const image = productContainer.querySelector('.main-image img, .product-card img').src;

        // Получаем выбранный размер
        const sizeSelector = productContainer.querySelector('.size-selector');
        const selectedSize = sizeSelector
            ? sizeSelector.querySelector('.size.active')?.textContent
            : 'Не указан';

        // Парсим цену
        const price = parseFloat(
            priceElement.textContent
                .replace(/\s/g, '')
                .replace('₽', '')
        );

        // Создаем объект товара
        const product = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            name: productName,
            price: price,
            image: image,
            size: selectedSize
        };

        // Добавляем в корзину
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter();

        // Сохраняем на сервер, если пользователь авторизован
        if (checkAuth()) {
            await saveCartToServer();
        }
    });
});

// Удаление товара
window.removeFromCart = async (id) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCounter();

    // Сохраняем на сервер, если пользователь авторизован
    if (checkAuth()) {
        await saveCartToServer();
    }
}

// Рендер корзины
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                ${item.size ? `<p>Размер: ${item.size}</p>` : ''}
                <p>${item.price.toLocaleString()} ₽</p>
            </div>
            <span class="remove-item" onclick="removeFromCart('${item.id}')">✕</span>
        </div>
    `).join('');

    totalPrice.textContent = cart
        .reduce((sum, item) => sum + item.price, 0)
        .toLocaleString();
    const checkoutBtn = document.querySelector('.cta-button');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    if (document.querySelector('.cart-section')) renderCart();
    updateCartCounter();

    // Загружаем корзину пользователя, если он авторизован
    if (checkAuth()) {
        await loadUserCart();
        if (document.querySelector('.cart-section')) renderCart();
    }
});

// Показ формы заказа
document.querySelectorAll('.cta-button').forEach(button => {
    // Пропускаем кнопки с атрибутом data-ignore-cart
    if (button.hasAttribute('data-ignore-cart') || (button.hasAttribute('checkout-submit'))) return;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        if (cart.length === 0) {
            showErrorModal('Корзина пуста! Добавьте товары для оформления заказа');
            return;
        }
        document.getElementById('checkoutOverlay').style.display = 'flex';
    });
});

// Обработка формы
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        city: document.getElementById('city').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value
    };

    try {
        const response = await fetch('https://silvervy-backend.onrender.com/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showOrderMessage('Заказ оформлен! Проверьте вашу почту');
        }
    } catch (error) {
        showErrorModal('Ошибка при оформлении заказа');
    }
});

function showErrorModal(message) {
    const modal = document.createElement('div');
    modal.className = 'auth-error-modal';
    modal.innerHTML = `
        <div class="auth-error-content">
            <div class="auth-error-header">
                <span class="auth-error-close">&times;</span>
            </div>
            <p>${message}</p>
            <button class="auth-error-account">Перейти к аккаунту</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Закрытие при клике на крестик
    modal.querySelector('.auth-error-close').addEventListener('click', () => {
        modal.remove();
    });

    // Переход к аккаунту
    modal.querySelector('.auth-error-account').addEventListener('click', () => {
        window.location.href = 'account.html';
        modal.remove();
    });

    // Закрытие при клике вне модального окна
    modal.addEventListener('click', (e) => {
        if(e.target === modal) {
            modal.remove();
        }
    });
}

function showOrderMessage(message) {
    const modal = document.createElement('div');
    modal.className = 'auth-error-modal';
    modal.innerHTML = `
        <div class="auth-error-content">
            <div class="auth-error-header">
                <span class="auth-error-close">&times;</span>
            </div>
            <p>${message}</p>
            <button class="auth-error-account">Перейти на главную страницу</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Закрытие при клике на крестик
    modal.querySelector('.auth-error-close').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelector('.auth-error-account').addEventListener('click', () => {
        window.location.href = 'index.html';
        modal.remove();
    });

    // Закрытие при клике вне модального окна
    modal.addEventListener('click', (e) => {
        if(e.target === modal) {
            modal.remove();
        }
    });
}

// При открытии формы
document.getElementById('city').addEventListener('focus', function() {
    window.scrollTo(0, 0);
});

document.getElementById('address').addEventListener('focus', function() {
    window.scrollTo(0, 0);
});

document.getElementById('notes').addEventListener('focus', function() {
    window.scrollTo(0, 0);
});

// При сабмите формы
document.getElementById('checkoutForm').addEventListener('submit', function(e) {
    e.preventDefault();
    window.scrollTo(0, 0);
});
