// Simulación de base de datos en memoria
let incidentes = [
  {
    id: "INC-2026-001",
    tipo: "Infección por Malware / Ransomware",
    prioridad: "alta",
    fecha: "2026-09-25 09:30",
    descripcion: "Estación de trabajo contable reporta bloqueo de archivos compartidos."
  }
];

module.exports = {
  obtenerTodos: () => incidentes,
  crear: (nuevo) => {
    incidentes.unshift(nuevo);
    return nuevo;
  },
  eliminar: (id) => {
    incidentes = incidentes.filter(inc => inc.id !== id);
  }
};