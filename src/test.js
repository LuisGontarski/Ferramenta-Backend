const pool = require('./db/db.js');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexão funcionando! Hora do banco:', res.rows[0].now);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao conectar no banco:', err);
    process.exit(1);
  }
})();
