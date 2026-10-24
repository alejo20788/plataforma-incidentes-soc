# Incidentes — Semana 7: pruebas y optimización

## Requisitos
Node.js 20 o superior, npm y opcionalmente Docker Compose. Proyecto de demostración académica; no usar credenciales de ejemplo en producción.

## Instalación
1. Copiar `.env.example` a `.env` y definir `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `ANALISTA_PASSWORD_HASH` con valores propios. No publicar `.env`.
2. `npm install`
3. `npx prisma generate && npx prisma db push`
4. `npm start` o `docker compose up --build` (verificar que el .env existe en carpeta actual).
5. Abrir `http://localhost:3000`.

## Arquitectura MVC
- `src/routes`: rutas de incidentes y control de acceso.
- `src/controllers/incidentes.controller.js`: traducción HTTP/JSON, autorización a nivel de rutas y coordinación.
- `src/services/incidentes.service.js`: reglas puras (validación, saneamiento y comprobación estricta de fechas), sin Prisma ni Express.
- Prisma (`prisma/schema.prisma`): modelo de persistencia, con acceso invocado desde el controlador. **Mejora futura**: extraer las operaciones Prisma a un repositorio independiente.
- `js/modelo.js`, `js/vista.js`, `js/controlador.js`: módulos del cliente.

## Pruebas, análisis y mediciones
- `npm test`: Jest con 8 reglas de negocio.
- `npm run test:coverage`: cobertura Jest.
- `npm run lint`: ESLint.
- `mkdir -p reports && npm run lint:report`: reporte JSON.
- `npm run measure:db`: 10 lecturas Prisma, promedio ms. Ejecutar con `DATABASE_URL` apropiada.
- `npm run measure:network`: 10 solicitudes GET a la página, promedio ms; usar `MEASURE_URL=http://localhost:3000/api/...` solo si se provee autenticación en una versión posterior del script.
- Imagen `assets/escudo.svg`: inspeccionar en DevTools > Network > Img, documentar tamaño transferido y duración. Comparar con una alternativa PNG equivalente **si se prepara y sirve realmente** bajo condiciones semejantes.

## Guía de dos defectos observables en la versión anterior
1. **Fecha imposible**: enviar por API `fecha: "2026-02-30"` con JWT válido. La validación anterior aceptaba fechas normalizadas por `Date.parse` en ciertos entornos; ahora `fechaValida` comprueba componentes reales. Conservar Network Response antes/después, con token oculto.
2. **Edición arrastrada entre sesiones**: estando autenticado, pulsar "Editar", cerrar sesión y volver a entrar. Antes, el campo oculto `#edit-id` conservaba el incidente anterior y podía actualizarlo por error. Ahora logout limpia el formulario y el identificador. Conservar capturas del campo inspeccionado en Elements y solicitud POST/PUT en Network, antes/después.

Estos defectos se identificaron mediante revisión del código, **no se han reproducido todavía en DevTools del equipo del estudiante**. Las capturas deben corresponder a ejecuciones reales.

## Evidencia de comparación antes/después
Use la versión previa guardada como línea base. Ejecute los mismos escenarios, navegador y número de repeticiones. Guarde capturas de Console/Network, reporte de Jest, ESLint, métricas de BD/red y de imagen; registre CPU/red/caché. Nunca incluir JWT o secretos en capturas.

## Endpoints
- `POST /api/login` -> JWT.
- `GET /api/incidentes` -> token obligatorio.
- `POST /api/incidentes` -> analista o administrador.
- `PUT /api/incidentes/:id` -> analista o administrador.
- `DELETE /api/incidentes/:id` -> administrador.

## Observaciones
Para producción, sustituir `prisma db push` en el arranque por migraciones controladas, habilitar HTTPS real mediante TLS, mantener secretos fuera del repositorio y endurecer operaciones con pruebas de integración.


## Evidencias adjuntas (Semana 7)

El formulario acepta un archivo opcional `png`, `jpg`, `pdf` o `txt` de hasta 5 MB.
El navegador lo envía como `multipart/form-data` junto con los campos del incidente,
y el servidor lo guarda fuera del directorio público. Se almacena en SQLite únicamente
el nombre original y el identificador aleatorio del archivo. La descarga exige JWT.
Al editar sin seleccionar archivo se conserva la evidencia anterior; al sustituirla se
elimina el archivo antiguo; al eliminar el incidente se elimina su evidencia.
En Docker el volumen `incidentes_evidencias` conserva los archivos.

Después de actualizar, ejecute `npm install`, `npx prisma db push` y
`docker compose up --build -d` (Docker sincroniza Prisma al arrancar).
No incluya `.env` en entregas; utilice los secretos existentes de su equipo.
Prueba DevTools: seleccione una imagen, guarde un incidente y compruebe en Network
que la solicitud `POST /api/incidentes` tiene contenido `multipart/form-data` con
una parte `evidencia`; a continuación descargue el archivo desde el listado.
Limitación: esta implementación valida extensión lógica vía MIME y tamaño; para
producción se recomienda además inspeccionar firmas binarias y análisis antimalware.
