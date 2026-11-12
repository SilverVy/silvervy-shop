'use strict';

const assert = require('node:assert/strict');
const catalog = require('../server/public/catalog-data.js');
const fit = require('../server/public/fit-engine.js');
const schematic = require('../server/public/fit-schematic.js');

const coat = catalog.getProduct('coat');
const body = { chestCm: 104, waistCm: 82, hipCm: 98 };
const coatResult = fit.evaluate(coat, body, 'intended');
const coatView = schematic.render({ product: coat, size: 'XL', result: coatResult, body });

assert.equal(typeof coatView.svg, 'string');
assert.equal(typeof coatView.copy, 'string');
assert.match(coatView.svg, /svs-garment/);
assert.match(coatView.svg, /svs-sleeve-outline/);
assert.match(coatView.svg, /Размер XL/);
assert.match(coatView.copy, /Окружность изделия 138,0 см · в развёртке 69,0 см/);
assert.match(coatView.copy, /Прибавка \+34,0 см/);
assert.match(coatView.copy, /не является выкройкой/);
assert.match(coatView.copy, /5 длина рукава · 6 длина изделия/);

const invalid = schematic.render({
  product: coat,
  size: 'XL',
  result: { status: 'invalid', errors: { chestCm: 'invalid' }, rows: [] },
  body: { chestCm: 'bad' }
});
assert.match(invalid.svg, /svs-garment/);
assert.match(invalid.copy, /Нет корректного значения/);
assert.match(invalid.copy, /Окружность изделия 138,0 см/);
assert.match(invalid.copy, /Обхват тела: не указана/);

const trousers = catalog.getProduct('trousers');
const trousersView = schematic.render({
  product: trousers,
  size: 'M',
  result: fit.evaluate(trousers, { waistCm: 84, hipCm: 100 }, 'intended'),
  body: { waistCm: 84, hipCm: 100 }
});
assert.match(trousersView.svg, /svs-garment/);
assert.match(trousersView.copy, /Окружность изделия 72,0 см · в развёртке 36,0 см/);
assert.match(trousersView.copy, /4 внутренний шов · 5 длина изделия/);
assert.match(trousersView.copy, /Полуобхват/);
const small = schematic.render({ product: coat, size: 'XS', result: coatResult, body });
assert.equal(small.svg.match(/scale\(([^)]+)\)/)[1], coatView.svg.match(/scale\(([^)]+)\)/)[1], 'sizes must use a common graphic scale');

console.log('fit-schematic: ok');
