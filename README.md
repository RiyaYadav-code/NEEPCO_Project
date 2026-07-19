# NEEPCO Sourcing & Compliance Portal

A dynamic Full-Stack Enterprise Analytics Portal developed to track, monitor, and audit public procurement compliance metrics from MSME vendors, aligned with the statutory guidelines of the Ministry of Power, Government of India. 

Live Link: `[Insert your Render deployment link here]`

---

## 🛠️ Tech Stack & Architecture

*   **Frontend:** Vanilla JavaScript (ES6+), Tailwind CSS (Utility-first styling, persistent Dark/Light mode theme system), Chart.js (Dynamic data visualizations).
*   **Backend:** Node.js, Express.js (REST API Endpoints).
*   **Database:** SQLite (Production-ready relational storage managed with transactional connection pools).
*   **Hosting & Deployment:** Render Cloud Infrastructure.

---

## 🚀 Key Features

*   **Real-Time Data Polling Loop:** Integrated a 5-second asynchronous polling loop in JavaScript to automatically synchronize database states across multiple devices (e.g., mobile updates rendering instantly on desktop screens) without webpage refreshes.
*   **Optimistic UI Layering:** Implemented an optimized frontend transaction handler that pushes newly created work orders into the analytical state immediately, ensuring zero-latency user interaction while matching background server states quietly.
*   **Policy Analytics Engines:** Built integrated KPI dashboards monitoring the **25% MSE Sourcing Mandate**, **GeM Procurement Mandate Ratio**, and automated alert systems tracking the **MSME 45-day statutory payment penalty rules**.
*   **Data Filtration Suite:** Advanced data classification algorithms enabling live searching, categorical filtering (Fiscal Year, Sourcing Channel, MSE Registration status), and automated CSV report compilation/exportation.

---

## 📊 Database Architecture (SQLite Schema)

The architecture is built upon a relational configuration establishing clear referential integrity between primary entities:

### 1. Vendors Structure (`vendors`)
Tracks metadata regarding industrial engineering partnerships:
*   `vendor_id` (INTEGER, Primary Key, Auto-increment)
*   `vendor_name` (TEXT, Unique, Not Null)
*   `is_mse` (TEXT, Not Null) — *Flags regulatory classification ('Yes' / 'No')*

### 2. Procurements Ledger (`procurements`)
Maintains operational record-keeping of transactional work orders:
*   `order_id` (INTEGER, Primary Key, Auto-increment)
*   `vendor_id` (INTEGER, Foreign Key referencing `vendors`)
*   `purchase_source` (TEXT, Not Null) — *Channel routing (e.g., GeM, Open Tender)*
*   `item_description` (TEXT, Not Null)
*   `order_amount` (REAL, Not Null)
*   `order_date` (TEXT, Not Null)
*   `payment_status` (TEXT, Default 'Pending')
*   `delay_days` (INTEGER, Default 0)
*   `fiscal_year` (TEXT, Not Null)

---

## 📂 Installation & Local Setup

### Prerequisites
*   Node.js (v18.x or higher)
*   npm (Node Package Manager)

### Step-by-Step Execution
1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/](https://github.com/)[Your-Username]/NEEPCO_Project.git
   cd NEEPCO_Project
