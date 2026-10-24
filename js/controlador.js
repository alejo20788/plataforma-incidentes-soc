
import { Modelo } from './modelo.js';
import { Vista } from './vista.js';

const $ = selector => document.querySelector(selector);

const Controlador = {

  iniciar() {
    $('#login-form').addEventListener('submit', e => this.login(e));

    $('#logout-btn').addEventListener('click', () => {
      Modelo.logout();

      $('#edit-id').value = '';
      Vista.limpiarFormulario();

      this.setSesion(false);
      Vista.renderizarLista([]);
      Vista.notificar('Sesión cerrada.');
    });

    Vista.elementos.formulario.addEventListener(
      'submit',
      e => this.guardar(e)
    );

    Vista.elementos.contenedorLista.addEventListener(
      'click',
      e => this.accion(e)
    );

    this.setSesion(false);
  },

  setSesion(activa) {
    $('#login-panel').hidden = activa;
    $('#session-panel').hidden = !activa;

    Vista.elementos.formulario.querySelector(
      'button[type=submit]'
    ).disabled = !activa;

    $('#usuario-actual').textContent = activa
      ? Modelo.rol
      : '';
  },

  async login(e) {
    e.preventDefault();

    const boton = $('#login-form button[type=submit]');
    boton.disabled = true;

    try {
      await Modelo.login(
        $('#login-user').value,
        $('#login-password').value
      );

      $('#login-password').value = '';

      this.setSesion(true);

      Vista.renderizarLista(
        await Modelo.cargarIncidentesIniciales(),
        Modelo.rol
      );

      Vista.notificar('Sesión iniciada.');

    } catch (err) {
      Vista.notificar(err.message, true);

    } finally {
      boton.disabled = false;
    }
  },

  datosFormulario() {
    const f = Vista.elementos;

    return {
      tipo: f.tipo.options[f.tipo.selectedIndex]?.text || '',
      fecha: f.fecha.value,
      prioridad: f.prioridad.value.toUpperCase(),
      descripcion: f.descripcion.value.trim(),
      estado: $('#estado-incidente').value,
      evidencia: $('#evidencias').files[0] || null
    };
  },

  // Validación anticipada de las reglas del formulario.
  validarFormulario(datos) {

    if (
      datos.descripcion.length < 30 ||
      datos.descripcion.length > 3000
    ) {
      Vista.notificar(
        'La descripción debe tener entre 30 y 3000 caracteres.',
        true
      );

      return false;
    }

    if (datos.evidencia && datos.evidencia.size > 5 * 1024 * 1024) { Vista.notificar('La evidencia supera 5 MB.', true); return false; }
    return true;
  },

  async guardar(e) {
    e.preventDefault();

    const datos = this.datosFormulario();

    // Evita solicitudes HTTP innecesarias con descripciones inválidas.
    if (!this.validarFormulario(datos)) {
      return;
    }

    try {
      Vista.mostrarCargando(true);

      const id = $('#edit-id').value;

      if (id) {
        await Modelo.actualizarIncidente(id, datos);
      } else {
        await Modelo.guardarIncidente(datos);
      }

      $('#edit-id').value = '';
      Vista.limpiarFormulario();

      Vista.renderizarLista(
        Modelo.obtenerIncidentes(),
        Modelo.rol
      );

      Vista.notificar(
        id
          ? 'Incidente actualizado.'
          : 'Incidente registrado.'
      );

    } catch (err) {
      Vista.notificar(err.message, true);

    } finally {
      Vista.mostrarCargando(false);
    }
  },

  async accion(e) {
    const btn = e.target.closest('button[data-action]');

    if (!btn) return;

    const id = btn.dataset.id;

    const item = Modelo.incidentes.find(
      i => i.id === id
    );

    if (!item) return;

    if (btn.dataset.action === 'evidence') {
      try { await Modelo.descargarEvidencia(id,item.evidenciaNombre); }
      catch(err){ Vista.notificar(err.message,true); }
      return;
    }

    // Eliminar incidente
    if (btn.dataset.action === 'delete') {

      if (!confirm('¿Eliminar este incidente?')) {
        return;
      }

      try {
        await Modelo.eliminarIncidente(id);

        Vista.renderizarLista(
          Modelo.obtenerIncidentes(),
          Modelo.rol
        );

        Vista.notificar('Incidente eliminado.');

      } catch (err) {
        Vista.notificar(err.message, true);
      }

      return;
    }

    // Editar incidente
    if (btn.dataset.action === 'edit') {

      $('#edit-id').value = id;

      const f = Vista.elementos;

      const option = [...f.tipo.options].find(
        o => o.text === item.tipo
      );

      if (option) {
        f.tipo.value = option.value;
      }

      f.fecha.value = item.fecha;

      f.prioridad.value = [...f.prioridad.options].find(
        o => o.value.toUpperCase() === item.prioridad
      )?.value || '';

      f.descripcion.value = item.descripcion;

      $('#estado-incidente').value = item.estado;

      document.querySelector('#registro').scrollIntoView({
        behavior: 'smooth'
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Controlador.iniciar();
});
