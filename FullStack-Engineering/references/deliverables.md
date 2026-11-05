# Entregables

## Contenido del entregable estándar

Si el caso es chico, reduce cada punto a lo que aporta; omite lo que no aplique y dilo.

1. **Resumen:** problema en un párrafo, objetivo de negocio, supuestos numerados, preguntas críticas
   con el impacto de no resolverlas.
2. **Procesos:** ver `business-process.md`.
3. **Stack:** tabla componente, elección, por qué, alternativa descartada y cuándo sí convendría.
4. **Arquitectura:** diagrama Mermaid de contenedores, capas hexagonales, carpetas.
5. **Base de datos:** `erDiagram` de las entidades núcleo, esquemas, roles y permisos, firmas de los
   SPs principales, índices con la consulta que los justifica. Ver `erp-database.md`.
6. **Seguridad:** authn/authz, secretos, hardening del VPS (SSH, firewall, fail2ban), HTTPS, OWASP
   Top 10 aplicado al caso, auditoría, datos personales. Ver `security.md` y `compliance-peru.md`.
7. **Infraestructura:** dev, staging y prod; Docker Compose; reverse proxy; backups con RPO, RTO y
   prueba de restauración; monitoreo y alertas. Ver `infra-vps.md`.
8. **Calidad:** estrategia de tests, CI/CD, checklist de salida. Ver `testing.md`.
9. **Claude Code:** CLAUDE.md, subagentes, hooks y flujo. Ver `claude-code-setup.md`.
10. **Estimación:** abajo.
11. **Lo que debes aprender de este caso:** 2-3 conceptos, por qué importan aquí y un recurso. Da
    solo enlaces que hayas verificado, o nombra el libro o documento oficial.

## Estimación

Estima por módulo en tres puntos, de modo que el rango muestre la incertidumbre:

| Módulo | Optimista | Probable | Pesimista | Esperado |
|--------|-----------|----------|-----------|----------|

`Esperado = (optimista + 4 × probable + pesimista) / 6`.

- Incluye lo que suele olvidarse: análisis, tests, migración de datos, capacitación, despliegue,
  reuniones y correcciones. Suelen sumar 30-50% sobre "programar".
- Con Claude Code baja el costo de escribir código, no el de validar con el cliente, migrar datos ni
  capacitar. No descuentes esas horas.
- Cronograma por fases, cada una con algo que el cliente pueda usar y un criterio de aceptación.
- Riesgos: tabla de riesgo, probabilidad, impacto y mitigación. Los habituales: datos sucios de
  origen, usuario clave sin tiempo, cambios tributarios, integraciones sin documentar.
- Son estimaciones de referencia: declara supuestos y evita presentarlas como certeza.

**Viabilidad:** compara horas esperadas × tarifa contra el precio, y las horas contra el plazo. Si no
cierra, dilo con números y ofrece opciones: subir el precio, ampliar el plazo o recortar alcance,
indicando qué se recorta.

## ANEXO TÉCNICO

Solo con "BRIEF PARA ARQUITECTO". Debe poder pegarse en un contrato: sin notas internas, sin
"probablemente", y con todo lo prometido en términos verificables. Indica que la revisión legal final
corresponde a un abogado.

```markdown
# ANEXO TÉCNICO

## 1. Procesos cubiertos
<TO-BE resumido por proceso>

## 2. Stack y arquitectura

## 3. Alcance
### Incluido
| Módulo | Funcionalidades |
### NO incluido
<Lista explícita. Lo no escrito aquí genera discusiones después.>

## 4. Infraestructura, hosting y entornos
<Quién contrata y paga el hosting, proveedor, entornos>

## 5. Seguridad y backups
<Frecuencia, retención, prueba de restauración, RPO y RTO>

## 6. Criterios de aceptación por fase
| Fase | Entregable | Criterio verificable | Plazo de revisión |

## 7. Horas y cronograma
| Módulo | Horas | Fase |

## 8. SLA de soporte y mantenimiento
| Severidad | Definición | Tiempo de respuesta | Horario |
<Qué cubre, qué se cobra aparte, vigencia>

## 9. Supuestos y responsabilidades del cliente
<Usuario clave, entrega de datos en plazos, pruebas, accesos. Efecto de los retrasos.>

## 10. Control de cambios
<Cómo se pide, estima y aprueba lo que no está en el alcance>
```

El punto 10 no estaba en la lista original, pero conviene mantenerlo: sin control de cambios, el
alcance crece sin que crezca el precio.
