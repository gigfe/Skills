---
name: automation-engineering
description: >
  Ayuda a diseñar, escribir y depurar automatizaciones de cualquier tipo — RPA web
  (Playwright/Selenium), automatización sin navegador vía APIs/requests, automatización
  de escritorio (PyAutoGUI/pywinauto), integraciones entre sistemas empresariales
  (Odoo, SAP, ERPs, CRMs), sincronización de datos con Google Sheets/Apps Script,
  notificaciones automáticas (email, Slack, Telegram, webhooks), orquestación y
  programación de tareas (cron, Task Scheduler, colas), y análisis/generación de
  reportes con pandas. Úsala siempre que el usuario mencione automatizar tareas
  repetitivas, generar certificados/reportes desde sistemas empresariales, sincronizar
  datos entre plataformas, hacer web scraping, llenar formularios, programar ejecución
  desatendida, depurar un script que falla intermitentemente, diseñar un flujo de
  notificaciones o alertas, o limpiar/analizar datos — incluso si el usuario no usa
  las palabras "automatización" o "script" explícitamente. Aplica tanto a automatizaciones
  de desarrollo de software como a automatización de procesos de negocio (RPA/BPA).
---

# Ingeniería de Automatización

Skill para apoyar a alguien que diseña y construye automatizaciones — ya sea para tareas de desarrollo de software, procesos de negocio (RPA/BPA), integraciones entre sistemas empresariales, o análisis y generación de reportes de datos.

## 0. Primero: ¿qué tipo de automatización es?

Antes de elegir herramienta, clasifica la tarea — esto cambia todo el enfoque:

| Tipo | Ejemplo | Enfoque |
|---|---|---|
| **Basada en API/datos** | Sincronizar Sheets ↔ Odoo, generar reportes | Preferir siempre; más estable y rápido |
| **RPA web (UI)** | Scraping, llenar formularios, interactuar con SPA | Playwright/Selenium, solo si no hay API |
| **RPA de escritorio (UI)** | Automatizar SAP GUI, apps Win32 sin API | PyAutoGUI/pywinauto |
| **Orquestación/integración** | Mover datos entre N sistemas, disparar workflows | Diseñar primero el flujo de datos, luego el código |
| **Notificación/alerta** | Avisar por Slack/email cuando algo pasa | Webhook o API del canal + trigger basado en evento o polling |
| **Análisis/reporte** | Limpiar datos, generar dashboard, reporte periódico | pandas + salida (Excel/PDF/HTML) |

Regla de oro: **cuanto más lejos de la UI y más cerca de una API/base de datos, más robusta y barata de mantener es la automatización.** La UI (web o escritorio) es el último recurso, no el primero.

## 1. Elegir la herramienta correcta

| Situación | Herramienta | Referencia |
|---|---|---|
| Sitio con JS pesado, SPA, contenido dinámico, necesita esperar elementos | **Playwright** (opción por defecto para web) | `references/playwright.md` |
| Ya existe infraestructura Selenium, o se requiere un driver/browser específico no soportado por Playwright | **Selenium** | `references/selenium.md` |
| El sistema expone API REST/GraphQL/RPC, o el flujo se puede lograr sin navegador | **requests / httpx** (preferir siempre que sea posible) | `references/requests-api.md` |
| App de escritorio nativa sin API disponible (SAP GUI, ventanas Win32) | **PyAutoGUI** (por coordenadas/imagen) o **pywinauto** (por controles de ventana, más confiable) | `references/pyautogui.md` |
| Notificar/alertar por un canal externo | **Webhooks / SDK del canal** (Slack API, SMTP, Telegram Bot API) | `references/notifications.md` |
| Mover/transformar datos entre sistemas sin lógica compleja | **Apps Script, Zapier/Make, o script propio con requests** — evaluar costo/beneficio de no-código vs código | `references/integrations-nocode-vs-code.md` |
| Programar ejecución periódica | **cron (Linux/Mac) / Task Scheduler (Windows) / colas con retry (Celery, APScheduler)** | `references/scheduling.md` |

## 2. Patrones robustos para automatizaciones de producción

