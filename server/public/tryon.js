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
  const storedKey = 'silvervy-fitting-body-v2';
  const editedKeys = new Set();
  let profileRequest = 0;
  let photoRevision = 0;
  const bodyKeys = window.SilverVyMeasurements.keys;
  const labels = { chestCm: 'Обхват груди', waistCm: 'Обхват талии', hipCm: 'Обхват бёдер', shoulderCm: 'Ширина плеч', lengthCm: 'Длина изделия', sleeveCm: 'Длина рукава', thighCm: 'Обхват бедра', inseamCm: 'Внутренний шов' };
  const dimensionKeys = ['chestCm', 'waistCm', 'hipCm', 'shoulderCm', 'lengthCm', 'sleeveCm', 'thighCm', 'inseamCm'];
  const statusText = { tight: 'Отрицательная прибавка', close: 'Ниже целевого диапазона', intended: 'В целевом диапазоне', loose: 'Выше целевого диапазона', unknown: 'Нет сравнения' };
  const calibration = window.SilverVyPhotoCalibration(byId('photoCalibration'), {
    getContext: () => ({ product, garment: product.sizes.find(row => row.size === selectedSize), body: bodyValues() }),
    onChange: () => { requestVersion += 1; clearPhoto(); }
  });
  function owner() {
    try { return String(JSON.parse(localStorage.getItem('user'))?.id || 'guest'); } catch { return 'guest'; }
  }
  let currentOwner = owner();
  function clearPhoto() {
    byId('photoResult').replaceChildren();
    byId('photoStatus').textContent = '';
  }

  function readStored() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(storedKey) || '{}');
      if (!parsed || parsed.owner !== owner()) return {};
      (parsed.editedKeys || []).filter(key => bodyKeys.includes(key)).forEach(key => editedKeys.add(key));
      return parsed.values || {};
    } catch { return {}; }
  }
  function bodyValues() {
    return Object.fromEntries(bodyKeys.map(key => [key, form.elements[key].value]));
  }
  function saveBody() {
    try { sessionStorage.setItem(storedKey, JSON.stringify({ owner: owner(), values: bodyValues(), editedKeys: [...editedKeys] })); } catch { /* session storage may be unavailable */ }
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
    calibration.refresh();
    const values = bodyValues();
    byId('photoRequestMeta').textContent = `${product.name} · выбран ${selectedSize}. В генерацию пойдут текущие мерки лаборатории: грудь ${values.chestCm || '—'}, талия ${values.waistCm || '—'}, бёдра ${values.hipCm || '—'}, рост ${values.heightCm || '—'}, плечи ${values.shoulderCm || '—'}, рука ${values.armLengthCm || '—'}, кисть ${values.handLengthCm || '—'} см. При отсутствии мерок руки применяется приближённая оценка по фото. Предпочтение прибавки влияет на рекомендацию по окружностям; оценка рукава показана отдельно.`;
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
    if (product.category === 'tops') {
      const number = value => value == null ? 'не оценивается' : value.toFixed(1);
      dataRows.push(`<tr><th>Спуск плеча, см · условная оценка</th>${result.rows.map(row => `<td>${number(row.sleeve.shoulderDropCm)}</td>`).join('')}</tr>`);
      dataRows.push(`<tr><th>Манжета относительно запястья, см<br><small>+ за запястьем; − выше него</small></th>${result.rows.map(row => `<td>${number(row.sleeve.cuffOffsetCm)}</td>`).join('')}</tr>`);
      dataRows.push(`<tr><th>Положение рукава · расчёт</th>${result.rows.map(row => `<td>${row.sleeve.label}</td>`).join('')}</tr>`);
    }
    const sizes = result.rows.map(row => `<th>${row.size}${row.size === result.recommendedSize ? '<br><small>ближайший*</small>' : ''}</th>`).join('');
    const fitRows = result.rows.map(row => `<td>${row.compatible ? 'Совместим' : 'Не прошёл порог'}</td>`).join('');
    compare.innerHTML = `<table><thead><tr><th>Параметр</th>${sizes}</tr></thead><tbody>${dataRows.join('')}<tr class="selected"><th>Результат движка</th>${fitRows}</tr></tbody></table><p class="sv-note">* Ближайший размер среди прошедших порог совместимости. Значение прибавки = мерка изделия − мерка тела; отрицательное число означает меньшее изделие в окружности. Статусы отображают каждый критерий отдельно.</p>`;
  }
  function renderSchematic(result) {
    const rendered = window.SilverVySchematic.render({ product, size: selectedSize, result, body: bodyValues() });
    schematicCanvas.innerHTML = rendered.svg;
    const sleeve = result.rows?.find(row => row.size === selectedSize)?.sleeve;
    schematicCopy.innerHTML = rendered.copy + (sleeve ? `<section class="sv-sleeve-summary"><h3>Манжета выбранного размера · расчёт</h3><p>${sleeve.label}.</p>${sleeve.status === 'estimated' ? `<p>Спуск плеча: ${sleeve.shoulderDropCm.toFixed(1)} см; манжета относительно запястья: ${sleeve.cuffOffsetCm > 0 ? '+' : ''}${sleeve.cuffOffsetCm.toFixed(1)} см.</p><p class="sv-note">${sleeve.assumption} Это не измерение сгенерированного фото. Рекомендация размера по окружностям не гарантирует подходящую длину рукава.</p>` : '<p class="sv-note">Старые профили поддерживаются: новые мерки необязательны. На фото ориентир можно приближённо рассчитать по проверенным точкам и росту.</p>'}</section>` : '');
  }

  renderProductOptions();
  const persisted = readStored();
  bodyKeys.forEach(key => { if (persisted[key] !== undefined) form.elements[key].value = persisted[key]; });
  renderSizePicker();
  evaluateNow();

  form.addEventListener('input', event => {
    if (event.target.matches('input[type="number"]')) { editedKeys.add(event.target.name); saveBody(); }
    byId('photoResult').replaceChildren();
    byId('photoStatus').textContent = '';
    evaluateNow();
  });
  form.addEventListener('change', event => {
    if (event.target.name === 'preference') { clearPhoto(); evaluateNow(); }
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

  async function loadProfile(force = false) {
    const source = byId('profileSource');
    const token = localStorage.getItem('token');
    if (!token) { source.textContent = 'Гостевой режим: используйте поля лаборатории или войдите, чтобы загрузить профиль.'; return; }
    const version = ++profileRequest;
    source.textContent = 'Загружаем сохранённые мерки профиля…';
    try {
      const response = await apiRequest('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (version !== profileRequest || localStorage.getItem('token') !== token) return;
      if (!response.ok) { source.textContent = data.message || 'Не удалось загрузить профиль. Введённые мерки сохранены в этой вкладке.'; return; }
      const before = JSON.stringify(bodyValues());
      const profile = data.user?.bodyMeasurements || {};
      if (force) editedKeys.clear();
      const current = force ? Object.fromEntries(bodyKeys.map(key => [key, ''])) : bodyValues();
      const merged = window.SilverVyMeasurements.mergeProfile(current, profile, editedKeys);
      bodyKeys.forEach(key => { form.elements[key].value = merged[key] ?? ''; });
      source.textContent = Object.keys(profile).length
        ? `Мерки профиля загружены. ${editedKeys.size ? 'Ваши изменения в лаборатории оставлены без перезаписи.' : 'Для примерки можно изменить любые поля ниже.'}`
        : 'В профиле пока нет сохранённых мерок. Заполните поля лаборатории.';
      saveBody();
      if (before !== JSON.stringify(bodyValues())) { clearPhoto(); evaluateNow(); }
    } catch { if (version === profileRequest) source.textContent = 'Профиль недоступен. Используйте текущие мерки лаборатории; они не потеряны.'; }
  }
  byId('importProfile').addEventListener('click', () => loadProfile(true));
  window.addEventListener('focus', () => loadProfile());
  window.addEventListener('storage', event => {
    if (!['user', 'token', 'silvervy-profile-revision'].includes(event.key)) return;
    if (owner() !== currentOwner) {
      currentOwner = owner(); editedKeys.clear();
      bodyKeys.forEach(key => { form.elements[key].value = ''; });
      calibration.clear(); photoInput.value = ''; photoRevision += 1;
      clearPhoto(); evaluateNow();
    }
    loadProfile();
  });
  window.addEventListener('silvervy:session-expired', event => {
    byId('profileSource').textContent = event.detail.message;
    byId('photoAuthHint').innerHTML = 'Сессия сайта завершена. <a href="account.html">Войти заново</a>. Текущие мерки в лаборатории не удалены.';
  });
  loadProfile();

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
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    const revision = ++photoRevision;
    calibration.clear();
    byId('photoConsent').checked = false;
    byId('fileName').textContent = file ? `${file.name} · ${Math.round(file.size / 1024)} КБ` : 'Файл не выбран';
    requestVersion += 1;
    byId('photoResult').replaceChildren();
    byId('photoStatus').textContent = '';
    if (file) {
      try {
        const data = await compressPhoto(file);
        if (revision !== photoRevision) return;
        await calibration.load(data);
      } catch (error) { if (revision === photoRevision) byId('photoStatus').textContent = error.message; }
    }
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
      if (!calibration.image) throw new Error('Дождитесь подготовки фото или выберите корректный файл.');
      const calibrationPayload = calibration.payload();
      const personImage = calibration.image;
      if (versionAtStart !== requestVersion) { status.textContent = 'Параметры изменились. Повторите запрос для актуального выбора.'; return; }
      const measurements = Object.fromEntries(bodyKeys.map(key => {
        const value = bodyValues()[key];
        return [key, value === '' ? null : Number(value)];
      }));
      const response = await apiRequest('/api/try-on', {
        method: 'POST',
        signal: AbortSignal.timeout(300000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personImage, productId: product.id, size: selectedSize, measurements,
          preference: form.elements.preference.value, calibration: calibrationPayload })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) byId('photoAuthHint').innerHTML = 'Нужен повторный вход на сайт. <a href="account.html">Войти заново</a>. Это не замена HF_TOKEN.';
        throw new Error(`${data.message || 'Не удалось создать фото-превью.'}${data.requestId ? ` Код запроса: ${data.requestId}` : ''}`);
      }
      if (versionAtStart !== requestVersion) {
        status.textContent = 'Параметры изменились во время обработки. Устаревший результат скрыт.';
        return;
      }
      if (typeof data.image !== 'string' || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)) {
        throw new Error('Сервис не вернул корректное изображение. Сравнение мерок остаётся доступным.');
      }
      const image = document.createElement('img');
      image.src = data.image;
      image.alt = `Экспериментальная иллюстрация изделия ${product.name}, размер ${selectedSize}; посадка не подтверждена`;
      const notice = document.createElement('p');
      notice.className = 'sv-note';
      const serverFit = data.fit?.recommendedSize ? ` Серверная проверка: ${data.fit.recommendedSize} — выбран ${selectedSize}.` : '';
      notice.textContent = `${data.provider || 'Сервис генерации'} · ${data.sizeConditioning || 'метод не указан'}. ${data.fitNotice || 'Экспериментальная иллюстрация, не физическая симуляция.'} Проверьте манжеты, кисти, остатки исходной одежды, цвет и силуэт вручную.${serverFit}${data.geometry?.warnings ? ' ' + data.geometry.warnings.join(' ') : ''}${data.requestId ? ` Код запроса: ${data.requestId}` : ''}`;
      resultArea.append(image, notice);
      status.textContent = 'Модель вернула изображение. Проверьте манжеты, кисти, остатки одежды, цвет и силуэт: посадка не подтверждена.';
    } catch (error) {
      if (versionAtStart === requestVersion) status.textContent = error.name === 'TimeoutError'
        ? 'Время ожидания фото-превью истекло. Сравнение мерок остаётся доступным.'
        : error.message || 'Сервис фото-превью временно недоступен.';
    } finally {
      button.disabled = false;
    }
  });
})();
