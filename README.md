# Do It

Organizador de tareas de trabajo con calendario por horas, día y semana,
cronómetro por tarea y recordatorios diarios no invasivos. Proyecto final del
curso Programación Intencional con IA Generativa (Universidad CENFOTEC),
desarrollado con Spec-Driven Development.

**Estudiante:** Fabián Villalta Arburola

**App publicada:** [do-it-taupe.vercel.app](https://do-it-taupe.vercel.app/)
(Vercel la vuelve a publicar en cada cambio que se sube a `main`).

## Cómo ejecutarlo

Requiere [Node.js](https://nodejs.org/) 22.12 o superior.

```bash
npm install      # instala Vite, TypeScript y Vitest
npm run dev      # abre la app en http://localhost:5173
npm test         # corre las pruebas automáticas
npm run test:navegador   # recorre la app en Chrome sin ventana (requiere Chrome)
npm run build    # compila la versión de producción en dist/
```

Los datos se guardan en el LocalStorage del navegador, sin servidor ni cuentas.

## Documentos del proyecto

| Documento | Contenido |
|---|---|
| [requirements.md](requirements.md) | Especificación en sintaxis EARS: reglas de negocio, requisitos, casos de borde e historial de cambios. Es la única fuente de verdad. |
| [.cursorrules](.cursorrules) | Reglas de gobierno de la IA: stack permitido, arquitectura, convenciones y prohibiciones. |
| [docs/propuesta.md](docs/propuesta.md) | Propuesta del Avance 1: problemática, solución y plan. |
| [docs/wireframes/](docs/wireframes/index.html) | Wireframes de las 9 pantallas, en PNG y HTML. |
| [REFLECTION.md](REFLECTION.md) | Autoevaluación de alineación (Visión vs. Realidad). |

## Estructura del código

```
src/
  domain/     Modelo de datos y reglas de negocio (funciones puras, sin DOM ni almacenamiento)
  storage/    Lectura y escritura validada en LocalStorage
  services/   Casos de uso que conectan dominio y almacenamiento
  ui/         Pantallas y componentes en TypeScript, sin framework
  styles/     Hojas de estilo
tests/        Pruebas de Vitest; cada una cita la regla (RN-xx) o el caso de borde (CB-xx) que cubre
tests/navegador/  Pruebas de la interfaz en Chrome real, sin dependencias
```