Aplican salvo que el usuario pida explícitamente un script rápido/desechable:

- **Separar validación de ejecución**: una función valida que los datos/IDs necesarios existen y son correctos; otra ejecuta la acción. Nunca mezclar ambas.
- **Validación estricta de identificadores antes de actuar**: validar que el ID relevante (`partner_id`, número de orden, email, etc.) existe y es válido *antes* de la acción, para evitar fallos silenciosos que generan datos corruptos o incompletos.
- **Evitar `sleep()` fijos**: usar esperas explícitas por selector/estado (`wait_for_selector`, `expect`, polling con backoff) en vez de tiempos fijos — causa más común de automatizaciones frágiles, tanto en UI como en integraciones por API.
- **Modo headless/verbose togglable**: un flag fácil (`HEADLESS`, `DEBUG`, `DRY_RUN`) para depurar visualmente o simular sin ejecutar cambios reales, y correr silencioso en producción.
- **Logging con checkpoint de última ejecución exitosa**: guardar el timestamp del último registro procesado con éxito. Al iniciar, calcular el rango pendiente (`from`/`to`) en vez de asumir "ayer" o "el último batch", para cubrir huecos por fines de semana, feriados o fallos previos.
- **Idempotencia**: diseñar la automatización para que correrla dos veces sobre los mismos datos no duplique resultados (crear duplicados, reenviar notificaciones, etc.) — clave en integraciones y notificaciones, no solo en scraping.
- **Reintentos con backoff, no reintentos infinitos**: para llamadas a APIs externas o pasos de UI inestables, definir un número máximo de reintentos con espera creciente, y fallar de forma explícita después.
- **Ejecución desatendida con logging a archivo**: en Windows, `.bat` + Task Scheduler; en Linux/Mac, `cron` o un servicio; para orquestación más compleja, considerar una cola (APScheduler/Celery) en vez de encadenar `.bat`/cron. Siempre loguear a archivo, no solo consola, para poder auditar sin supervisión.
- **Notificar fallos, no solo éxitos**: si la automatización corre desatendida, que un fallo silencioso no pase inadvertido — enviar alerta (email/Slack) cuando el proceso falla o cuando detecta datos anómalos.

## 3. Fuentes y destinos de datos / sistemas empresariales

| Fuente/Destino | Patrón recomendado |
|---|---|
| **Google Sheets** | Google Apps Script publicado como web app → Python hace `requests` HTTP. El filtrado (por fechas, rangos) ocurre en el Apps Script, no en Python, para minimizar tráfico. |
| **Excel / CSV local** | `pandas.read_excel` / `pandas.read_csv` con `dtype` explícitos. |
| **SQL Server / bases de datos ERP** | `pyodbc`/`sqlalchemy` + connection string; preferir vistas o SPs sobre queries ad-hoc para no acoplar el script al esquema interno. |
| **API REST / JSON** | `requests` o `httpx`; autenticar con token/Basic/OAuth según el sistema. |
| **Scraping web** | Playwright si hay JS dinámico; `httpx` + `BeautifulSoup` si el HTML es estático. |
| **Archivo de texto / log** | Lectura directa con `open()` + parseo con regex o `csv.reader`. |
| **Email (leer/enviar)** | `imaplib`/`smtplib`, o API del proveedor (Gmail API, Graph API) si se necesita algo más robusto que SMTP crudo. |
| **Mensajería (Slack/Telegram/WhatsApp)** | SDK oficial o webhook entrante/saliente; cuidado con rate limits del canal. |

Patrones adicionales por sistema:

- **Odoo**: preferir la API JSON-RPC/XML-RPC cuando existe; si no hay acceso limpio, automatizar vía Playwright con selectores estables (`data-testid`/roles ARIA sobre clases CSS).
- **SAP GUI**: la conexión se configura por Sistema/Instancia/Servidor de aplicación; el campo "descripción" es cosmético y no afecta la conectividad.
- **Sistemas legacy sin API ni acceso a BD**: última opción es RPA de escritorio (PyAutoGUI/pywinauto) — documentar bien porque es lo más frágil ante actualizaciones del sistema.

Ver `references/data-integrations.md` para snippets de cada patrón.

