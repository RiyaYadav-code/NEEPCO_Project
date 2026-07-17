/**
 * ⚡ NEEPCO Portal Backend - Smart Hybrid MySQL Version
 * Connects to your new MySQL Workbench user locally, and switches to Cloud DB on Render.
 */

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// ==========================================
// 🗄️ SMART SQL CONNECTION POOL (LOCAL + CLOUD)
// ==========================================
// Agar Render par deployment hoga toh JAWSDB_URL ya CLEARDB_DATABASE_URL milega, nahi toh local chalega
const pool = mysql.createPool(process.env.CLEARDB_DATABASE_URL || process.env.JAWSDB_URL || {
    host: '127.0.0.1',
    port: 3306,
    user: 'neepco_user',          // Aapka naya Workbench user
    password: 'student_2026',      // Aapka naya aasan password
    database: 'neepco_portal_db',  // Target local database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

// Auto Table Creation Scripts (Exact structure matched)
async function initializeDatabase() {
    try {
        console.log('🔄 Syncing MySQL relational structures...');

        // 1. Create target database if locally testing
        if (!process.env.CLEARDB_DATABASE_URL && !process.env.JAWSDB_URL) {
            const connection = mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'neepco_user', password: 'student_2026' });
            connection.query('CREATE DATABASE IF NOT EXISTS neepco_portal_db;');
            connection.end();
        }

        await db.execute(`
            CREATE TABLE IF NOT EXISTS vendors (
                vendor_id INT AUTO_INCREMENT PRIMARY KEY,
                vendor_name VARCHAR(255) NOT NULL UNIQUE,
                is_mse VARCHAR(10) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS procurements (
                order_id INT AUTO_INCREMENT PRIMARY KEY,
                vendor_id INT NOT NULL,
                purchase_source VARCHAR(50) NOT NULL,
                item_description TEXT NOT NULL,
                order_amount DECIMAL(15,2) NOT NULL,
                order_date VARCHAR(20) NOT NULL,
                payment_status VARCHAR(20) DEFAULT 'Pending',
                delay_days INT DEFAULT 0,
                fiscal_year VARCHAR(10) NOT NULL,
                FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        const [vendorCheck] = await db.execute('SELECT COUNT(*) as count FROM vendors');
        if (vendorCheck[0].count === 0) {
            const seedVendorsQuery = `
                INSERT INTO vendors (vendor_name, is_mse) VALUES
                ('Bharat Heavy Electricals Ltd (BHEL)', 'No'),
                ('GE Power India Limited', 'No'),
                ('Assam Carbon Products Ltd', 'Yes'),
                ('Brookland Contractors Shillong', 'Yes'),
                ('Eastern Electricals Shillong', 'Yes')
            `;
            await db.execute(seedVendorsQuery);
            console.log('🎉 Seed data injected into target tables!');
        }

        console.log('✅ Active MySQL engine synced successfully.');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}
initializeDatabase();

// --- Express REST API Routes (GET, POST, PUT) ---
app.get('/api/procurements', async (req, res) => {
    try {
        const query = `
            SELECT p.order_id as id, v.vendor_name as vendor, v.is_mse, 
                   p.purchase_source as channel, p.item_description as item, 
                   p.order_amount as amount, p.order_date as date, 
                   p.payment_status as status, p.fiscal_year as year, p.delay_days
            FROM procurements p
            JOIN vendors v ON p.vendor_id = v.vendor_id
            ORDER BY p.order_id DESC
        `;
        const [records] = await db.execute(query);
        res.status(200).json(records);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch database ledger', details: err.message });
    }
});

app.post('/api/procurements', async (req, res) => {
    const { vendorName, channel, date, description, amount } = req.body;
    if (!vendorName || !channel || !date || !description || !amount) {
        return res.status(400).json({ error: 'Payload validation failed' });
    }
    try {
        const [vendorRows] = await db.execute('SELECT vendor_id FROM vendors WHERE vendor_name = ?', [vendorName]);
        if (vendorRows.length === 0) return res.status(404).json({ error: 'Vendor reference missing' });

        const vendorId = vendorRows[0].vendor_id;
        const fiscalYear = date.split('-')[0];
        const delayDays = Math.floor(Math.random() * 50) + 1;

        const insertQuery = `
            INSERT INTO procurements (vendor_id, purchase_source, item_description, order_amount, order_date, payment_status, delay_days, fiscal_year)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)
        `;
        const [result] = await db.execute(insertQuery, [vendorId, channel, description, amount, date, delayDays, fiscalYear]);
        res.status(201).json({ success: true, message: 'Logged to MySQL Server!', orderId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Transaction routing failed', details: err.message });
    }
});

app.put('/api/procurements/pay/:id', async (req, res) => {
    const orderId = req.params.id;
    try {
        await db.execute('UPDATE procurements SET payment_status = "Paid" WHERE order_id = ?', [orderId]);
        res.status(200).json({ success: true, message: `Disbursement fixed for invoice #${orderId}` });
    } catch (err) {
        res.status(500).json({ error: 'Relational update crash', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`⚡ Service engine live on port ${PORT}`);
});