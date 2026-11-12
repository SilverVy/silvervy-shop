(() => {
  'use strict';
  const catalog = window.SilverVyCatalog;
  if (!catalog) return;
  const money = value => `${Number(value).toLocaleString('ru-RU')} ₽`;
  const pageName = location.pathname.split('/').pop();

  const grid = document.querySelector('[data-apparel-grid]');
  if (grid) {
    const groups = [
      ['Верхний слой', ['coat', 'bomber', 'trench', 'denim']],
      ['Рубашки и брюки', ['shirt', 'linen', 'trousers', 'linen-trousers']]
    ];
    grid.innerHTML = groups.map(([title, ids]) => {
      const items = ids.map(id => catalog.products.find(product => product.id === id)).filter(Boolean);
      return `<section class="catalog-group" id="${ids[0] === 'coat' ? 'outerwear' : 'shirts'}"><div class="collection-intro sv-wrap"><div><span class="sv-kicker">Silver.Vy / study 2026</span><h3>${title}</h3></div><span class="sv-note">${String(items.length).padStart(2, '0')} предмета</span></div><div class="apparel-grid sv-wrap">${items.map((product, index) => `
        <article class="apparel-card" id="${product.id === 'denim' ? 'denim' : `item-${product.id}`}" style="animation-delay:${index * 45}ms">
          <a href="${product.page}" aria-label="Открыть: ${product.name}">
            <div class="apparel-image"><img src="${product.images.front}" alt="${product.name} — предметное AI-изображение учебной коллекции" loading="${index > 1 ? 'lazy' : 'eager'}"></div>
            <div class="apparel-meta"><span>${product.group === 'outerwear' ? 'Верхняя одежда' : product.group === 'bottoms' ? 'Брюки' : product.group === 'denim' ? 'Деним' : 'Рубашка'}</span><span>${product.color}</span></div>
            <h4>${product.name}</h4>
            <p class="apparel-price">${money(product.price)}</p>
          </a>
        </article>`).join('')}</div></section>`;
    }).join('');
  }

  const detailRoot = document.querySelector('[data-product-page]');
  if (detailRoot) {
    const product = catalog.getProduct(detailRoot.dataset.productPage || pageName);
    if (!product) return;
    const info = detailRoot.querySelector('.product-info');
    const gallery = detailRoot.querySelector('.product-gallery');
    const selectedFromUrl = new URLSearchParams(location.search).get('size');
    const initialSize = product.sizes.some(row => row.size === selectedFromUrl) ? selectedFromUrl : 'M';
    const labelMap = { chestCm: 'Грудь', waistCm: 'Талия', hipCm: 'Бёдра', shoulderCm: 'Плечи', lengthCm: 'Длина', sleeveCm: 'Рукав', thighCm: 'Бедро', inseamCm: 'Внутренний шов' };
    const measures = Object.keys(product.sizes[0]).filter(key => key !== 'size');
    gallery.innerHTML = `<div class="main-image"><img src="${product.images.front}" alt="${product.name}, предметное AI-изображение" id="mainImg"></div>
      <div class="thumbnails" aria-label="Изображения изделия">
       <button class="thumbnail active" type="button" aria-label="Предметное изображение"><img src="${product.images.front}" alt="" style="width:100%;height:100%;object-fit:cover"></button>
       <button class="thumbnail" type="button" aria-label="Изображение на модели"><img src="${product.images.model}" alt="" style="width:100%;height:100%;object-fit:cover"></button>
      </div>
      <p class="sv-note">Оба изображения созданы ИИ для учебной коллекции. Это не фотографии измеренного складского товара.</p>`;
    info.innerHTML = `<span class="sv-kicker">${product.category === 'tops' ? 'Верхняя одежда и рубашки' : 'Брюки'} / Учебная серия</span>
      <h2>${product.name}</h2><p class="price">${money(product.price)}</p>
      <p class="description">${product.description}</p>
      <p class="sv-note"><strong>Цвет:</strong> ${product.color} &nbsp;·&nbsp; <strong>Состав:</strong> ${product.composition}</p>
      <div class="size-selector" role="group" aria-label="Выберите размер"><span>Размер для изучения</span>${product.sizes.map(row => `<button class="size${row.size === initialSize ? ' active' : ''}" type="button" aria-pressed="${row.size === initialSize}" data-size="${row.size}">${row.size}</button>`).join('')}</div>
      <button class="buy-button" type="button">Добавить в корзину</button>
      <a class="fit-cta" href="fitting.html?product=${encodeURIComponent(product.id)}&size=${encodeURIComponent(initialSize)}">Сравнить мерки в лаборатории →</a>
      <div class="sv-disclaimer">${product.source.text}</div>
      <div class="detail-table-wrap"><h3>Размеры изделия · см</h3><table class="detail-table"><thead><tr><th>Мерка</th>${product.sizes.map(row => `<th>${row.size}</th>`).join('')}</tr></thead><tbody>${measures.map(key => `<tr><th>${labelMap[key] || key}</th>${product.sizes.map(row => `<td>${row[key]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="sv-note detail-source">Все размеры и составы — параметры учебного дизайна, не подтверждённые замеры реальных изделий.</p>`;

    const mainImage = gallery.querySelector('#mainImg');
    const thumbnails = [...gallery.querySelectorAll('.thumbnail')];
    thumbnails.forEach(button => button.addEventListener('click', () => {
      thumbnails.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const next = button.querySelector('img').src;
      mainImage.style.opacity = '0.45';
      window.setTimeout(() => { mainImage.src = next; mainImage.style.opacity = '1'; }, 120);
    }));
    const sizeButtons = [...info.querySelectorAll('.size')];
    const fitLink = info.querySelector('.fit-cta');
    sizeButtons.forEach(button => button.addEventListener('click', () => {
      sizeButtons.forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed', 'false'); });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      fitLink.href = `fitting.html?product=${encodeURIComponent(product.id)}&size=${encodeURIComponent(button.dataset.size)}`;
    }));
  }

  const burger = document.querySelector('.burger-icon');
  const links = document.querySelector('.nav-links');
  burger?.addEventListener('click', () => links?.classList.toggle('active'));
  document.addEventListener('click', event => {
    if (!event.target.closest('.burger-menu')) links?.classList.remove('active');
  });
})();
