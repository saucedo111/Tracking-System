## Full-Stack Shipment Tracker

A simple app to track shipments.

### Prerequisites

* Node.js v14+
* npm or yarn
* Oracle Instant Client v19+
* Access to an Oracle DB

### Setup

1. Copy `.env.example` to `.env` and update values:

   ```env
   ORACLE_USER="scott"
   ORACLE_PASS="tiger123"
   PORT="5000"
   ORACLE_DIR="/opt/instantclient_19_8"
   ORACLE_HOST="localhost"
   ORACLE_PORT="50000"
   ORACLE_DBNAME="orclpdb1"
   ```
2. Install dependencies:

   ```bash
   npm install
   # or yarn install
   ```
3. (Optional) Run additional setup scripts if needed:

   ```bash
   db-tunnel.sh
   instantcilent-setup.sh
   ```

### Start

```bash
local-start.sh
# or npm start
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

Happy tracking! 🚚
