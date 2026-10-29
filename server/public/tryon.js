(() => {
    const categories = {
        'product-boots.html': null,
        'product-loafers.html': null,
        'product-trousers.html': 'bottoms',
        'product-jeans.html': 'bottoms',
        'product-linen_shorts.html': 'bottoms',
        'product-shirt.html': 'tops',
        'product-linen_shirt.html': 'tops',
        'product-coat.html': 'tops',
        'product-bomber.html': 'tops',
        'product-trench.html': 'tops',
        'product-jean_coat.html': 'tops'
    };

    const fitProfiles = {
        'product-coat.html': { label: 'свободный oversize', ease: 14 },
        'product-bomber.html': { label: 'прямой', ease: 10 },
        'product-trench.html': { label: 'свободный прямой', ease: 12 },
        'product-trousers.html': { label: 'прямой', ease: 4 },
        'product-shirt.html': { label: 'свободный прямой', ease: 8 },
        'product-jeans.html': { label: 'свободный baggy', ease: 8 },
        'product-jean_coat.html': { label: 'свободный', ease: 10 },
        'product-linen_shirt.html': { label: 'свободный', ease: 8 },
        'product-linen_shorts.html': { label: 'свободный', ease: 6 }
    };

    const chart = {
        tops: [
            { size: 'XS', chest: [76, 82], waist: [58, 64], hip: [82, 88], height: [150, 165], weight: [42, 54] },
            { size: 'S', chest: [82, 88], waist: [64, 70], hip: [88, 94], height: [158, 172], weight: [50, 62] },
            { size: 'M', chest: [88, 96], waist: [70, 78], hip: [94, 102], height: [165, 178], weight: [58, 74] },
            { size: 'L', chest: [96, 104], waist: [78, 86], hip: [102, 110], height: [170, 185], weight: [68, 88] }
        ],
        bottoms: [
            { size: 'XS', chest: [76, 82], waist: [58, 64], hip: [82, 88], height: [150, 165], weight: [42, 54] },
            { size: 'S', chest: [82, 88], waist: [64, 70], hip: [88, 94], height: [158, 172], weight: [50, 62] },
            { size: 'M', chest: [88, 96], waist: [70, 78], hip: [94, 102], height: [165, 178], weight: [58, 74] },
            { size: 'L', chest: [96, 104], waist: [78, 86], hip: [102, 110], height: [170, 185], weight: [68, 88] }
        ]
    };

    function token() {
        return localStorage.getItem('token');
    }

    async function imageToDataUrl(source, maxDimension = 1200) {
        const response = await fetch(source);
        if (!response.ok) throw new Error('Не удалось загрузить изображение товара');
        const bitmap = await createImageBitmap(await response.blob());
        const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.86);
    }

    function getProduct(button) {
        const page = document.querySelector('.product-page');
        if (page) {
            const image = page.querySelector('.main-image img');
            const file = location.pathname.split('/').pop();
            return {
                name: page.querySelector('.product-info h2')?.textContent.trim() || 'Товар Silver.Vy',
                image: image?.src,
                category: categories[file] || null,
                fit: fitProfiles[file] || { label: 'стандартный', ease: 6 },
                sizes: [...page.querySelectorAll('.size')].map(item => item.textContent.trim()),
                selected: page.querySelector('.size.active')?.textContent.trim()
            };
        }

        const card = button.closest('.product-card');
        const image = card?.querySelector('.product-link img');
        const link = card?.querySelector('.product-link');
        const file = link?.getAttribute('href')?.split('/').pop();
        return {
            name: card?.querySelector('h4')?.textContent.trim() || 'Товар Silver.Vy',
            image: image?.src,
            category: categories[file] || null,
            fit: fitProfiles[file] || { label: 'стандартный', ease: 6 },
            sizes: ['XS', 'S', 'M', 'L']
        };
    }

    function chooseRecommendedSize(measurements, category) {
        const rows = chart[category];
        if (!rows) return null;
        const fields = category === 'tops' ? ['chest', 'waist', 'hip'] : ['waist', 'hip'];
        return rows
            .map(row => {
                let score = fields.reduce((sum, field) => {
                    const value = Number(measurements[`${field}Cm`]);
                    if (!value) return sum + 3;
                    const [min, max] = row[field];
                    if (value >= min && value <= max) return sum;
                    return sum + Math.min(Math.abs(value - min), Math.abs(value - max)) / 4;
                }, 0);
                for (const field of ['heightCm', 'weightKg']) {
                    const value = Number(measurements[field]);
                    const range = row[field === 'heightCm' ? 'height' : 'weight'];
                    if (value && range && (value < range[0] || value > range[1])) {
                        score += Math.min(Math.abs(value - range[0]), Math.abs(value - range[1])) / (field === 'heightCm' ? 25 : 12);
                    }
                }
                return { size: row.size, score };
            })
            .sort((a, b) => a.score - b.score)[0]?.size;
    }

    function createModal() {
        if (document.getElementById('tryonModal')) return document.getElementById('tryonModal');
        const modal = document.createElement('div');
        modal.id = 'tryonModal';
        modal.className = 'tryon-modal';
        modal.innerHTML = `
            <div class="tryon-dialog" role="dialog" aria-modal="true" aria-labelledby="tryonTitle">
                <button class="tryon-close" type="button" aria-label="Закрыть">×</button>
                <div class="tryon-heading"><span class="tryon-orb">✦</span><p>Виртуальная примерка</p><h2 id="tryonTitle">Ваш образ, созданный для вас</h2><span class="tryon-product"></span></div>
                <div class="tryon-steps">
                    <label class="tryon-upload" for="tryonPhoto"><span>01</span><strong>Загрузите фото в полный рост</strong><small>Один человек, анфас, фигура целиком; вертикальный кадр около 2:3</small><input id="tryonPhoto" type="file" accept="image/jpeg,image/png,image/webp" required><span class="tryon-file-name">Файл не выбран</span></label>
                    <div class="tryon-measurements">
                        <div><span>02</span><strong>Ваши параметры</strong></div>
                        <div class="tryon-measure-grid">
                            <label>Рост, см<input name="heightCm" type="number" min="120" max="220" required></label>
                            <label>Вес, кг<input name="weightKg" type="number" min="30" max="250" required></label>
                            <label>Грудь, см<input name="chestCm" type="number" min="60" max="160" required></label>
                            <label>Талия, см<input name="waistCm" type="number" min="45" max="150" required></label>
                            <label>Бёдра, см<input name="hipCm" type="number" min="65" max="170" required></label>
                        </div>
                        <span class="tryon-recommendation"></span>
                        <details class="tryon-chart">
                            <summary>Открыть размерную сетку</summary>
                            <div class="tryon-chart-table"></div>
                        </details>
                    </div>
                    <label class="tryon-size-label"><span>03</span>Размер для примерки<select class="tryon-size"></select></label>
                </div>
                <p class="tryon-fit-note">Подбор размера ориентировочный: сетка построена по типовым меркам, а не по замерам производителя. ИИ-визуализация не гарантирует точную посадку и не меняет физические размеры изделия.</p>
                <label class="tryon-consent"><input type="checkbox" required><span>Я согласен(на) передать фото в Hugging Face для генерации. Фото не сохраняется в профиле Silver.Vy.</span></label>
                <button class="tryon-generate" type="button"><span>✦</span> Создать примерку</button>
                <p class="tryon-status" role="status"></p>
                <div class="tryon-result"></div>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.tryon-close').addEventListener('click', () => modal.classList.remove('open'));
        modal.addEventListener('click', event => {
            if (event.target === modal) modal.classList.remove('open');
        });
        modal.querySelector('#tryonPhoto').addEventListener('change', event => {
            modal.querySelector('.tryon-file-name').textContent = event.target.files[0]?.name || 'Файл не выбран';
        });
        return modal;
    }

    function addButtons() {
        const detail = document.querySelector('.product-page');
        if (detail && !detail.querySelector('.tryon-launch')) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tryon-launch';
            button.textContent = '✦ Примерить на себе';
            detail.querySelector('.product-info')?.appendChild(button);
        }
        document.querySelectorAll('.product-card').forEach(card => {
            if (card.querySelector('.tryon-launch')) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tryon-launch';
            button.textContent = '✦ Примерить на себе';
            card.appendChild(button);
        });

        document.querySelectorAll('.tryon-launch').forEach(button => {
            const product = getProduct(button);
            if (!product.category) {
                button.disabled = true;
                button.textContent = 'Примерка обуви скоро';
                button.title = 'Текущая модель поддерживает верхнюю одежду, брюки и цельные образы';
            }
            button.addEventListener('click', () => openModal(button));
        });
    }

    async function openModal(button) {
        if (!token()) {
            window.location.href = 'account.html';
            return;
        }
        const product = getProduct(button);
        const modal = createModal();
        modal.dataset.category = product.category || '';
        modal.dataset.fit = product.fit?.label || 'стандартный';
        modal.dataset.ease = product.fit?.ease || 6;
        modal.dataset.image = product.image || '';
        modal.dataset.product = product.name;
        modal.querySelector('.tryon-product').textContent = product.name;
        const select = modal.querySelector('.tryon-size');
        select.innerHTML = '';
        delete select.dataset.userChanged;
        product.sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            if (size === product.selected) option.selected = true;
            select.appendChild(option);
        });
        if (product.category) renderSizeChart(modal, product);
        modal.classList.add('open');

        if (!product.category) {
            modal.querySelector('.tryon-status').textContent = 'Для обуви визуальная примерка этой моделью не поддерживается.';
            modal.querySelector('.tryon-generate').disabled = true;
        } else {
            modal.querySelector('.tryon-generate').disabled = false;
        }

        try {
            const response = await fetch('https://silvervy-backend.onrender.com/api/auth/profile', { headers: { Authorization: `Bearer ${token()}` } });
            if (response.ok) {
                const data = await response.json();
                const measurements = data.user.bodyMeasurements || {};
                for (const [key, value] of Object.entries(measurements)) {
                    const input = modal.querySelector(`[name="${key}"]`);
                    if (input) input.value = value;
                }
                updateRecommendation(modal, product);
            }
        } catch {}
    }

    function updateRecommendation(modal, product) {
        const values = Object.fromEntries([...modal.querySelectorAll('.tryon-measurements input')].map(input => [input.name, input.value]));
        const required = ['heightCm', 'weightKg', 'chestCm', 'waistCm', 'hipCm'];
        const label = modal.querySelector('.tryon-recommendation');
        if (required.some(key => !Number(values[key]))) {
            label.textContent = 'Заполните параметры для подсказки по размеру';
            return;
        }
        const recommendation = chooseRecommendedSize(values, product.category || modal.dataset.category);
        const select = modal.querySelector('.tryon-size');
        const visibleSizes = [...select.options].map(option => option.value);
        modal.querySelector('.tryon-fit-note').textContent = `Ориентировочная сетка по типовым параметрам тела. Крой изделия: ${modal.dataset.fit}; расчётная прибавка для свободы около ${modal.dataset.ease} см. Это не замеры производителя и не гарантия посадки. ИИ-визуализация не меняет реальные размеры изделия.`;
        if (recommendation && visibleSizes.includes(recommendation)) {
            label.textContent = `Предварительная рекомендация: ${recommendation}`;
            if (!select.dataset.userChanged) select.value = recommendation;
        } else {
            label.textContent = 'Заполните параметры для подсказки по размеру';
        }
    }

    function renderSizeChart(modal, product) {
        const rows = chart[product.category] || [];
        const sizes = product.sizes.filter(size => rows.some(row => row.size === size));
        const measures = product.category === 'bottoms'
            ? [['Талия, см', 'waist'], ['Бёдра, см', 'hip'], ['Рост, см', 'height'], ['Вес, кг', 'weight']]
            : [['Грудь, см', 'chest'], ['Талия, см', 'waist'], ['Бёдра, см', 'hip'], ['Рост, см', 'height'], ['Вес, кг', 'weight']];
        const tableRows = measures.map(([label, key]) => `<tr><th>${label}</th>${sizes.map(size => {
            const range = rows.find(row => row.size === size)?.[key];
            return `<td>${range ? `${range[0]}–${range[1]}` : '—'}</td>`;
        }).join('')}</tr>`).join('');
        modal.querySelector('.tryon-chart-table').innerHTML = `<div class="tryon-chart-scroll"><table><thead><tr><th>Мерка</th>${sizes.map(size => `<th>${size}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></div><small>Типовые мерки фигуры. Фактические замеры изделия могут отличаться.</small>`;
    }

    async function compressImage(file) {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.86);
    }

    function readFormMeasurements(modal) {
        return Object.fromEntries([...modal.querySelectorAll('.tryon-measurements input')].map(input => [input.name, Number(input.value)]));
    }

    async function generate(modal) {
        const status = modal.querySelector('.tryon-status');
        const file = modal.querySelector('#tryonPhoto').files[0];
        const consent = modal.querySelector('.tryon-consent input').checked;
        const measurements = readFormMeasurements(modal);
        const size = modal.querySelector('.tryon-size').value;
        if (!file || !consent || !size || Object.values(measurements).some(value => !value)) {
            status.textContent = 'Загрузите фото, заполните параметры и подтвердите передачу изображения.';
            return;
        }

        const button = modal.querySelector('.tryon-generate');
        const result = modal.querySelector('.tryon-result');
        button.disabled = true;
        button.classList.add('generating');
        result.innerHTML = '';
        status.textContent = 'Подготавливаем образ… Фото передаётся модели на Hugging Face.';
        try {
            const personImage = await compressImage(file);
            const garmentImage = await imageToDataUrl(modal.dataset.image);
            const saveResponse = await fetch('https://silvervy-backend.onrender.com/api/auth/profile', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(measurements)
            });
            const saveData = await saveResponse.json().catch(() => ({}));
            if (!saveResponse.ok) throw new Error(saveData.message || 'Не удалось сохранить параметры профиля');

            const response = await fetch('https://silvervy-backend.onrender.com/api/try-on', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ personImage, garmentImage, category: modal.dataset.category, size })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Не удалось создать примерку');
            status.textContent = `Готово. Визуализация выбранного размера ${size} создана.`;
            result.innerHTML = `<img alt="Результат виртуальной примерки" src="${data.image}"><a class="tryon-download" download="silvervy-try-on.png" href="${data.image}">Скачать результат</a><small>Результат создан FASHN VTON 1.5. Выбранный размер показывается как ориентир: модель не получает реальные мерки изделия.</small>`;
        } catch (error) {
            status.textContent = error.message || 'Сервис примерки временно недоступен.';
        } finally {
            button.disabled = false;
            button.classList.remove('generating');
        }
    }

    function init() {
        addButtons();
        const modal = createModal();
        modal.querySelector('.tryon-generate').addEventListener('click', () => generate(modal));
        modal.querySelector('.tryon-size').addEventListener('change', event => {
            event.target.dataset.userChanged = 'true';
        });
        modal.querySelectorAll('.tryon-measurements input').forEach(input => {
            input.addEventListener('input', () => {
                updateRecommendation(modal, { category: modal.dataset.category });
            });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
