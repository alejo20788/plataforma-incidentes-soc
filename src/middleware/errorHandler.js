
const errorHandler = (err, req, res, _next) => {
  console.error('Error del servidor:', err);

  const status = err.status || err.statusCode || 500;
  const statusCode = status >= 400 && status < 600 ? status : 500;

  res.status(statusCode).json({
    data: null,
    error: process.env.NODE_ENV === 'production'
      ? 'Ocurrió un error al procesar la solicitud.'
      : err.message || 'Error interno del servidor.'
  });
};

module.exports = errorHandler;
