(function (root) {
    'use strict';
    root.SilverVyPhotoCalibration = function (container, { getContext, onChange }) {
        const geometry = root.SilverVyGeometry;
        let image = null, source = '', points = structuredClone(geometry.defaults), selected = 'crown', dragging = false;
        let current = null, loadVersion = 0;
        const reviewed = new Set();
        container.innerHTML = `<h4>Калибровка фото по вашим меркам</h4>
          <p class="sv-note">Это не автоматическое распознавание. Начальные точки условные: переместите их на человека. Нужен полный рост, фронтальная поза, опущенные и немного отведённые руки со слегка согнутыми локтями, по возможности облегающая одежда. Плечевые точки отмечайте на теле, не на спущенных швах одежды; конец кисти — конец среднего пальца. Кисти, лицо и фон вне маски сохраняются из оригинала.</p>
          <div class="calibration-stage" tabindex="0" aria-label="Фото с опорными точками и областью перерисовки"></div>
          <div class="calibration-fields"><label>Опорная точка<select class="calibration-point">${Object.entries(geometry.labels).map(([key, label], i) => `<option value="${key}">${i + 1}. ${label}</option>`).join('')}</select></label>
          <label>X, % ширины<input class="calibration-x" type="number" min="0" max="100" step="0.1"></label>
          <label>Y, % высоты<input class="calibration-y" type="number" min="0" max="100" step="0.1"></label></div>
          <p class="sv-note">Выберите точку и нажмите на фото или перетащите маркер. Координаты можно вводить с клавиатуры. Коричневая область — вся зона перерисовки, включая удаление прежней одежды; светлый контур — ориентир выбранного размера, красные пунктиры — расчётные манжеты. Это не обещание точной формы результата.</p>
          <button class="calibration-review" type="button">Точка на месте — проверить следующую</button>
          <p class="calibration-review-status" role="status">Проверьте каждую точку отдельно. Шаблон не распознаёт человека.</p>
          <button class="calibration-reset" type="button">Сбросить точки</button>
          <p class="calibration-status" role="status"></p>
          <label class="photo-consent"><input class="calibration-confirm" type="checkbox"><span>Я проверил все ${Object.keys(geometry.defaults).length} точек: они соответствуют человеку на фото. Масштаб торса рассчитан по росту; для рук используются текущие мерки лаборатории, а при их отсутствии — приближённая оценка по фото.</span></label>`;
        const stage = container.querySelector('.calibration-stage');
        const selector = container.querySelector('select');
        const xInput = container.querySelector('.calibration-x');
        const yInput = container.querySelector('.calibration-y');
        const status = container.querySelector('.calibration-status');
        const confirm = container.querySelector('.calibration-confirm');
        function controls() {
            selector.value = selected;
            xInput.value = (points[selected].x * 100).toFixed(1);
            yInput.value = (points[selected].y * 100).toFixed(1);
            confirm.disabled = reviewed.size !== Object.keys(points).length;
            if (confirm.disabled) confirm.checked = false;
            container.querySelector('.calibration-review-status').textContent =
                `Проверено ${reviewed.size} из ${Object.keys(points).length}. ${confirm.disabled ? 'Исправьте положение выбранной точки или подтвердите, что она на месте.' : 'Теперь можно подтвердить калибровку.'}`;
        }
        function refresh() {
            if (!image) { container.hidden = true; return; }
            const context = getContext();
            container.hidden = context.product.category !== 'tops';
            let overlay = '', target = '', cuffs = '';
            current = null;
            try {
                current = geometry.build({ ...context, points, width: image.naturalWidth, height: image.naturalHeight });
                overlay = current.polygons.map(poly => `<polygon points="${poly.map(p=>p.join(',')).join(' ')}"/>`).join('');
                target = current.target.map(poly => `<polygon points="${poly.map(p=>p.join(',')).join(' ')}"/>`).join('');
                cuffs = current.target.slice(1).map(poly => {
                    const n = poly.length / 2, a = poly[n - 1], b = poly[n];
                    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
                }).join('');
                const sleeves = current.sleeves.map(item => `${item.side === 'Left' ? 'Слева' : 'Справа'}: спуск плеча ${item.shoulderDropCm.toFixed(1)} см; ${item.label.toLowerCase()}; ${Object.values(item.sources).includes('photo-estimate') ? 'часть мерок оценена по фото' : 'по меркам лаборатории'}`).join('. ');
                status.textContent = `Размер ${context.garment.size}: грудь изделия ${context.garment.chestCm} см, тело ${context.body.chestCm} см; длина ${context.garment.lengthCm} см; рукав ${context.garment.sleeveCm} см от плечевого шва. Расчёт манжет: ${sleeves}. ${current.warnings.join(' ')}`;
                status.className = 'calibration-status';
            } catch (error) {
                status.textContent = error.message;
                status.className = 'calibration-status field-error';
            }
            const radius = image.naturalWidth * .016;
            stage.innerHTML = `<svg viewBox="0 0 ${image.naturalWidth} ${image.naturalHeight}" role="img" aria-label="Фото, размерная маска, расчётные манжеты и ${Object.keys(points).length} перемещаемых точек">
              <image href="${source}" width="${image.naturalWidth}" height="${image.naturalHeight}"/>
              <g fill="#a76f48" fill-opacity=".3">${overlay}</g>
              <g fill="none" stroke="#ffe6ac" stroke-width="${Math.max(2, radius / 4)}">${target}</g>
              <g stroke="#963d2e" stroke-width="${Math.max(3, radius / 3)}" stroke-dasharray="6 4">${cuffs}</g>
              ${Object.entries(points).map(([key, point], i) => `<g data-point="${key}"><circle cx="${point.x * image.naturalWidth}" cy="${point.y * image.naturalHeight}" r="${radius * (selected === key ? 1.4 : 1)}" fill="${selected === key ? '#ffe6ac' : '#fff'}" stroke="#2f392e" stroke-width="2"/><text x="${point.x * image.naturalWidth}" y="${point.y * image.naturalHeight + radius * .35}" text-anchor="middle" fill="#263325" font-size="${radius * 1.25}" font-family="sans-serif">${i + 1}</text></g>`).join('')}
              </svg>`;
            controls();
        }
        function move(event) {
            const rect = stage.querySelector('svg').getBoundingClientRect();
            points[selected] = { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
                y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
            reviewed.add(selected); confirm.checked = false; refresh(); onChange();
        }
        stage.addEventListener('pointerdown', event => {
            if (!image) return;
            event.preventDefault();
            selected = event.target.closest('[data-point]')?.dataset.point || selector.value;
            dragging = true; stage.setPointerCapture(event.pointerId); move(event);
        });
        stage.addEventListener('pointermove', event => { if (dragging) move(event); });
        stage.addEventListener('pointerup', () => { dragging = false; });
        stage.addEventListener('pointercancel', () => { dragging = false; });
        selector.addEventListener('change', () => { selected = selector.value; refresh(); });
        [xInput, yInput].forEach(input => input.addEventListener('change', () => {
            if (xInput.value === '' || yInput.value === '') return;
            const x = Number(xInput.value) / 100, y = Number(yInput.value) / 100;
            if (![x, y].every(n => Number.isFinite(n) && n >= 0 && n <= 1)) return;
            points[selected] = { x, y }; reviewed.add(selected); confirm.checked = false; refresh(); onChange();
        }));
        confirm.addEventListener('change', onChange);
        container.querySelector('.calibration-review').addEventListener('click', () => {
            if (!image) return;
            reviewed.add(selected);
            selected = Object.keys(points).find(key => !reviewed.has(key)) || selected;
            confirm.checked = false; refresh(); onChange();
        });
        container.querySelector('.calibration-reset').addEventListener('click', () => {
            reviewed.clear(); selected = 'crown';
            points = structuredClone(geometry.defaults); confirm.checked = false; refresh(); onChange();
        });
        container.hidden = true;
        return {
            async load(dataUrl) {
                const version = ++loadVersion;
                const next = new Image();
                next.src = dataUrl;
                await next.decode();
                if (version !== loadVersion) return;
                image = next; source = dataUrl; points = structuredClone(geometry.defaults); reviewed.clear(); selected = 'crown'; confirm.checked = false;
                refresh();
            },
            refresh,
            clear() { loadVersion += 1; image = null; source = ''; current = null; reviewed.clear(); confirm.checked = false; stage.replaceChildren(); container.hidden = true; },
            get image() { return source; },
            payload() {
                refresh();
                if (!current) throw new Error(status.textContent || 'Загрузите и откалибруйте фото.');
                if (reviewed.size !== Object.keys(points).length || !confirm.checked) throw new Error('Проверьте каждую опорную точку отдельно и подтвердите калибровку фото.');
                return { points: structuredClone(points), confirmed: true };
            }
        };
    };
})(window);
