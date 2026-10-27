# REFLECTION.md — Do It

**Estudiante:** Fabián Villalta Arburola
**Curso:** Programación Intencional con IA Generativa — Universidad CENFOTEC
**Entrega:** Semana 4 — Autoevaluación de alineación

Este documento compara lo que imaginé al empezar, lo que le especifiqué a la IA
y lo que la IA terminó generando. La evidencia está en
[requirements.md](requirements.md) (sección 9, historial de versiones 0.1 a
0.8), en [.cursorrules](.cursorrules) y en el historial de commits, donde cada
commit cita los requisitos que implementa.

---

## A. Matriz de alineación de intención (Visión vs. Realidad)

| Dimensión | Visión inicial en mi mente (Semana 1) | Especificación entregada a la IA (`requirements.md`) | Resultado real generado por la IA (Semana 4) | Nivel de satisfacción |
|---|---|---|---|---|
| **Lógica de negocio** | Un organizador **no invasivo y sencillo** para las personas a las que les cuesta mantener el orden: ordenar tareas por tiempo, prioridad y semana, con notificaciones a la hora que el usuario elija. Me imaginaba algo más simple. | 12 reglas EARS (RN-01 a RN-12). Ejemplo, RN-02: *"WHEN el reloj local alcanza la hora de una franja IF esa franja está configurada, su `ultimoAviso` es distinto de Hoy y existe al menos una tarea abierta de Hoy o una tarea vencida THEN system SHALL mostrar un único aviso con el Resumen del día (nunca un aviso por tarea)…"* | Las 12 reglas implementadas y cubiertas por 104 pruebas automáticas. La app terminó siendo más completa que la idea inicial: horario de trabajo, cronómetro por tarea, meta sugerida para tareas repetidas y bloques "+N" para tareas que chocan. Los recordatorios quedaron como yo quería: el usuario elige la hora y no suenan como un despertador. | **Muy satisfecho** |
| **Experiencia de usuario (UI/UX)** | Algo **súper sencillo**, que no se veía como quedó al final. | [Wireframes de 9 pantallas](docs/wireframes/index.html) y los requisitos RF-EST-01 a RF-EST-06: tema oscuro minimalista basado en una referencia aportada por la clienta y adaptado a una cuadrícula por horas. RN-08 pide que las tareas superpuestas no se dibujen apretadas como en Google Calendar. | Interfaz fiel a los wireframes en las tres vistas (Horas, Día y Semana), usable a 360 px de ancho. La tipografía es la del sistema porque `.cursorrules` prohíbe cargar recursos externos como Google Fonts. En la Semana 4 se sumaron, a pedido mío, un brillo azul en los bordes cerca del cursor (RF-EST-07) y luces difusas sobre el fondo negro (RF-EST-08), sin cambiar la base oscura. | **Satisfecho** |
| **Persistencia de datos** | No le presté mucha atención; pensaba que la base de datos y el hosting son de lo último que se hace al publicar algo en internet. | Interfaces TypeScript en [src/domain/modelo.ts](src/domain/modelo.ts) (`Categoria` 1→N `Tarea`, `Preferencias`, `EstadoPersistido`) y los requisitos RF-PER-01 a RF-PER-05: LocalStorage con la clave `do-it:v1`. Backend y nube quedaron explícitamente fuera de alcance. | Todo el estado se guarda en LocalStorage y sobrevive a recargar la página (F5), incluso un cronómetro en marcha y el paso del primer uso. Si los datos guardados se dañan, no se sobrescriben (CB-39). Si el navegador no puede guardar, la app vuelve exactamente a como estaba (CB-40). | **Satisfecho** |

### Análisis de las brechas

- **Lógica de negocio: el resultado superó la visión.** La causa es que la
  clienta fue pidiendo funciones a mitad de camino (calendario por horas,
  horario de trabajo, cronómetro, meta sugerida). Cada pedido pasó primero por
  `requirements.md`, con una versión nueva, y recién después al código.
- **UI/UX: la brecha es de gusto, no de cumplimiento.** El diseño final es
  minimalista porque así lo pedía la referencia de la clienta, que quedó
  escrita en RF-EST. En lo personal mis diseños son más maximalistas, que es
  algo que se usa mucho hoy. La IA siguió la especificación y no mi gusto
  personal, que es lo correcto: si quiero otro estilo, primero tengo que
  cambiar la especificación. Eso fue lo que hice en la Semana 4: para acercar
  el diseño a mi gusto pedí el brillo en los bordes y las luces del fondo,
  pero primero los escribí como RF-EST-07 y RF-EST-08 (versión 0.9) y recién
  después la IA los implementó. Mantuve el fondo negro porque una versión más
  clara no me gustó. Además, la IA los hizo solo con CSS, porque
  `.cursorrules` no permite agregar la librería de shaders que usaba la
  referencia.
