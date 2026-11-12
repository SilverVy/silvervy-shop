(() => {
  'use strict';
  const catalog = window.SilverVyCatalog;
  const fit = window.SilverVyFit;
  const byId = id => document.getElementById(id);
  if (!catalog || !fit || !byId('bodyForm')) return;
  const apiReady = window.SilverVyApiReady ||= import('./api-client.js').then(() => window.SilverVyApi);
  const apiRequest = (...args) => apiReady.then(client => client.request(...args));
  apiReady.then(client => {
    const methodology = byId('methodologyDownload');
    if (methodology) methodology.href = client.url('/fit-methodology.md');
  }).catch(() => {});

  const form = byId('bodyForm');
  const productSelect = byId('productSelect');
  const sizePicker = byId('sizePicker');
  const compare = byId('comparison');
  const recommendation = byId('recommendation');
  const warnings = byId('warnings');
  const schematicCanvas = byId('schematicCanvas');
  const schematicCopy = byId('schematicCopy');
  const products = catalog.products;
  const params = new URLSearchParams(location.search);
  let product = catalog.getProduct(params.get('product')) || products[0];
  let selectedSize = params.get('size') || 'M';
  let latestFit = null;
  let requestVersion = 0;
  let serviceStatus = null;
  const storedKey = 'silvervy-fitting-body-v1';
  const bodyKeys = ['chestCm', 'waistCm', 'hipCm', 'heightCm', 'inseamCm'];
  const labels = { chestCm: 'Обхват груди', waistCm: 'Обхват талии', hipCm: 'Обхват бёдер', shoulderCm: 'Ширина плеч', lengthCm: 'Длина изделия', sleeveCm: 'Длина рукава', thighCm: 'Обхват бедра', inseamCm: 'Внутренний шов' };
  const dimensionKeys = ['chestCm', 'waistCm', 'hipCm', 'shoulderCm', 'lengthCm', 'sleeveCm', 'thighCm', 'inseamCm'];
  const statusText = { tight: 'Отрицательная прибавка', close: 'Ниже целевого диапазона', intended: 'В целевом диапазоне', loose: 'Выше целевого диапазона', unknown: 'Нет сравнения' };

  function readStored() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(storedKey) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
  }
  function bodyValues() {
    return Object.fromEntries(bodyKeys.map(key => [key, form.elements[key].value]));
  }
  function saveBody() {
    try { sessionStorage.setItem(storedKey, JSON.stringify(bodyValues())); } catch { /* session storage may be unavailable */ }
  }
  function renderProductOptions() {
    productSelect.innerHTML = products.map(item => `<option value="${item.id}">${item.name} · ${item.category === 'tops' ? 'верх' : 'низ'}</option>`).join('');
    productSelect.value = product.id;
    const chestLabel = form.querySelector('[data-field="chestCm"] span');
    if (chestLabel) chestLabel.innerHTML = product.category === 'tops'
      ? 'Обхват груди, см <b>*</b>'
      : 'Обхват груди, см <em>необязательно для низа</em>';
    renderPhotoAvailability();
  }
  function renderSizePicker() {
    if (!product.sizes.some(row => row.size === selectedSize)) selectedSize = 'M';
    sizePicker.innerHTML = product.sizes.map(row => `<button type="button" data-size="${row.size}" aria-pressed="${row.size === selectedSize}">${row.size}</button>`).join('');
  }
  function renderErrors(errors = {}) {
    bodyKeys.forEach(key => {
      const input = form.elements[key];
      const error = byId(`error-${key}`);
      const message = errors[key] || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      error.textContent = message;
    });
  }
  function evaluateNow() {
    const preference = form.elements.preference.value;
    latestFit = fit.evaluate(product, bodyValues(), preference);
    renderErrors(latestFit.errors);
    renderRecommendation(latestFit);
    renderWarnings(latestFit.warnings || []);
    renderComparison(latestFit);
    renderSchematic(latestFit);
    requestVersion += 1;
    return latestFit;
  }
  function renderRecommendation(result) {
    if (result.status === 'invalid') {
      recommendation.innerHTML = '<strong>Нужны корректные мерки</strong><p>Проверьте обязательные поля и диапазоны, указанные под ними.</p>';
    } else if (result.status === 'unavailable') {
      recommendation.innerHTML = '<strong>Сравнение недоступно</strong><p>Для этого изделия нет учебных размерных данных.</p>';
    } else if (!result.recommendedSize) {
      recommendation.innerHTML = '<strong>Совместимый размер не найден</strong><p>По условиям движка ни один размер не прошёл порог совместимости. Посмотрите отдельные отрицательные и положительные прибавки в таблице.</p>';
    } else {
      const row = result.rows.find(item => item.size === result.recommendedSize);
      const notAllTarget = row?.checks.some(check => check.status !== 'intended');
      recommendation.innerHTML = `<strong>Ближайший совместимый размер: ${result.recommendedSize}</strong><p>Это выбор по правилам движка, а не гарантия идеальной посадки.${notAllTarget ? ' Некоторые проверки вне целевого диапазона — смотрите строки ниже.' : ''}</p>`;
    }
  }
  function renderWarnings(items) {
    warnings.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
  function renderComparison(result) {
    if (result.status !== 'ready') {
      compare.innerHTML = '<p class="sv-note">После ввода обязательных мерок здесь появятся все размеры изделия, разницы окружностей и результаты проверок.</p>';
      return;
    }
    const dataRows = [];
    dimensionKeys.forEach(key => {
      if (product.sizes.some(row => Number.isFinite(row[key]))) {
        dataRows.push(`<tr><th>${labels[key] || key}, см</th>${result.rows.map(row => `<td>${Number.isFinite(row.garment[key]) ? row.garment[key].toFixed(1) : '—'}</td>`).join('')}</tr>`);
      }
      const checkRow = result.rows[0]?.checks.find(check => check.key === key);
      if (checkRow) {
        const bodyValue = checkRow.bodyCm;
        dataRows.push(`<tr class="ease-row"><th>Тело: ${labels[key] || key}, см</th>${result.rows.map(row => {
          const check = row.checks.find(item => item.key === key);
          return `<td>${check?.bodyCm?.toFixed(1) ?? bodyValue?.toFixed(1) ?? '—'}</td>`;
        }).join('')}</tr>`);
        dataRows.push(`<tr><th>Прибавка: ${labels[key] || key}, см</th>${result.rows.map(row => {
          const check = row.checks.find(item => item.key === key);
          if (!check || check.easeCm === null) return '<td>—</td>';
          return `<td><strong>${check.easeCm > 0 ? '+' : ''}${check.easeCm.toFixed(1)}</strong><br><span class="status-tag ${check.status}">${statusText[check.status]}</span><br><small>цель ${check.target[0]}–${check.target[1]}</small></td>`;
        }).join('')}</tr>`);
      }
    });
    if (product.category === 'bottoms') {
      dataRows.push(`<tr><th>Разница внутреннего шва, см</th>${result.rows.map(row => `<td>${row.inseamDifferenceCm === null ? 'не оценивается' : `${row.inseamDifferenceCm > 0 ? '+' : ''}${row.inseamDifferenceCm.toFixed(1)}`}</td>`).join('')}</tr>`);
    }
    const sizes = result.rows.map(row => `<th>${row.size}${row.size === result.recommendedSize ? '<br><small>ближайший*</small>' : ''}</th>`).join('');
    const fitRows = result.rows.map(row => `<td>${row.compatible ? 'Совместим' : 'Не прошёл порог'}</td>`).join('');
    compare.innerHTML = `<table><thead><tr><th>Параметр</th>${sizes}</tr></thead><tbody>${dataRows.join('')}<tr class="selected"><th>Результат движка</th>${fitRows}</tr></tbody></table><p class="sv-note">* Ближайший размер среди прошедших порог совместимости. Значение прибавки = мерка изделия − мерка тела; отрицательное число означает меньшее изделие в окружности. Статусы отображают каждый критерий отдельно.</p>`;
  }
  function renderSchematic(result) {
    const garment = product.sizes.find(row => row.size === selectedSize);
    if (!garment) return;
    const body = bodyValues();
    const sourceWidth = product.category === 'tops' ? garment.chestCm : garment.hipCm;
    const unit = 1.7; // Common diagram scale; girths are unfolded into half-circumferences.
    const width = sourceWidth / 2 * unit;
    const lengthCm = garment.lengthCm;
    const length = lengthCm * unit;
    const left = (300 - width) / 2;
    const right = 300 - left;
    const top = 45;
    const hem = top + length;
    const title = product.category === 'tops' ? 'Развёртка мерок верха' : 'Развёртка мерок брюк';
    const waistHalf = (garment.waistCm || sourceWidth) / 2 * unit;
    const crotch = top + (garment.lengthCm - (garment.inseamCm || 0)) * unit;
    const garmentSvg = product.category === 'tops'
      ? `<path d="M${left + 18},${top} L${left},${top + 12} L${left - 24},${top + 70} L${left - 9},${top + 78} L${left},${top + 48} L${left},${hem} L${right},${hem} L${right},${top + 48} L${right + 9},${top + 78} L${right + 24},${top + 70} L${right},${top + 12} L${right - 18},${top} Q150,${top + 14} ${left + 18},${top} Z"/>`
      : `<path d="M${150 - waistHalf / 2},${top} L${150 + waistHalf / 2},${top} L${right},${crotch} L${right - 4},${hem} L${154},${hem} L150,${crotch} L146,${hem} L${left + 4},${hem} L${left},${crotch} Z"/>`;
    const bodyGirth = Number(body[product.category === 'tops' ? 'chestCm' : 'hipCm']);
    const bodyHalf = result.status === 'ready' ? bodyGirth / 2 * unit : null;
    const bodyMarker = bodyHalf
      ? `<line x1="${150 - bodyHalf / 2}" y1="${top + 32}" x2="${150 + bodyHalf / 2}" y2="${top + 32}" stroke="#373e35" stroke-width="4"/><text x="150" y="${top + 26}" text-anchor="middle" font-size="10">тело: полуобхват ${bodyGirth / 2} см</text>` : '';
    schematicCanvas.innerHTML = `<svg viewBox="0 0 300 320" role="img" aria-label="${title}, размер ${selectedSize}; полуобхват ${sourceWidth / 2} сантиметров, длина ${lengthCm} сантиметров">
      <title>${title}, размер ${selectedSize}</title><line x1="150" y1="12" x2="150" y2="304" stroke="#b9b8ac" stroke-dasharray="3 5"/>
       <circle cx="150" cy="21" r="12" fill="none" stroke="#7d8175" stroke-width="1.5"/>
      <g fill="${product.tone}" fill-opacity=".72" stroke="#4f5548" stroke-width="2">${garmentSvg}</g>
       ${bodyMarker}
      <line x1="${left}" y1="${hem + 11}" x2="${right}" y2="${hem + 11}" stroke="#a66e53" stroke-width="1.5"/>
       <text x="150" y="${hem + 27}" text-anchor="middle" fill="#62665c" font-size="10">изделие: полуобхват ${sourceWidth / 2} см</text>
    </svg>`;
    const matching = result.status === 'ready' ? result.rows.find(row => row.size === selectedSize) : null;
    schematicCopy.innerHTML = `<strong>${title} · ${selectedSize}</strong><br>${labels[product.category === 'tops' ? 'chestCm' : 'hipCm']}: ${sourceWidth} см<br>Длина изделия: ${lengthCm} см${product.category === 'bottoms' ? `<br>Внутренний шов: ${garment.inseamCm} см` : ''}<br>Полуобхват = обхват / 2; это не видимая ширина тела и не лекало.${matching ? `<br>Порог совместимости: ${matching.compatible ? 'пройден' : 'не пройден'}.` : ''}<span class="schematic-caption">Плоская схема мерок · не 3D</span>`;
  }

  renderProductOptions();
  const persisted = readStored();
  bodyKeys.forEach(key => { if (persisted[key] !== undefined) form.elements[key].value = persisted[key]; });
  renderSizePicker();
  evaluateNow();

  form.addEventListener('input', event => {
    if (event.target.matches('input[type="number"]')) saveBody();
    byId('photoResult').replaceChildren();
    byId('photoStatus').textContent = '';
    evaluateNow();
  });
  form.addEventListener('change', event => {
    if (event.target.name === 'preference') evaluateNow();
  });
  productSelect.addEventListener('change', () => {
    product = catalog.getProduct(productSelect.value) || products[0];
    renderProductOptions();
    renderSizePicker();
    evaluateNow();
    byId('photoResult').replaceChildren();
    byId('photoStatus').textContent = '';
  });
  sizePicker.addEventListener('click', event => {
    const button = event.target.closest('[data-size]');
    if (!button) return;
    selectedSize = button.dataset.size;
    renderSizePicker();
    evaluateNow();
    byId('photoResult').replaceChildren();
    byId('photoStatus').textContent = '';
  });
  const burger = document.querySelector('.burger-icon');
  const links = document.querySelector('.nav-links');
  burger?.addEventListener('click', () => links?.classList.toggle('active'));
  document.addEventListener('click', event => { if (!event.target.closest('.burger-menu')) links?.classList.remove('active'); });

  async function loadServiceStatus() {
    const authHint = byId('photoAuthHint');
    try {
      const response = await apiRequest('/api/status', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('status unavailable');
      serviceStatus = await response.json();
    } catch {
      serviceStatus = { mode: 'catalog-only', tryOnAvailable: false };
    }
    renderPhotoAvailability();
    authHint.innerHTML = localStorage.getItem('token') ? '' : 'Для запроса фото-превью потребуется авторизация. <a href="account.html">Войти или создать аккаунт</a>. Размерный расчёт остаётся открытым.';
  }
  function renderPhotoAvailability() {
    const panel = byId('photoAvailability');
    if (!panel) return;
    if (product.category === 'bottoms') {
      panel.textContent = 'Фото-генерация для брюк не поддерживается. Сравнение мерок и плоская схема остаются доступны.';
    } else if (!serviceStatus) {
      panel.textContent = 'Проверяем доступность отдельного сервиса фото-превью…';
    } else if (serviceStatus.mode === 'catalog-only' || !serviceStatus.tryOnAvailable) {
      panel.textContent = serviceStatus.message || 'Генерация фото-превью сейчас недоступна. Лаборатория мерок и схема продолжают работать.';
    } else {
      panel.textContent = serviceStatus.message || 'Сервис фото-превью доступен для верхней одежды.';
    }
  }
  loadServiceStatus();

  function compressPhoto(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return Promise.reject(new Error('Выберите JPEG, PNG или WebP.'));
    }
    if (file.size > 12 * 1024 * 1024) return Promise.reject(new Error('Исходное фото должно быть не больше 12 МБ.'));
    return createImageBitmap(file).then(bitmap => {
      if (bitmap.width < 512 || bitmap.height < 768 || bitmap.height <= bitmap.width) {
        bitmap.close();
        throw new Error('Нужно вертикальное фото анфас в полный рост не меньше 512 × 768 пикселей.');
      }
      const max = 1200;
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f3f1e9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', .84);
    });
  }
  const photoInput = byId('personPhoto');
  photoInput.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    byId('fileName').textContent = file ? `${file.name} · ${Math.round(file.size / 1024)} КБ` : 'Файл не выбран';
    requestVersion += 1;
    byId('photoResult').replaceChildren();
    byId('photoStatus').textContent = '';
  });
  byId('photoConsent').addEventListener('change', () => {
    requestVersion += 1;
    byId('photoResult').replaceChildren();
  });
  byId('generatePhoto').addEventListener('click', async () => {
    const status = byId('photoStatus');
    const resultArea = byId('photoResult');
    const currentFit = evaluateNow();
    const versionAtStart = requestVersion;
    const token = localStorage.getItem('token');
    const file = photoInput.files?.[0];
    if (product.category !== 'tops') {
      status.textContent = 'Фото-генерация поддерживает только верхнюю одежду. Для брюк доступны сравнение мерок и плоская схема.';
      return;
    }
    if (!serviceStatus || !serviceStatus.tryOnAvailable || serviceStatus.mode !== 'full') {
      status.textContent = serviceStatus?.message || 'Сервис генерации недоступен; продолжайте сравнение размеров без фото.';
      return;
    }
    if (!token) {
      status.innerHTML = 'Для генерации войдите в аккаунт. <a href="account.html">Перейти ко входу</a>. Мерки можно сравнивать без входа.';
      return;
    }
    if (!file || !byId('photoConsent').checked) {
      status.textContent = 'Выберите изображение и подтвердите отдельное согласие на отправку.';
      return;
    }
    if (currentFit.status !== 'ready' || !currentFit.rows.some(row => row.size === selectedSize)) {
      status.textContent = 'Сначала заполните обязательные мерки корректными значениями.';
      return;
    }
    const button = byId('generatePhoto');
    button.disabled = true;
    resultArea.replaceChildren();
    status.textContent = 'Подготавливаем уменьшенную копию изображения…';
    try {
      const personImage = await compressPhoto(file);
      if (versionAtStart !== requestVersion) { status.textContent = 'Параметры изменились. Повторите запрос для актуального выбора.'; return; }
      const measurements = Object.fromEntries(bodyKeys.map(key => {
        const value = bodyValues()[key];
        return [key, value === '' ? null : Number(value)];
      }));
      const response = await apiRequest('/api/try-on', {
        method: 'POST',
        signal: AbortSignal.timeout(300000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personImage, productId: product.id, size: selectedSize, measurements, preference: form.elements.preference.value })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || (response.status === 401 ? 'Авторизуйтесь, чтобы создать фото-превью.' : 'Не удалось создать фото-превью.'));
      if (versionAtStart !== requestVersion) {
        status.textContent = 'Параметры изменились во время обработки. Устаревший результат скрыт.';
        return;
      }
      if (typeof data.image !== 'string' || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)) {
        throw new Error('Сервис не вернул корректное изображение. Сравнение мерок остаётся доступным.');
      }
      const image = document.createElement('img');
      image.src = data.image;
      image.alt = `Иллюстративное фото-превью изделия ${product.name}, размер ${selectedSize}`;
      const notice = document.createElement('p');
      notice.className = 'sv-note';
      const serverFit = data.fit?.recommendedSize ? ` Серверная проверка: ${data.fit.recommendedSize} — выбран ${selectedSize}.` : '';
      notice.textContent = `${data.provider || 'Сервис генерации'} · sizeConditioning: ${data.sizeConditioning || 'не указано'}. ${data.fitNotice || 'Иллюстративное изображение, не подтверждение реальной посадки.'}${serverFit}`;
      resultArea.append(image, notice);
      status.textContent = 'Фото-превью готово. Оно не заменяет проверку мерок и не подтверждает точную посадку.';
    } catch (error) {
      if (versionAtStart === requestVersion) status.textContent = error.name === 'TimeoutError'
        ? 'Время ожидания фото-превью истекло. Сравнение мерок остаётся доступным.'
        : error.message || 'Сервис фото-превью временно недоступен.';
    } finally {
      button.disabled = false;
    }
  });
})();
