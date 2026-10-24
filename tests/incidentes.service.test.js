const { validarIncidente, fechaValida } = require('../src/services/incidentes.service');
const valido = { tipo: 'Acceso no autorizado', prioridad: 'ALTA', fecha: '2026-10-10T10:30', descripcion: 'Intentos reiterados de acceso detectados en servidor.' };
describe('reglas de incidentes', () => {
  test('acepta un incidente válido', () => expect(validarIncidente(valido).data).toBeDefined());
  test('rechaza descripción corta', () => expect(validarIncidente({ ...valido, descripcion: 'corto' }).error).toMatch(/descripción/i));
  test('rechaza prioridad desconocida', () => expect(validarIncidente({ ...valido, prioridad: 'URGENTE' }).error).toMatch(/prioridad/i));
  test('rechaza fecha inexistente 30 de febrero', () => expect(fechaValida('2026-02-30')).toBe(false));
  test('acepta año bisiesto', () => expect(fechaValida('2028-02-29')).toBe(true));
  test('elimina etiquetas HTML de la descripción', () => expect(validarIncidente({ ...valido, descripcion: '<b>Intentos reiterados de acceso detectados en servidor.</b>' }).data.descripcion).not.toContain('<'));
  test('rechaza estado no permitido', () => expect(validarIncidente({ ...valido, estado: 'FALSO' }).error).toMatch(/estado/i));
  test('rechaza tipo de dato incorrecto', () => expect(validarIncidente({ ...valido, descripcion: 42 }).error).toBeDefined());
});
