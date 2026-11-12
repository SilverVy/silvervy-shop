(function (root, factory) {
    const catalog = factory();
    if (typeof module === 'object' && module.exports) module.exports = catalog;
    else root.SilverVyCatalog = catalog;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const labels = ['XS', 'S', 'M', 'L', 'XL'];
    const grade = (base, increments) => labels.map((size, index) => {
        const row = { size };
        for (const [key, value] of Object.entries(base)) {
            row[key] = Math.round((value + (increments[key] || 0) * (index - 2)) * 10) / 10;
        }
        return row;
    });
    const upperGrade = { chestCm: 6, waistCm: 6, hipCm: 6, shoulderCm: 1.5, lengthCm: 1.5, sleeveCm: 0.7 };
    const definitions = [
        {
            id: 'coat', page: 'product-coat.html', name: 'Туман · пальто oversize', category: 'tops', group: 'outerwear',
            color: 'Тёплый серо-бежевый', tone: '#b5a28d', tryOnColor: 'warm muted taupe beige', price: 15900, garmentDescription: 'long wool coat',
            composition: '70% шерсть, 30% полиэстер; подкладка: 100% вискоза',
            description: 'Однобортное пальто со спущенным плечом, широким лацканом и двумя прорезными карманами. Свободный силуэт рассчитан на дополнительный слой одежды.',
            base: { chestCm: 126, waistCm: 122, hipCm: 130, shoulderCm: 56, lengthCm: 114, sleeveCm: 60 },
            increments: upperGrade, ease: { chestCm: [18, 28], waistCm: [22, 42], hipCm: [16, 32] }
        },
        {
            id: 'bomber', page: 'product-bomber.html', name: 'Мох · бомбер', category: 'tops', group: 'outerwear',
            color: 'Приглушённый оливковый', tone: '#7d8266', price: 11900, garmentDescription: 'bomber jacket',
            composition: '100% хлопок; подкладка: 100% хлопок',
            description: 'Объёмный хлопковый бомбер с отложным воротником, молнией и мягкой линией плеча. Низ и манжеты собраны без плотного прилегания.',
            base: { chestCm: 124, waistCm: 118, hipCm: 118, shoulderCm: 55, lengthCm: 69, sleeveCm: 61 },
            increments: upperGrade, ease: { chestCm: [16, 26], waistCm: [18, 38], hipCm: [10, 24] }
        },
        {
            id: 'trench', page: 'product-trench.html', name: 'Дюна · тренч', category: 'tops', group: 'outerwear',
            color: 'Песочный', tone: '#c6b38e', price: 17900, garmentDescription: 'trench coat',
            composition: '65% хлопок, 35% полиэстер; подкладка: 100% вискоза',
            description: 'Прямой двубортный тренч с поясом, широкими рукавами и регулируемыми патами. Свободный крой и длина ниже колена.',
            base: { chestCm: 128, waistCm: 126, hipCm: 134, shoulderCm: 57, lengthCm: 118, sleeveCm: 60 },
            increments: upperGrade, ease: { chestCm: [20, 32], waistCm: [24, 44], hipCm: [20, 36] }
        },
        {
            id: 'denim', page: 'product-jean_coat.html', name: 'Прибой · джинсовая куртка', category: 'tops', group: 'denim',
            color: 'Пыльный голубой', tone: '#8498a3', price: 9900, garmentDescription: 'denim jacket',
            composition: '100% хлопок',
            description: 'Свободная куртка из выцветшего денима с четырьмя накладными карманами. Удлинённое плечо, металлические пуговицы и прямой низ.',
            base: { chestCm: 122, waistCm: 118, hipCm: 120, shoulderCm: 55, lengthCm: 72, sleeveCm: 60 },
            increments: upperGrade, ease: { chestCm: [14, 24], waistCm: [16, 36], hipCm: [10, 24] }
        },
        {
            id: 'shirt', page: 'product-shirt.html', name: 'Мел · хлопковая рубашка', category: 'tops', group: 'shirts',
            color: 'Молочный', tone: '#e5dfd0', price: 6900, garmentDescription: 'shirt',
            composition: '100% хлопок',
            description: 'Удлинённая рубашка со спущенным плечом, широкими рукавами и одним нагрудным карманом. Мягкий воротник и скруглённый низ.',
            base: { chestCm: 120, waistCm: 116, hipCm: 122, shoulderCm: 53, lengthCm: 79, sleeveCm: 61 },
            increments: upperGrade, ease: { chestCm: [12, 24], waistCm: [16, 38], hipCm: [10, 26] }
        },
        {
            id: 'linen', page: 'product-linen_shirt.html', name: 'Лён · летняя рубашка', category: 'tops', group: 'shirts',
            color: 'Натуральный бежевый', tone: '#ccbba0', price: 5900, garmentDescription: 'linen shirt',
            composition: '70% лён, 30% хлопок',
            description: 'Свободная рубашка с коротким рукавом, открытым воротником и накладным карманом. Прямой силуэт для летних многослойных образов.',
            base: { chestCm: 122, waistCm: 118, hipCm: 122, shoulderCm: 54, lengthCm: 75, sleeveCm: 28 },
            increments: upperGrade, ease: { chestCm: [14, 26], waistCm: [18, 40], hipCm: [10, 26] }
        },
        {
            id: 'trousers', page: 'product-trousers.html', name: 'Земля · широкие брюки', category: 'bottoms', group: 'bottoms',
            color: 'Табачно-коричневый', tone: '#89735e', price: 8900, garmentDescription: 'wide leg trousers',
            composition: '60% хлопок, 40% лён',
            description: 'Широкие брюки с защипами и прямыми штанинами. Посадка на талии, пояс без эластичной вставки, карманы в боковых швах.',
            base: { waistCm: 86, hipCm: 116, thighCm: 72, inseamCm: 79, lengthCm: 108 },
            increments: { waistCm: 4, hipCm: 4, thighCm: 2, inseamCm: 1, lengthCm: 1.5 },
            ease: { waistCm: [0, 4], hipCm: [10, 22] }
        },
        {
            id: 'linen-trousers', page: 'product-linen_trousers.html', name: 'Песок · льняные брюки', category: 'bottoms', group: 'bottoms',
            color: 'Светлый каменный', tone: '#c9c1af', price: 7900, garmentDescription: 'linen trousers',
            composition: '100% лён',
            description: 'Льняные брюки свободного прямого кроя с защипами и застёжкой на пуговицу. Удлинённые штанины, ровный пояс и мягкие складки.',
            base: { waistCm: 86, hipCm: 118, thighCm: 74, inseamCm: 80, lengthCm: 109 },
            increments: { waistCm: 4, hipCm: 4, thighCm: 2, inseamCm: 1, lengthCm: 1.5 },
            ease: { waistCm: [0, 4], hipCm: [12, 24] }
        }
    ];
    const products = definitions.map(({ base, increments, ...product }) => ({
        ...product,
        demo: true,
        images: {
            front: `media/collection/${product.id}-front.jpg`,
            model: `media/collection/${product.id}-model.jpg`
        },
        sizes: grade(base, increments),
        source: {
            type: 'educational-design',
            text: 'Учебная коллекция Silver.Vy: изображения созданы ИИ; составы, цены, мерки и прибавки заданы для демонстрации, а не измерены на реальных изделиях.'
        }
    }));
    return {
        products,
        getProduct: id => products.find(product => product.id === id || product.page === id) || null,
        measurementLabels: {
            chestCm: 'Обхват груди', waistCm: 'Обхват талии', hipCm: 'Обхват бёдер',
            shoulderCm: 'Ширина плеч', lengthCm: 'Длина изделия', sleeveCm: 'Длина рукава',
            thighCm: 'Обхват бедра', inseamCm: 'Внутренний шов'
        }
    };
});
