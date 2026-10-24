// Registro estructurado básico sin tokens, contraseñas ni cuerpos de petición.
const logger = (req, res, next) => {
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const duracionMs = Number(process.hrtime.bigint() - inicio) / 1e6;
    // req.path omite cadenas de consulta. Evitar imprimir IDs privados o tokens.
    const ruta = req.route?.path ? String(req.route.path) : (req.path.startsWith('/api/') ? '/api/(unmatched)' : '/web');
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
      method: req.method, route: ruta, status: res.statusCode, durationMs: Number(duracionMs.toFixed(2))
    }));
  });
  next();
};
module.exports = logger;
