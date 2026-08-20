const express = require('express');
const cors = require('cors');
const path = require('path');
const { execSync } = require('child_process');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/reception-orders', require('./routes/receptionOrders'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/families', require('./routes/families'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/charges', require('./routes/charges'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/works', require('./routes/works'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/prices', require('./routes/prices'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/history', require('./routes/history'));
app.use('/api/bilan', require('./routes/bilan'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/search', require('./routes/search'));

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

function freePort(port) {
  let killed = false;
  try {
    const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { shell: 'cmd.exe', encoding: 'utf8' });
    const pids = [...new Set(output.trim().split('\n').map(line => line.trim().split(/\s+/).pop()))];
    for (const pid of pids) {
      if (pid && pid !== '0') {
        try { execSync(`taskkill /F /PID ${pid}`, { shell: 'cmd.exe', stdio: 'ignore' }); } catch {}
      }
    }
    if (pids.length > 0) {
      console.log(`Port ${port} libere (${pids.length} processus tue(s)).`);
      killed = true;
    }
  } catch {
    // Port libre, rien a faire
  }
  return killed;
}

function startServer(attempt = 0) {
  if (attempt === 0) freePort(PORT);

  const server = app.listen(PORT, () => {
    console.log(`STN Platform server running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 3) {
      console.log(`Port ${PORT} encore occupe, nouvelle tentative dans 1s... (${attempt + 1}/3)`);
      setTimeout(() => {
        freePort(PORT);
        startServer(attempt + 1);
      }, 1000);
    } else {
      console.error(`Impossible de demarrer sur le port ${PORT}:`, err.message);
      process.exit(1);
    }
  });
}

startServer();

const { startBackupScheduler } = require('./backup');
startBackupScheduler();
