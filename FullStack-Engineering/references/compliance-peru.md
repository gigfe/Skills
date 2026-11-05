# Cumplimiento en Perú

Guía técnica, no asesoría legal. Las normas y los plazos cambian: confirma la versión vigente en fuentes
oficiales (ANPD/MINJUSDH, SUNAT, El Peruano) antes de afirmarlos en un contrato, y recomienda revisión
legal cuando el caso lo amerite.

## Datos personales: Ley 29733

Reglamento vigente: **DS 016-2024-JUS** (publicado en noviembre de 2024; vigente desde finales de marzo de
2025, según despachos legales; confirma contra el texto oficial).

**Qué significa para el sistema:**

| Requisito | Traducción técnica |
|-----------|-------------------|
| Finalidad y consentimiento | Registrar versión, fecha y canal del consentimiento cuando sea la base legal |
| Minimización | No capturar lo que el proceso no use. Cuestiona cada campo |
| Datos sensibles (salud, biometría, etc.) | Acceso restringido, cifrado y auditoría de lecturas |
| Derechos ARCO | Poder exportar, corregir y cancelar los datos de una persona |
| Conservación | Plazo por tipo de dato; anonimización o borrado. Los documentos tributarios pueden tener su propia retención obligatoria: anula la identidad donde proceda, sin romper la contabilidad |
| Seguridad | Control de acceso, logs, backups cifrados, entornos no productivos anonimizados |
| Encargados | El proveedor que trata datos debe tener contrato; revisa el flujo transfronterizo si el VPS o un SaaS está fuera del Perú |
| Registro del banco de datos | Evaluar la inscripción ante la ANPD |

**Incidentes.** Según material legal revisado (CMS), el reglamento exige notificar a la ANPD dentro
de **48 horas** de conocido el incidente, y a los titulares cuando hay alto riesgo. Por eso el sistema debe
permitir detectar el incidente y responder qué datos y personas se afectaron: deja un runbook con el
responsable y los pasos.

**Oficial de datos personales.** Puede ser exigible según el tipo y volumen de tratamiento: verifica la
obligación y los plazos graduales en el reglamento para cada cliente.

**En el anexo técnico**, separa quién es titular del banco de datos (normalmente el cliente) y quién es
encargado (Fernando o su empresa, si tiene acceso a producción).

## Tributario: SUNAT

Lo relevante para diseñar Record-to-Report y Order-to-Cash:

- **Comprobantes electrónicos** (factura, boleta, notas, guías de remisión) vía OSE, PSE o sistemas SUNAT.
  > **Decisión:** integrar un proveedor autorizado (PSE/OSE) mediante un puerto. **Por qué:** el formato
  > UBL, el firmado y los cambios normativos son su negocio. **Descartado:** emisión directa propia.
  > **Cuándo sí convendría:** volumen muy alto y equipo que pueda mantenerla.
- **Inmutabilidad:** un comprobante emitido no se edita; se corrige con notas de crédito o débito. Correlativos
  por serie y sin reutilización: resuélvelo en el SP con bloqueo por serie.
- **Asíncrono:** emisión por outbox y cola, con estados (`pendiente`, `aceptado`, `rechazado`, `observado`) y
  reintentos idempotentes. Si SUNAT o el proveedor cae, la venta no debe perderse.
- **Moneda y redondeo:** `numeric`, tipo de cambio guardado en el documento, IGV configurable por fecha de
  vigencia, no constante en el código.
- **Libros electrónicos (PLE/SIRE):** evalúa si el cliente está obligado; diseña el modelo contable para poder
  generarlos, con periodo cerrado que impida asientos retroactivos.
- **Detracciones, retenciones y percepciones:** según operación y rubro. Pregúntale al contador del cliente.

Valida las reglas tributarias con el contador del cliente: es su responsabilidad y conoce los casos del rubro.
