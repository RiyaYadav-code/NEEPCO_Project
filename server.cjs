/**
 * ⚡ NEEPCO Portal Backend Integration Service (Production SQLite Version)
 * Zero-configuration local & cloud relational database.
 * Uses persistent disk storage on Render so data is NEVER deleted.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000; // Render uses port 10000 dynamically

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// ==========================================
// 🗄️ SQLITE PERSISTENT STORAGE PATH
// ==========================================
// Render disk storage configuration or fallback to local directory
const dataDir = process.env.DISK_PATH || __dirname;
const dbPath = path.join(dataDir, 'neepco_portal.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database storage link failed:', err.message);
    } else {
        console.log(`⚡ SQLite Engine active at: ${dbPath}`);
        initializeDatabase();
    }
});

// Promise wrappers for async/await compliance
const dbRun = (query, params = []) => new Promise((res, rej) => db.run(query, params, function(err) { if(err) rej(err); else res(this); }));
const dbAll = (query, params = []) => new Promise((res, rej) => db.all(query, params, (err, rows) => { if(err) rej(err); else res(rows); }));
const dbGet = (query, params = []) => new Promise((res, rej) => db.get(query, params, (err, row) => { if(err) rej(err); else res(row); }));

// Database initialization & automated seeding
// Database initialization & automated seeding with YOUR specific dataset
async function initializeDatabase() {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS vendors (
            vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_name TEXT NOT NULL UNIQUE,
            is_mse TEXT NOT NULL
        );`);

        await dbRun(`CREATE TABLE IF NOT EXISTS procurements (
            order_id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_id INTEGER NOT NULL,
            purchase_source TEXT NOT NULL,
            item_description TEXT NOT NULL,
            order_amount REAL NOT NULL,
            order_date TEXT NOT NULL,
            payment_status TEXT DEFAULT 'Pending',
            delay_days INTEGER DEFAULT 0,
            fiscal_year TEXT NOT NULL,
            FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
        );`);

        // 1. Core Vendors Setup
        const vendorCheck = await dbGet('SELECT COUNT(*) as count FROM vendors');
        if (vendorCheck.count === 0) {
            const seedVendors = [
                ['Bharat Heavy Electricals Ltd (BHEL)', 'No'],
                ['GE Power India Limited', 'No'],
                ['Assam Carbon Products Ltd', 'Yes'],
                ['Brookland Contractors Shillong', 'Yes'],
                ['Eastern Electricals Shillong', 'Yes']
            ];
            for (const vendor of seedVendors) {
                await dbRun('INSERT INTO vendors (vendor_name, is_mse) VALUES (?, ?)', vendor);
            }
            console.log('🎉 Primary Vendors synchronized.');
        }

        // 2. Your Exact Dynamic Dataset Injection
        const orderCheck = await dbGet('SELECT COUNT(*) as count FROM procurements');
        if (orderCheck.count === 0) {
            const yourDataset = [
                [1, 'GeM portal', 'Turbine Maintenance Spares', 4500000, '2026-04-12', 'Paid', 0, '2026'],
                [2, 'GeM portal', 'High-Voltage Switchgear Units', 8500000, '2026-05-20', 'Pending', 15, '2026'],
                [3, 'Open Tender', 'Hydro-generator Stator Coils', 12000000, '2025-11-05', 'Paid', 0, '2025'],
                [4, 'GeM portal', 'Control Room Optical Cabling', 1800000, '2026-02-10', 'Pending', 45, '2026'],
                [5, 'Limited Tender', 'Substation Transformer Oil', 3200000, '2026-06-01', 'Pending', 5, '2026']
            ];
            for (const order of yourDataset) {
                await dbRun(`INSERT INTO procurements 
                    (vendor_id, purchase_source, item_description, order_amount, order_date, payment_status, delay_days, fiscal_year) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, order);
            }
            console.log('📊 Your official dataset synced successfully!');
        }
        
        console.log('✅ All application structures synced successfully.');
    } catch (err) {
        console.error('❌ Initialization error:', err.message);
    }
}

// ==========================================
// 🔌 HTTP REST API ROUTE DEFINITIONS
// ==========================================
app.get('/api/procurements', async (req, res) => {
    try {
        const records = await dbAll(`
            SELECT p.order_id as id, v.vendor_name as vendor, v.is_mse, 
                   p.purchase_source as channel, p.item_description as item, 
                   p.order_amount as amount, p.order_date as date, 
                   p.payment_status as status, p.fiscal_year as year, p.delay_days
            FROM procurements p
            JOIN vendors v ON p.vendor_id = v.vendor_id
            ORDER BY p.order_id DESC
        `);
        res.status(200).json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/procurements', async (req, res) => {
    const { vendorName, channel, date, description, amount } = req.body;
    try {
        const vendorRow = await dbGet('SELECT vendor_id FROM vendors WHERE vendor_name = ?', [vendorName]);
        if (!vendorRow) return res.status(404).json({ error: 'Vendor missing' });

        const fiscalYear = date.split('-')[0];
        const delayDays = Math.floor(Math.random() * 50) + 1;

        const result = await dbRun(
            `INSERT INTO procurements (vendor_id, purchase_source, item_description, order_amount, order_date, fiscal_year, delay_days) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [vendorRow.vendor_id, channel, description, amount, date, fiscalYear, delayDays]
        );
        res.status(201).json({ success: true, orderId: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/procurements/pay/:id', async (req, res) => {
    try {
        await dbRun('UPDATE procurements SET payment_status = "Paid" WHERE order_id = ?', [req.params.id]);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`⚡ Service engine live on port ${PORT}`);
});
