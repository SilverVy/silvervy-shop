(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SilverVySchematic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const METRICS = {
    chestCm: { label: 'Грудь', body: 'chestCm', bodyLabel: 'Обхват тела', type: 'girth' },
    waistCm: { label: 'Талия', body: 'waistCm', bodyLabel: 'Обхват тела', type: 'girth' },
    hipCm: { label: 'Бёдра', body: 'hipCm', bodyLabel: 'Обхват тела', type: 'girth' },
    shoulderCm: { label: 'Ширина плеч', body: 'shoulderCm', bodyLabel: 'Ширина тела', type: 'linear' },
    lengthCm: { label: 'Длина изделия', body: null, type: 'linear' },
    sleeveCm: { label: 'Длина рукава', body: 'armLengthCm', bodyLabel: 'Длина руки', type: 'linear' },
    thighCm: { label: 'Бедро', body: 'thighCm', bodyLabel: 'Обхват тела', type: 'girth' },
    inseamCm: { label: 'Внутренний шов', body: 'inseamCm', bodyLabel: 'Мерка тела', type: 'linear' }
  };
  const ORDER = {
    tops: ['chestCm', 'waistCm', 'hipCm', 'shoulderCm', 'lengthCm', 'sleeveCm'],
    bottoms: ['waistCm', 'hipCm', 'thighCm', 'inseamCm', 'lengthCm']
  };
  const LIMITS = {
    chestCm: [60, 180], waistCm: [45, 170], hipCm: [65, 190],
    shoulderCm: [28, 70], armLengthCm: [35, 90], inseamCm: [45, 110],
    thighCm: [20, 100]
  };
  const STATUS = {
    tight: 'Отрицательная прибавка',
    close: 'Ниже целевого диапазона',
    intended: 'В целевом диапазоне',
    loose: 'Выше целевого диапазона',
    unknown: 'Нет сравнения'
  };

  const finite = value => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
  const fmt = value => Number(value).toFixed(1).replace('.', ',');
  const signed = value => `${Number(value) > 0 ? '+' : ''}${fmt(value)}`;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const isBodyValue = (body, key, errors) => {
    if (!key || !finite(body && body[key]) || errors && errors[key]) return false;
    const value = Number(body[key]);
    const range = LIMITS[key];
    return !range || (value >= range[0] && value <= range[1]);
  };
  const display = value => finite(value) ? `${fmt(value)} см` : '—';
  const safeTone = tone => /^#[0-9a-f]{6}$/i.test(String(tone || '')) ? tone : '#b5a28d';

  function makeGeometry(product, garment) {
    const top = product.category === 'tops';
    const length = finite(garment.lengthCm) ? Number(garment.lengthCm) : 0;
    if (top) {
      const chest = finite(garment.chestCm) ? Number(garment.chestCm) / 2 : 0;
      const waist = finite(garment.waistCm) ? Number(garment.waistCm) / 2 : chest;
      const hip = finite(garment.hipCm) ? Number(garment.hipCm) / 2 : chest;
      const shoulder = finite(garment.shoulderCm) ? Number(garment.shoulderCm) : chest;
      const sleeve = finite(garment.sleeveCm) ? Number(garment.sleeveCm) : 0;
      const chestX = chest / 2;
      const waistX = waist / 2;
      const hipX = hip / 2;
      const sleeveX = shoulder / 2 + sleeve * 0.44;
      const sleeveY = Math.sqrt(Math.max(0, sleeve * sleeve - Math.pow(sleeve * 0.44, 2)));
      const zoneY = { chestCm: length * 0.27, waistCm: length * 0.49, hipCm: length * 0.72 };
      const maxX = Math.max(chestX, waistX, hipX, shoulder / 2, sleeveX);
      const height = Math.max(length, sleeveY) + 7;
      const sx = value => Number.isFinite(value) ? value : 0;
      const outline = [
        `M ${-sx(shoulder) / 2} 0`,
        `L ${-chestX} ${zoneY.chestCm}`,
        `L ${-waistX} ${zoneY.waistCm}`,
        `L ${-hipX} ${zoneY.hipCm}`,
        `L ${-hipX} ${length}`,
        `L ${hipX} ${length}`,
        `L ${hipX} ${zoneY.hipCm}`,
        `L ${waistX} ${zoneY.waistCm}`,
        `L ${chestX} ${zoneY.chestCm}`,
        `L ${shoulder / 2} 0`,
        `Q 0 8 ${-shoulder / 2} 0 Z`
      ].join(' ');
      const arms = [-1, 1].map(side => {
        const cuffX = side * sleeveX;
        const cuffY = sleeveY;
        const shoulderX = side * shoulder / 2;
        const underarmX = side * chestX;
        const innerCuffX = cuffX - side * 10;
        return `<path class="svs-sleeve-outline" fill="${safeTone(product.tone)}" d="M ${shoulderX} 0 L ${cuffX} ${cuffY} L ${innerCuffX} ${cuffY} L ${underarmX} ${zoneY.chestCm} Z"/>`;
      }).join('');
      return {
        kind: 'tops', length, maxX, height, outline, arms, shoulder,
        sleeve, sleeveY, sleeveX, chest, waist, hip, chestX, waistX, hipX, zoneY,
        measures: [
          { key: 'chestCm', number: '1', label: 'Грудь', value: chest, y: zoneY.chestCm },
          { key: 'waistCm', number: '2', label: 'Талия', value: waist, y: zoneY.waistCm },
          { key: 'hipCm', number: '3', label: 'Бёдра', value: hip, y: zoneY.hipCm },
          { key: 'shoulderCm', number: '4', label: 'Плечи', value: shoulder, y: 0 },
          { key: 'sleeveCm', number: '5', label: 'Рукав', value: sleeve, y: sleeveY / 2, diagonal: true },
          { key: 'lengthCm', number: '6', label: 'Длина', value: length, vertical: true }
        ]
      };
    }

    const waist = finite(garment.waistCm) ? Number(garment.waistCm) / 2 : 0;
    const hip = finite(garment.hipCm) ? Number(garment.hipCm) / 2 : waist;
    const thighFlat = finite(garment.thighCm) ? Number(garment.thighCm) / 2 : hip / 2;
    const inseam = finite(garment.inseamCm) ? Number(garment.inseamCm) : 0;
    const waistX = waist / 2;
    const hipX = hip / 2;
    const legInner = 3;
    const legOuter = thighFlat + legInner;
    const hipY = length * 0.2;
    const crotchY = Math.max(hipY + 8, length - inseam);
    const thighY = crotchY + 4;
    const maxX = Math.max(waistX, hipX, legOuter);
    const outline = [
      `M ${-waistX} 0 L ${waistX} 0`,
      `L ${hipX} ${hipY} L ${legOuter} ${crotchY}`,
      `L ${legOuter} ${length} L ${legInner} ${length} L 0 ${crotchY}`,
      `L ${-legInner} ${length} L ${-legOuter} ${length} L ${-legOuter} ${crotchY}`,
      `L ${-hipX} ${hipY} Z`
    ].join(' ');
    return {
      kind: 'bottoms', length, maxX, height: length, outline, arms: '',
      waist, hip, thighFlat, inseam, waistX, hipX, legOuter, legInner, hipY, crotchY, thighY,
      measures: [
        { key: 'waistCm', number: '1', label: 'Талия', value: waist, y: 0 },
        { key: 'hipCm', number: '2', label: 'Бёдра', value: hip, y: hipY },
        { key: 'thighCm', number: '3', label: 'Бедро', value: thighFlat, y: thighY, thigh: true },
        { key: 'inseamCm', number: '4', label: 'Внутренний шов', value: inseam, y: (crotchY + length) / 2, vertical: true, inseam: true },
        { key: 'lengthCm', number: '5', label: 'Длина', value: length, vertical: true }
      ]
    };
  }

  function marker(x1, y1, x2, y2, label, vertical = false) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const ticks = vertical
      ? `<path d="M${x1 - 4} ${y1}h8 M${x2 - 4} ${y2}h8"/>`
      : `<path d="M${x1} ${y1 - 4}v8 M${x2} ${y2 - 4}v8"/>`;
    return `<g class="svs-dimension"><path d="M${x1} ${y1}L${x2} ${y2}"/>${ticks}<circle cx="${cx}" cy="${cy}" r="8"/><text x="${cx}" y="${cy + 3}">${esc(label)}</text></g>`;
  }

  function sceneSvg({ geometry, product, garment, size, compact }) {
    const width = compact ? 360 : 900;
    const height = compact ? 470 : 550;
    const pad = compact ? { x: 20, y: 87, w: 280, h: 345 } : { x: 80, y: 92, w: 740, h: 385 };
    // Keep the same scale across XS–XL, rather than auto-enlarging every small size.
    const allSizes = product.sizes.map(row => makeGeometry(product, row));
    const extentW = Math.max(...allSizes.map(item => item.maxX * 2), 1);
    const extentH = Math.max(...allSizes.map(item => item.height), 1);
    const scale = Math.min(pad.w / extentW, pad.h / extentH);
    const cx = width / 2;
    const top = pad.y + Math.max(0, (pad.h - extentH * scale) / 2);
    const x = n => cx + n * scale;
    const y = n => top + n * scale;
    const color = esc(safeTone(product.tone));
    const bodyWidth = key => {
      const value = Number(garment[key]);
      return Number.isFinite(value) ? value / 2 : 0;
    };
    const dimensionMarkup = geometry.measures.map(item => {
      if (!Number.isFinite(item.value) || item.value <= 0) return '';
      if (item.vertical && item.inseam) return marker(x(0) + 12, y(geometry.crotchY), x(0) + 12, y(geometry.length), item.number, true);
      if (item.vertical) {
        const shift = geometry.kind === 'tops' ? -geometry.maxX * scale - 18 : -geometry.maxX * scale - 16;
        return marker(cx + shift, y(0), cx + shift, y(geometry.length), item.number, true);
      }
      if (item.diagonal) {
        const side = 1;
        const x1 = cx + geometry.shoulder / 2 * scale;
        const x2 = cx + geometry.sleeveX * scale;
        const y1 = top;
        const y2 = y(geometry.sleeveY);
        return marker(x1, y1, x2, y2, item.number);
      }
      let x1; let x2;
      if (item.thigh) {
        x1 = x(geometry.legInner); x2 = x(geometry.legOuter);
      } else if (item.key === 'shoulderCm') {
        x1 = cx - geometry.shoulder / 2 * scale;
        x2 = cx + geometry.shoulder / 2 * scale;
      } else {
        const flat = item.key === 'chestCm' ? bodyWidth('chestCm')
          : item.key === 'waistCm' ? bodyWidth('waistCm')
            : item.key === 'hipCm' ? bodyWidth('hipCm') : 0;
        x1 = cx - flat / 2 * scale;
        x2 = cx + flat / 2 * scale;
      }
      return marker(x1, y(item.y), x2, y(item.y), item.number);
    }).join('');
    const lengthTick = geometry.kind === 'tops'
      ? `<path class="svs-contour-detail" d="M${cx - geometry.shoulder / 2 * scale} ${top + 3}Q${cx} ${top + 11} ${cx + geometry.shoulder / 2 * scale} ${top + 3}"/>`
      : `<path class="svs-contour-detail" d="M${cx} ${y(3)}V${y(geometry.crotchY)}"/>`;
    const description = geometry.kind === 'tops'
      ? 'Условный контур верха с плечами и рукавами; номера показывают линии мерок.'
      : 'Условный контур брюк с двумя штанинами; номера показывают линии мерок.';
    return `<svg class="sv-schematic-svg ${compact ? 'svs-mobile' : 'svs-desktop'}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(description)} Размер ${esc(size)}.">
      <title>${esc(description)} Размер ${esc(size)}.</title>
      <text x="${compact ? 16 : 26}" y="28" class="svs-eyebrow">КОНТУР МЕРОК · ${geometry.kind === 'tops' ? 'ВЕРХ' : 'НИЗ'}</text>
      <text x="${compact ? 16 : 26}" y="56" class="svs-heading">${esc(product.name || '')}</text>
      <text x="${compact ? 344 : 874}" y="56" text-anchor="end" class="svs-size">${esc(size)}</text>
      <g transform="translate(${cx} ${top}) scale(${scale})">
        <path class="svs-garment" d="${geometry.outline}" fill="${color}"/>
        ${geometry.arms}
      </g>
      <g class="svs-overlays">
        ${lengthTick}
        ${dimensionMarkup}
      </g>
      <text x="${compact ? 16 : 26}" y="${height - 12}" class="svs-foot">Линии зон пронумерованы; точные значения — в карточках ниже.</text>
    </svg>`;
  }

  function render({ product, size, result, body } = {}) {
    const category = product && product.category === 'bottoms' ? 'bottoms' : 'tops';
    const heading = category === 'tops' ? 'Верхняя одежда' : 'Брюки';
    const garment = product && Array.isArray(product.sizes)
      ? product.sizes.find(row => row.size === size) : null;
    const errors = result && result.errors || {};
    const bodyValues = body && typeof body === 'object' ? body : {};
    const fitRow = result && Array.isArray(result.rows)
      ? result.rows.find(row => row.size === size) : null;
    const checks = fitRow && Array.isArray(fitRow.checks) ? fitRow.checks : [];
    const keys = ORDER[category].filter(key => garment && finite(garment[key]));
    const sizeText = esc(size || '—');

    if (!product || !garment) {
      return {
        svg: '<div class="sv-schematic-empty">Контур недоступен: для выбранного размера нет данных изделия.</div>',
        copy: '<p class="sv-schematic-empty">Мерки тела не используются вместо размерных данных изделия.</p>'
      };
    }

    const geometry = makeGeometry(product, garment);
    const svg = `${sceneSvg({ geometry, product, garment, size: sizeText, compact: false })}${sceneSvg({ geometry, product, garment, size: sizeText, compact: true })}`;
    const cards = keys.map(key => {
      const meta = METRICS[key];
      const zone = geometry.measures.find(item => item.key === key);
      const index = zone ? zone.number : '–';
      const check = checks.find(item => item.key === key);
      const assessed = !!(check && finite(check.easeCm));
      const bodyAvailable = isBodyValue(bodyValues, meta.body, errors);
      const bodyText = bodyAvailable ? display(bodyValues[meta.body]) : 'не указана';
      const garmentText = display(garment[key]);
      const isGirth = meta.type === 'girth';
      const half = isGirth ? `${fmt(Number(garment[key]) / 2)} см` : null;
      const comparison = assessed
        ? `<span class="sv-schematic-ease">Прибавка ${signed(check.easeCm)} см</span><span class="sv-schematic-status sv-schematic-status--${esc(check.status)}">${esc(STATUS[check.status] || 'Проверено')}</span>${Array.isArray(check.target) ? `<span class="sv-schematic-target">Цель ${fmt(check.target[0])}–${fmt(check.target[1])} см</span>` : ''}`
        : '<span class="sv-schematic-unassessed">Движок не оценивает эту зону</span>';
      const bodyLine = meta.body
        ? `<span class="sv-schematic-body">${esc(meta.bodyLabel)}: ${esc(bodyText)}</span>`
        : '<span class="sv-schematic-body">Сопоставимой мерки тела нет</span>';
      return `<li class="sv-schematic-card">
        <span class="sv-schematic-index">${esc(index)}</span>
        <div class="sv-schematic-card-main">
          <strong>${esc(meta.label)}</strong>
          <span class="sv-schematic-garment">${isGirth ? `Окружность изделия ${garmentText} · в развёртке ${half}` : `Мерка изделия ${garmentText}`}</span>
          ${bodyLine}
          ${comparison}
        </div>
      </li>`;
    }).join('');
    const missingBody = keys.some(key => METRICS[key].body && !isBodyValue(bodyValues, METRICS[key].body, errors));
    const bodyNotice = missingBody
      ? '<p class="sv-schematic-body-note">Нет корректного значения для части мерок тела. Контур и размерные данные изделия показаны независимо от заполнения формы.</p>' : '';
    const compatibility = fitRow
      ? `<p class="sv-schematic-engine">Порог совместимости размера ${sizeText}: <strong>${fitRow.compatible ? 'пройден' : 'не пройден'}</strong>. Это результат правил движка, а не гарантия посадки.</p>`
      : '';
    const mapping = category === 'tops'
      ? '1 грудь · 2 талия · 3 бёдра · 4 ширина плеч · 5 длина рукава · 6 длина изделия'
      : '1 талия · 2 бёдра · 3 бедро · 4 внутренний шов · 5 длина изделия';
    const copy = `<section class="sv-schematic-info" aria-label="Мерки выбранного размера">
      <div class="sv-schematic-heading"><span class="sv-schematic-kicker">Выбранный размер</span><strong>${esc(heading)} · ${sizeText}</strong></div>
      <p class="sv-schematic-map">${mapping}</p>
      ${bodyNotice}
      <ul class="sv-schematic-metrics">${cards}</ul>
      <div class="sv-schematic-legend">
        <strong>Как читать схему</strong>
        <p>Для груди, талии, бёдер и бедра каталог задаёт окружность изделия. Полуобхват = окружность ÷ 2: это ширина условно разложенного изделия по линии зоны, а не видимая анатомическая ширина тела.</p>
        <p>Линии контура служат условной картой зон. Рисунок не моделирует посадку, ткань или движение и не является выкройкой. Масштаб общий для силуэта и размерных линий внутри каждой схемы; декоративные пропорции контура не задают дополнительные мерки.</p>
        <p>Прибавка = мерка изделия − мерка тела. «+» означает больше изделия, «−» — меньше. Статус и целевой диапазон появляются только там, где зону проверил движок. Плечи, длина рукава и длина изделия не считаются проверками прибавки.</p>
      </div>
      ${compatibility}
      <span class="schematic-caption">Схематическая карта мерок · не физическая симуляция · учебные данные</span>
    </section>`;
    return { svg, copy };
  }

  return { render };
});
