function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    document.querySelectorAll('#cartCounter').forEach(el => {
        el.textContent = cart.length;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Создание контейнера для ошибок
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    document.body.appendChild(errorContainer);

    // Функция показа ошибок
    const showError = (message, duration = 5000) => {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;

        errorContainer.appendChild(errorElement);

        setTimeout(() => {
            errorElement.style.opacity = '0';
            setTimeout(() => errorElement.remove(), 300);
        }, duration);
    };

    // Функция обновления интерфейса
    function updateUI() {
        updateCartCounter();

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (token && user) {
            document.querySelector('.auth-section').innerHTML = `
                <div class="user-profile">
                    <h2>Добро пожаловать, ${user.name}!</h2>
                    <p>Email: ${user.email}</p>
                    <button id="logoutButton" class="cta-button">Выйти</button>
                </div>
            `;

            document.getElementById('logoutButton')?.addEventListener('click', function() {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('cart');
                updateUI();
                showError('Вы успешно вышли из системы', 3000);
            });
        } else {
            document.querySelector('.auth-section').innerHTML = `
                <div class="auth-tabs">
                    <button class="tab active" data-tab="login">Вход</button>
                    <button class="tab" data-tab="register">Регистрация</button>
                </div>
                <form id="loginForm" class="auth-form active">
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Пароль" required>
                    <button type="submit" class="cta-button">Войти</button>
                </form>
                <form id="registerForm" class="auth-form">
                    <input type="text" placeholder="Имя" required>
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Пароль (минимум 6 символов)" minlength="6" required>
                    <button type="submit" class="cta-button">Зарегистрироваться</button>
                </form>
            `;

            // Инициализация табов
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.tab, .auth-form').forEach(el => el.classList.remove('active'));
                    tab.classList.add('active');
                    document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
                });
            });

            // Привязка обработчиков форм
            document.getElementById('registerForm').addEventListener('submit', handleRegister);
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
        }
    }

    // Обработчик регистрации
    async function handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const formData = {
            name: form.querySelector('input[type="text"]').value,
            email: form.querySelector('input[type="email"]').value,
            password: form.querySelector('input[type="password"]').value
        };

        // Валидация
        if (!formData.name || !formData.email || !formData.password) {
            return showError('Все поля обязательны для заполнения');
        }

        if (formData.password.length < 6) {
            return showError('Пароль должен содержать минимум 6 символов');
        }

        try {
            const response = await fetch('https://silvervy-backend.onrender.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.message.includes('already exists')
                    ? 'Пользователь с таким email уже существует'
                    : 'Пользователь с таким email уже существует';
                return showError(errorMsg);
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'index.html';

        } catch (error) {
            showError('Ошибка соединения с сервером');
        }
    }

    // Обработчик входа
    async function handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = {
            email: form.querySelector('input[type="email"]').value,
            password: form.querySelector('input[type="password"]').value
        };

        // Валидация
        if (!formData.email || !formData.password) {
            return showError('Все поля обязательны для заполнения');
        }

        try {
            const response = await fetch('https://silvervy-backend.onrender.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = response.status === 401
                    ? 'Неверный email или пароль'
                    : 'Неверный email или пароль';
                return showError(errorMsg);
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'index.html';

        } catch (error) {
            showError('Ошибка соединения с сервером');
        }
    }

    // Инициализация
    updateUI();
});