## 4. Notificaciones y alertas

Cuando la automatización necesita avisar a alguien (éxito, fallo, umbral superado):

- Definir el **trigger**: ¿basado en evento (webhook entrante) o en polling (revisar cada X minutos)? Polling es más simple pero introduce latencia; webhooks son instantáneos pero requieren un endpoint expuesto.
- **No saturar el canal**: agrupar notificaciones (digest) en vez de una por cada evento si el volumen es alto; definir umbrales para alertas críticas vs informativas.
- **Idempotencia también aquí**: evitar reenviar la misma alerta si el script se reintenta.
- Ver `references/notifications.md` para patrones de Slack/email/Telegram.

## 5. Orquestación y programación

- **Tareas simples, independientes, con baja frecuencia**: cron / Task Scheduler es suficiente.
- **Dependencias entre tareas, reintentos, visibilidad de fallos**: considerar un orquestador ligero (APScheduler embebido, o Celery/Airflow si la escala lo justifica) — no sobre-ingeniería para un caso simple, pero tampoco encadenar `.bat` a mano si hay dependencias complejas.
- **Automatización sin código vs con código**: para integraciones simples punto-a-punto (ej. "cuando llega un form, crear fila en Sheets"), evaluar Zapier/Make/n8n antes de escribir código propio — más rápido de mantener si el flujo es simple y no cambia mucho. Escribir código propio cuando hay lógica de negocio no trivial, validaciones específicas, o volumen que no cubre el tier gratuito/económico de esas plataformas.

## 6. Análisis de datos y reportes con pandas

Cuando la tarea es analizar, limpiar o reportar datos (no solo automatizar acciones):

- **Limpieza/transformación**: `pandas` como base independientemente del origen — `read_csv`, `read_excel`, `read_sql`, o construcción desde listas/dicts (scraping, API). `dtype` explícitos, manejo de nulos explícito.
- **Reportes y dashboards**: `matplotlib`/`seaborn` para gráficos estáticos exportables a PDF/PNG; si el reporte se comparte de forma interactiva, considerar un artifact HTML en vez de una imagen estática.
- **Salida**: `openpyxl`/`XlsxWriter` para Excel con formato; `to_csv` para archivos planos; `pyodbc`/`sqlalchemy` para escribir de vuelta en SQL Server; `gspread` o el patrón de Apps Script (sección 3) para Google Sheets.

Ver `references/pandas-analysis.md` para patrones de limpieza y generación de reportes.

## 7. Checklist antes de entregar una automatización

1. ¿Separa validación de ejecución?
2. ¿Falla de forma ruidosa (excepción/log claro) en vez de silenciosa?
3. ¿Usa esperas explícitas en vez de `sleep()` fijos (si aplica a UI)?
4. ¿Tiene modo de depuración (visual/dry-run) y modo producción?
5. ¿Registra en log cada ejecución, éxito y fallo, con timestamp?
6. ¿Maneja huecos de tiempo (fines de semana, feriados, ejecuciones fallidas) en vez de asumir "el periodo anterior"?
7. ¿Es idempotente — correrla dos veces no duplica efectos?
8. Si corre desatendido: ¿está documentado el mecanismo de programación (Task Scheduler/cron/orquestador) y el comando exacto?
9. Si algo falla en producción sin supervisión, ¿alguien se entera (notificación), o el fallo pasa inadvertido?

## 8. Al depurar una automatización existente que falla

1. Pedir el traceback completo y el log de la última ejecución (no solo "no funciona").
2. Reproducir en modo visual/debug (`HEADLESS = False`, `DRY_RUN = True`) antes de asumir la causa.
3. Revisar primero los puntos frágiles típicos: selectores que cambiaron, `sleep()` insuficiente, credenciales/tokens expirados, rate limits del canal/API, caracteres invisibles en datos de origen (p. ej. `CHAR(160)` en nombres provenientes de hojas de cálculo o sistemas externos), zonas horarias inconsistentes entre sistemas.
4. Confirmar el fix con el usuario antes de dar el script por robusto — no asumir que compila/corre sin errores equivale a que funciona correctamente en producción.