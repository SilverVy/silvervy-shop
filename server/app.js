// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const catalog = require('./public/catalog-data');
const { assessRequest } = require('./services/fit-service');
const catalogOnly = process.env.CATALOG_ONLY === '1';

const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? 'https://silvervy-frontend.onrender.com'
        : 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/fit-methodology.md', (req, res) => res.download(path.join(__dirname, '../docs/fit-methodology.md')));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
    res.json({
        mode: catalogOnly ? 'catalog-only' : 'full',
        tryOnAvailable: !catalogOnly,
        message: catalogOnly
            ? 'Учебный каталог и сравнение мерок работают. Для аккаунтов и генерации нужно подключить PostgreSQL и запустить полный сервер.'
            : 'Визуальная примерка требует входа и доступной очереди IDM-VTON; размерная рекомендация работает независимо.'
    });
});
app.get('/api/catalog', (req, res) => res.json({ products: catalog.products }));
app.post('/api/fit', (req, res) => {
    try {
        const assessment = assessRequest(req.body);
        res.json({ productId: assessment.product.id, size: assessment.size, ...assessment.fit });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message, errors: error.errors });
    }
});
if (catalogOnly) {
    app.use(['/api/auth', '/api/cart', '/api/orders', '/api/try-on'], (req, res) => {
        res.status(503).json({ message: 'В режиме учебного каталога база и аккаунты не подключены. Сравнение размеров доступно без входа.' });
    });
} else {
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/cart', require('./routes/cartRoutes'));
    app.use('/api/orders', require('./routes/orderRoutes'));
    app.use('/api/try-on', require('./routes/tryOnRoutes'));
}

// Обработка 404 для API (исправлено)
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});

// Все остальные запросы -> фронтенд
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : null
    });
});

async function start() {
    if (!catalogOnly) {
        const db = require('./config/db');
        await db.authenticate();
        await db.sync();
        await db.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "bodyMeasurements" JSONB');
    }
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => console.log(`Silver.Vy: ${catalogOnly ? 'catalog-only' : 'full'} mode on port ${PORT}`));
}
if (require.main === module) {
    start().catch(err => {
        console.error('Server startup failed:', err.message);
        process.exit(1);
    });
}

module.exports = app;