- **Persistencia: lo que falta fue una decisión consciente, no un olvido.** La
  base de datos y el hosting están en "Fuera de alcance" para que el proyecto
  entrara en tres semanas. Esa misma decisión explica la principal limitación
  aceptada: sin servidor, las notificaciones no pueden llegar con la app
  cerrada, y por eso existe RN-03 (el resumen perdido aparece al abrir la app).

---

## B. Cuestionario de reflexión de cierre

### 1. Autonomía de la IA

La IA no actuó fuera de mis instrucciones: siempre le di las órdenes y actuó
como se lo pedí. Cuando tuvo que decidir algo que la especificación no cubría,
lo propuso y lo dejó escrito para mi aprobación en lugar de hacerlo en
silencio. Por ejemplo:

- **Usar la tipografía del sistema** en vez de la de los wireframes, porque
  `.cursorrules` prohíbe recursos externos. Fue un acierto de gobierno, aunque
  visualmente se pierde algo.
- **Los bloques "+N"** para las tareas que chocan de horario. Yo pedí que no
  se viera saturado como Google Calendar y la IA propuso la solución concreta,
  que quedó escrita como RN-08. Fue un acierto.
- **El mensaje "Todavía no tiene tareas"** para el calendario vacío (RF-CAL-10),
  marcado en el historial como "Propuesta del equipo".

También cometió errores, que detectó ella misma antes de guardarlos, ya sea
porque chocaban con las reglas de `.cursorrules` o porque se dio cuenta sola
de que se estaba yendo por otro lado: un aviso "Categoría guardada" que
nadie había pedido, código que no servía para nada y una verificación de
prueba que siempre daba "bien" aunque fallara. Ninguno llegó al repositorio.

### 2. Calidad de la especificación

La ambigüedad que más me enseñó fueron **los textos mal escritos**. La
especificación decía que los textos visibles debían copiarse exactamente como
estaban en `requirements.md`, y como yo había escrito "{N} tareas quedan
fuera…" y "Las últimas {N} veces…", la app mostraba "1 tareas" y "Las
últimas 1 veces". **La IA obedece la especificación incluso cuando la
especificación tiene errores**, así que la calidad del resultado depende de
la calidad de lo que yo escribo. Se corrigió en la versión 0.8.

Otras ambigüedades que obligaron a la IA a detenerse y preguntar:

- "Ordenar por tiempo" podía ser por fecha o por duración (eran las dos).
- "Después de poner nombre" no decía si era el nombre de la app o del usuario.
- La vista "Horas" no estaba definida frente a la vista "Día".
- El Resumen del día podía contar dos veces una tarea vencida de hoy (v0.7).
- No se sabía si un recordatorio configurado para una hora que ya pasó avisaba
  hoy o mañana. Lo detectó una prueba en el navegador y elegí "mañana" (v0.8).

**Qué haría distinto:** pensaría todas las funciones desde el inicio. Muchas
llegaron a mitad de camino porque la clienta las fue pidiendo, pero si se me
hubieran ocurrido antes las habría especificado de entrada. Por eso la
especificación pasó por ocho versiones. Lo que evitó parches frágiles fue la
regla de que ningún cambio llega al código sin pasar antes por
`requirements.md`.

### 3. Rol de Head Chef

Me siento **totalmente dueño de mi código**. Cada parte responde a un
requisito con su identificador (por ejemplo `RN-09` o `RF-PER-04`), y esos
identificadores aparecen en los comentarios del código, en los nombres de las
pruebas y en los mensajes de los commits. Así puedo rastrear cualquier línea
hasta la decisión que la originó. La estructura en capas (`domain`,
`storage`, `services`, `ui`) la fijé en `.cursorrules` antes de que existiera
el código, y las reglas de negocio están separadas de la pantalla, lo que
permite probarlas una por una.

### 4. Satisfacción del cliente

Si el profesor fuera un cliente real, diría que el producto está alineado en
un **9 de 10** con la visión original. Cumple lo que se pidió: ordenar por
tiempo, prioridad y semana; recordatorios no invasivos a la hora elegida; ver
las tareas por horas, día y semana sin que se sature como Google Calendar; y
medir cuánto tarda cada tarea.

No le pongo 10 porque todavía le podemos mejorar muchas cosas y ponerle mucho
amor: un diseño con más personalidad, una base de datos, publicarla en un
hosting y que las notificaciones lleguen con la app cerrada. Con el tiempo
podemos ver cómo va funcionando con usuarios reales e ir corrigiendo esos
pequeños baches en futuras actualizaciones.
