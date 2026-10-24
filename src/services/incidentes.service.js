// Reglas del negocio independientes de HTTP y Prisma.
const sanitize = (value) => value.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim();
function fechaValida(value) {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?$/.test(value)) return false;
  const [date, time = '00:00'] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day && utc.getUTCHours() === hour && utc.getUTCMinutes() === minute;
}
function validarIncidente(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Cuerpo inválido.' };
  const { tipo, prioridad, fecha, descripcion, estado } = body;
  if ([tipo, prioridad, fecha, descripcion].some(v => typeof v !== 'string')) return { error: 'Todos los campos deben ser texto.' };
  const data = { tipo: sanitize(tipo), prioridad: prioridad.trim().toUpperCase(), fecha: fecha.trim(), descripcion: sanitize(descripcion) };
  if (data.tipo.length < 3 || data.tipo.length > 120) return { error: 'El tipo debe tener entre 3 y 120 caracteres.' };
  if (!['ALTA', 'MEDIA', 'BAJA'].includes(data.prioridad)) return { error: 'Prioridad inválida.' };
  if (!fechaValida(data.fecha)) return { error: 'Fecha inválida.' };
  if (data.descripcion.length < 30 || data.descripcion.length > 3000) return { error: 'La descripción debe tener entre 30 y 3000 caracteres.' };
  if (estado !== undefined) {
    if (typeof estado !== 'string' || !['ABIERTO', 'EN_PROCESO', 'CERRADO'].includes(estado)) return { error: 'Estado inválido.' };
    data.estado = estado;
  }
  return { data };
}
module.exports = { validarIncidente, fechaValida, sanitize };
