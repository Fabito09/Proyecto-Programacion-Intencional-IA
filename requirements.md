# requirements.md — Do It

Contrato de requerimientos de la aplicación. Es la **única fuente de verdad**:
todo comportamiento del sistema debe poder rastrearse a un identificador de este
documento. Lo que no está escrito aquí no se implementa.

- **Versión:** 0.6 (borrador — Avance 1)
- **Modelo de datos:** [src/domain/modelo.ts](src/domain/modelo.ts)
- **Reglas de gobierno de la IA:** [.cursorrules](.cursorrules)

---

## 1. Problema y alcance

Una persona necesita organizar sus tareas de trabajo en un **calendario**
ajustado a su **horario laboral**, que pueda ver por **próximas horas**, por
**día** y por **semana**. Necesita distinguir la **prioridad** de cada tarea,
ponerse una **meta de tiempo**, **medir con un cronómetro** cuánto tarda
realmente y recibir recordatorios diarios **no invasivos** a las horas que ella
elija. Con el tiempo medido, la app le sugiere metas realistas para las tareas
que repite.

La aplicación es una web de un solo usuario, sin cuentas ni login. Todos los
datos viven en el navegador del usuario (LocalStorage).

Principios de producto pedidos por el cliente:

1. Sencilla de usar: menú de tres secciones, formularios cortos.
2. Recordatorios que informan sin interrumpir: como máximo un aviso por franja
   configurada y por día, siempre en forma de resumen.
3. Las tareas que están por vencer o ya vencieron se distinguen a simple vista.
4. Calendario visualmente limpio: las tareas que comparten horario **no** se
   dibujan apretadas lado a lado (problema que la clienta tiene hoy con otros
   calendarios).
5. La app trata al usuario de **usted** en todos sus textos.
6. La app **nunca** marca una tarea como completada por su cuenta: solo el
   usuario la completa.

## 2. Glosario

| Término | Definición |
|---|---|
| **Hoy / Mañana / Ahora** | La fecha local del navegador, el día siguiente y el instante actual. |
| **Semana** | Lunes a domingo (ISO 8601), en hora local. La semana de una tarea es la que contiene su `fecha`. |
| **Horario de trabajo** | Días laborales, hora de entrada y hora de salida, iguales para todos los días laborales. |
| **Día laboral** | Día de la semana marcado en el horario de trabajo. |
| **Jornada** | En un día laboral, el intervalo entre la hora de entrada y la de salida. |
| **Horario de una tarea** | Intervalo desde `horaInicio` hasta `horaInicio + metaMinutos`, en su `fecha`. |
| **Fin de una tarea** | El instante en que termina su horario. |
| **Tarea abierta** | Tarea con estado `pendiente` o `en_progreso`. |
| **Tarea vencida** | Tarea abierta cuyo fin es anterior a Ahora. Estado **derivado**: no se guarda, se calcula. Su estado guardado sigue siendo `pendiente` o `en_progreso`. |
| **Tarea por vencer** | Tarea abierta, no vencida, cuya `fecha` es Hoy o Mañana. Estado **derivado**. |
| **Tareas superpuestas** | Dos o más tareas de la misma `fecha` cuyos horarios se cruzan (una empieza antes de que la otra termine). |
| **Grupo superpuesto** | Conjunto de tareas conectadas entre sí por superposición. |
| **Meta de tiempo** | Tiempo en el que el usuario se propone terminar una tarea. Se ingresa en horas y minutos y se guarda en minutos (`metaMinutos`). |
| **Tiempo medido** | Tiempo total registrado por el cronómetro de una tarea (`segundosMedidos` más el tramo en curso, si está corriendo). |
| **Cronómetro corriendo** | Tarea cuyo `cronometroIniciadoEn` no es `null`. |
| **Tarea repetida** | Tarea cuyo título (texto normalizado) coincide con el de tareas completadas anteriormente. |
| **Texto normalizado** | Título o nombre sin espacios al inicio ni al final, con espacios internos repetidos reducidos a uno, en minúsculas y sin tildes. Se usa para detectar duplicados y tareas repetidas. |
| **Franja de recordatorio** | Cada uno de los dos recordatorios configurables: `principal` y `secundario`. |
| **Franja configurada** | Franja cuya `hora` no es `null`. Una franja sin hora se muestra como "Ninguno" y nunca avisa. |
| **Resumen del día** | Texto con la cantidad de tareas abiertas de Hoy (indicando cuántas son de prioridad alta) y la cantidad de tareas vencidas. |
| **Mensaje de error en línea** | Texto rojo bajo el campo inválido, que desaparece cuando el campo se corrige. |

## 3. Modelo de dominio

```
Categoria (1) ──── (N) Tarea
Preferencias (1, única por navegador: nombre, horario de trabajo, paso del
              primer uso, recordatorios, vista y orden preferidos)
```

- Toda Tarea pertenece exactamente a una Categoria (`tarea.categoriaId`).
- Una Categoria puede tener cero o más Tareas.
- Las interfaces exactas, tipos y límites de cada campo están en
  [src/domain/modelo.ts](src/domain/modelo.ts).

---

## 4. Reglas de negocio principales

Estas son las reglas complejas que definen el producto. Sintaxis:
`WHEN [evento] IF [condición] THEN system SHALL [respuesta]`.

### RN-01 — Alta y edición de tareas sin duplicados

**WHEN** el usuario guarda una tarea (nueva o editada)
**IF** existe otra tarea abierta, distinta de la que se está editando, con el
mismo título (texto normalizado) y cuya `fecha` cae en la misma semana
**THEN** system **SHALL** rechazar el guardado, mostrar en línea bajo el título
el mensaje "Ya tiene una tarea con ese título esta semana", conservar en el
formulario los valores escritos y dejar el calendario y el almacenamiento sin
cambios.

### RN-02 — Recordatorio a la hora configurada

**WHEN** el reloj local alcanza la hora de una franja de recordatorio
**IF** esa franja está configurada, su `ultimoAviso` es distinto de Hoy y existe
al menos una tarea abierta de Hoy o una tarea vencida
**THEN** system **SHALL** mostrar **un único** aviso con el Resumen del día
(nunca un aviso por tarea), guardar Hoy como `ultimoAviso` de esa franja, y
mostrarlo como notificación del sistema si la pestaña está oculta y el permiso
está concedido, o como aviso dentro de la app en cualquier otro caso.

### RN-03 — Recordatorio perdido al abrir la app

**WHEN** el usuario abre la app o vuelve a la pestaña
**IF** una o más franjas configuradas tienen una hora ya pasada Hoy, su
`ultimoAviso` es distinto de Hoy y existe al menos una tarea abierta de Hoy o
una tarea vencida
**THEN** system **SHALL** mostrar **un solo** aviso dentro de la app con el
Resumen del día (aunque se hayan perdido las dos franjas) y guardar Hoy como
`ultimoAviso` de todas esas franjas.

### RN-04 — Eliminación de categorías con tareas

**WHEN** el usuario confirma eliminar una categoría
**IF** la categoría tiene tareas asociadas (en cualquier estado)
**THEN** system **SHALL** exigir elegir otra categoría existente como destino,
mover todas esas tareas a la categoría destino y recién entonces eliminar la
categoría; si el usuario cancela, nada cambia.

### RN-05 — Tareas vencidas siempre visibles

**WHEN** se muestra cualquier vista del calendario que incluya Hoy
**IF** existen tareas vencidas, incluidas las de días o semanas anteriores
**THEN** system **SHALL** mostrar una sección plegable "Vencidas (N)" arriba
del calendario, con esas tareas ordenadas según el criterio de orden activo.

### RN-06 — Señalización de tareas por vencer y vencidas

**WHEN** se muestra una tarea en cualquier vista
**IF** la tarea está por vencer o está vencida
**THEN** system **SHALL** mostrar su título en color naranja con la etiqueta
"Por vencer", o en color rojo con la etiqueta "Vencida", según corresponda,
sin cambiar su estado guardado; las tareas completadas nunca llevan etiqueta
ni color de alerta.

### RN-07 — Aviso de superposición al guardar

**WHEN** el usuario guarda una tarea que pasa todas las validaciones
**IF** su horario se superpone con el de una o más tareas abiertas
**THEN** system **SHALL** guardarla igualmente y mostrar durante 5 segundos un
aviso informativo (no un error ni un diálogo) "Esta tarea comparte horario con
'{título}' ({inicio}–{fin})", nombrando la primera tarea superpuesta y "y N
más" si hay otras.

### RN-08 — Calendario limpio con tareas superpuestas

**WHEN** se dibuja la vista Horas, Día o Semana
**IF** existe un grupo superpuesto de dos o más tareas
**THEN** system **SHALL** dibujar **un solo bloque** a ancho completo, desde el
inicio más temprano hasta el fin más tardío del grupo, que muestre el título de
la tarea de mayor prioridad (desempate: la que empieza antes) y una insignia
"+N" con la cantidad de tareas restantes; al pulsar el bloque **SHALL** abrir
la lista de todas las tareas del grupo, ordenadas según el criterio de orden
activo. Las tareas **nunca** se dibujan lado a lado en columnas angostas.

### RN-09 — Tareas dentro del horario de trabajo

**WHEN** el usuario guarda una tarea (nueva o editada)
**IF** su `fecha` no es un día laboral, su `horaInicio` es anterior a la hora
de entrada o su fin es posterior a la hora de salida
**THEN** system **SHALL** rechazar el guardado y mostrar en línea, según el
caso, "Ese día no está en su horario de trabajo" o "La tarea debe quedar entre
las {entrada} y las {salida}", dejando el calendario y el almacenamiento sin
cambios.

### RN-10 — Un solo cronómetro a la vez

**WHEN** el usuario pulsa "Iniciar" en el cronómetro de una tarea abierta
**IF** otra tarea tiene el cronómetro corriendo
**THEN** system **SHALL** pausar primero el cronómetro de la otra tarea
(sumando el tramo en curso a sus `segundosMedidos`), iniciar el de la tarea
elegida, cambiar su estado a `en_progreso` si estaba `pendiente`, y mostrar el
aviso informativo "Se pausó el cronómetro de '{título de la otra tarea}'".

### RN-11 — Pausa automática del cronómetro olvidado

**WHEN** la app arranca, vuelve a ser visible o completa su evaluación de cada
minuto (RF-REC-01)
**IF** una tarea tiene el cronómetro corriendo y Ahora ya pasó el límite del
cronómetro — la hora de salida del día en que se inició, si se inició en un día
laboral antes de esa hora; o las 24:00 de ese día en cualquier otro caso
**THEN** system **SHALL** pausarlo sumando a `segundosMedidos` solo el tiempo
transcurrido hasta ese límite, y mostrar el aviso informativo "El cronómetro de
'{título}' se pausó solo al terminar su jornada".

### RN-12 — Meta sugerida para tareas repetidas

**WHEN** el usuario termina de escribir el título en el formulario de nueva
tarea
**IF** existen tareas completadas con el mismo título (texto normalizado) y con
al menos 60 segundos medidos
**THEN** system **SHALL** calcular el promedio del tiempo medido de las últimas
3 de ellas (o de las que haya, si son menos), redondeado al minuto, mostrar
"Las últimas {N} veces le tomó en promedio {X h Y min}" y escribir ese valor en
la meta de tiempo solo si el usuario todavía no la modificó; el usuario puede
cambiarla.

---

## 5. Requisitos funcionales

### 5.1 Primer uso (RF-INI)

El primer uso tiene tres pasos, en este orden: **nombre y horario de trabajo →
tareas → recordatorios**. El paso actual se guarda en
`preferencias.pasoPrimerUso`, de modo que recargar la página (F5) retoma el
mismo paso.

- **RF-INI-01** — **WHEN** la app arranca **IF** la clave `do-it:v1` no
  existe en LocalStorage **THEN** system **SHALL** mostrar la pantalla de
  bienvenida con el campo "Ingrese su nombre" y el bloque "¿Cuál es su horario
  de trabajo?" (casillas de lunes a domingo, hora de entrada y hora de
  salida), todo vacío.
- **RF-INI-02** — **WHEN** el usuario confirma la bienvenida **IF** el nombre
  queda vacío después de quitar espacios o supera 40 caracteres **THEN**
  system **SHALL** mostrar en línea "El nombre es obligatorio" o "Máximo 40
  caracteres" y no avanzar.
- **RF-INI-03** — **WHEN** el usuario confirma la bienvenida **IF** no marcó
  ningún día, falta la hora de entrada o de salida, o la salida no es
  posterior a la entrada **THEN** system **SHALL** mostrar en línea "Marque al
  menos un día", "Indique la hora de entrada", "Indique la hora de salida" o
  "La salida debe ser después de la entrada", según el caso, y no avanzar.
- **RF-INI-04** — **WHEN** el usuario confirma una bienvenida válida, system
  **SHALL** guardar el estado inicial (nombre, horario de trabajo, categoría de
  RF-CAT-01, ambas franjas en "Ninguno" y `pasoPrimerUso = 'tareas'`) y
  mostrar el paso "Agregue sus tareas".
- **RF-INI-05** — **WHILE** `pasoPrimerUso` es `'tareas'`, system **SHALL**
  mostrar el formulario de tarea (RF-UI-02), la lista de tareas ya agregadas en
  este paso, y dos botones: "Continuar" y "Lo hago después". Cada tarea se
  valida y guarda igual que en RF-TAR.
- **RF-INI-06** — **WHEN** el usuario pulsa "Continuar" o "Lo hago después",
  system **SHALL** guardar `pasoPrimerUso = 'recordatorios'` y mostrar el paso
  "¿A qué hora quiere recibir sus recordatorios?" con dos casillas de hora
  opcionales ("Primer recordatorio" y "Segundo recordatorio"), aplicando
  RF-AJU-04 y RF-AJU-05.
- **RF-INI-07** — **WHEN** el usuario confirma el paso de recordatorios **IF**
  las validaciones se cumplen **THEN** system **SHALL** guardar las horas
  (casilla vacía = "Ninguno"), guardar `pasoPrimerUso = 'completo'` y mostrar
  la sección "Calendario" en la vista Día de Hoy.
- **RF-INI-08** — **WHILE** `pasoPrimerUso` es `'completo'`, system **SHALL**
  mostrar "Hola, {nombre}" en el encabezado de la app.

### 5.2 Tareas (RF-TAR)

- **RF-TAR-01** — **WHEN** el usuario guarda una tarea **IF** el título queda
  vacío después de quitar espacios **THEN** system **SHALL** rechazar el
  guardado y mostrar en línea "El título es obligatorio".
- **RF-TAR-02** — **WHEN** el usuario guarda una tarea **IF** el título supera
  100 caracteres o la descripción supera 500 **THEN** system **SHALL** rechazar
  el guardado e indicar en línea el límite del campo.
- **RF-TAR-03** — **WHEN** el usuario guarda una tarea **IF** en la meta de
  tiempo las horas no son un entero entre 0 y 24, los minutos no son un entero
  entre 0 y 59, o el total es menor que 1 minuto o mayor que 24 h **THEN**
  system **SHALL** rechazar el guardado y mostrar en línea "La meta debe estar
  entre 1 minuto y 24 horas". Una casilla vacía cuenta como 0.
- **RF-TAR-04** — **WHEN** el usuario guarda una tarea **IF** la fecha está
  vacía o no es válida **THEN** system **SHALL** rechazar el guardado y mostrar
  en línea "Elija una fecha válida".
- **RF-TAR-05** — **WHEN** el usuario crea una tarea **IF** la fecha es
  anterior a Hoy **THEN** system **SHALL** rechazar el guardado y mostrar en
  línea "La fecha no puede estar en el pasado". (Al **editar** una tarea ya
  vencida se permite conservar su fecha original.)
- **RF-TAR-06** — **WHEN** el usuario guarda una tarea **IF** la hora de inicio
  está vacía o no es una hora válida HH:MM de 24 h **THEN** system **SHALL**
  rechazar el guardado y mostrar en línea "Elija una hora de inicio".
- **RF-TAR-07** — **WHEN** el usuario guarda una tarea **IF** no eligió
  prioridad o categoría **THEN** system **SHALL** rechazar el guardado y marcar
  en línea el campo faltante.
- **RF-TAR-08** — **WHEN** el usuario guarda una tarea **IF** todas las
  validaciones (RF-TAR-01 a 07, RN-01 y RN-09) se cumplen **THEN** system
  **SHALL** persistirla con `metaMinutos = horas × 60 + minutos`, cerrar el
  formulario, mostrar "Tarea guardada" durante 3 segundos y aplicar RN-07.
- **RF-TAR-09** — **WHEN** el usuario marca una tarea como completada **IF** la
  tarea está abierta **THEN** system **SHALL** detener su cronómetro si está
  corriendo (sumando el tramo en curso a `segundosMedidos`), cambiar su estado
  a `completada` y registrar `completadaEn` con el instante actual.
- **RF-TAR-10** — **WHEN** el usuario reabre una tarea completada **IF** al
  reabrirla se generaría un duplicado según RN-01 **THEN** system **SHALL**
  rechazar la acción con el mismo mensaje de RN-01; de lo contrario **SHALL**
  devolverla a `pendiente`, poner `completadaEn` en `null` y conservar sus
  `segundosMedidos`.
- **RF-TAR-11** — **WHEN** el usuario pide eliminar una tarea **IF** confirma
  en el diálogo "¿Eliminar esta tarea? No se puede deshacer." **THEN** system
  **SHALL** eliminarla definitivamente (con su cronómetro); si cancela, nada
  cambia.
- **RF-TAR-12** — **WHILE** una tarea está vencida, system **SHALL** conservar
  su estado guardado (`pendiente` o `en_progreso`) hasta que el usuario la
  complete, la edite o la elimine.

### 5.3 Cronómetro (RF-CRO)

- **RF-CRO-01** — **WHEN** se muestra una tarea abierta, system **SHALL**
  mostrar su tiempo medido en formato "H:MM:SS" y un botón "Iniciar" o
  "Pausar" según si el cronómetro está corriendo. Las tareas completadas
  muestran su tiempo medido sin botón.
- **RF-CRO-02** — **WHEN** el usuario pulsa "Iniciar", system **SHALL** aplicar
  RN-10 y guardar Ahora en `cronometroIniciadoEn`.
- **RF-CRO-03** — **WHEN** el usuario pulsa "Pausar", system **SHALL** sumar a
  `segundosMedidos` los segundos transcurridos desde `cronometroIniciadoEn` y
  poner `cronometroIniciadoEn` en `null`.
- **RF-CRO-04** — **WHILE** una tarea tiene el cronómetro corriendo, system
  **SHALL** mostrar en el encabezado de la app "⏱ {título} {H:MM:SS}",
  actualizado cada segundo, con un botón "Pausar".
- **RF-CRO-05** — **WHEN** la app se cierra o se recarga con un cronómetro
  corriendo, system **SHALL** seguir contando ese tiempo, porque el tiempo se
  calcula desde `cronometroIniciadoEn` y no desde un contador en memoria (sujeto
  a RN-11).
- **RF-CRO-06** — **WHEN** se muestra una tarea completada **IF** tiene al menos
  60 segundos medidos **THEN** system **SHALL** mostrar su meta y su tiempo
  medido juntos ("Meta 1 h 30 min · Real 1 h 45 min").

### 5.4 Categorías (RF-CAT)

- **RF-CAT-01** — **WHEN** se guarda el estado inicial (RF-INI-04), system
  **SHALL** crear la categoría "General" con color `gris`.
- **RF-CAT-02** — **WHEN** el usuario guarda una categoría **IF** el nombre
  queda vacío, supera 40 caracteres o su texto normalizado coincide con el de
  otra categoría **THEN** system **SHALL** rechazar el guardado y mostrar en
  línea el motivo ("El nombre es obligatorio", "Máximo 40 caracteres" o "Ya
  existe una categoría con ese nombre").
- **RF-CAT-03** — **WHEN** el usuario intenta eliminar una categoría **IF** es
  la única categoría existente **THEN** system **SHALL** deshabilitar la acción
  y mostrar "Debe existir al menos una categoría".
- **RF-CAT-04** — **WHEN** el usuario elige el color de una categoría, system
  **SHALL** ofrecer solo los colores de la paleta `COLORES_CATEGORIA`.

### 5.5 Calendario (RF-CAL)

- **RF-CAL-01** — **WHEN** el usuario abre la sección "Calendario", system
  **SHALL** mostrar un selector con tres vistas — **Horas**, **Día** y
  **Semana** — y abrir la vista guardada en `preferencias.vistaPreferida`.
- **RF-CAL-02** — **WHEN** el usuario cambia de vista, system **SHALL**
  guardar la vista elegida en `preferencias.vistaPreferida`.
- **RF-CAL-03 (vista Horas)** — **WHILE** está activa la vista Horas, system
  **SHALL** mostrar desde la hora actual (redondeada hacia abajo al cuarto de
  hora) hasta 3 horas después, en intervalos de 15 minutos, con una línea
  "Ahora" que se actualiza cada minuto.
- **RF-CAL-04 (vista Día)** — **WHILE** está activa la vista Día, system
  **SHALL** mostrar las 24 horas del día elegido en filas de una hora, con
  botones "Día anterior", "Día siguiente" y "Hoy"; si el día es Hoy, la vista
  **SHALL** abrirse desplazada a la hora actual.
- **RF-CAL-05 (vista Semana)** — **WHILE** está activa la vista Semana, system
  **SHALL** mostrar siete columnas (lunes a domingo) divididas por horas, con
  botones "Semana anterior", "Semana siguiente" y "Hoy".
- **RF-CAL-06** — **WHEN** se dibuja el calendario, system **SHALL** mostrar
  sombreadas las horas fuera de la jornada y los días no laborales.
- **RF-CAL-07** — **WHEN** se dibuja una tarea en cualquier vista, system
  **SHALL** ubicarla según su horario, con una altura proporcional a su meta de
  tiempo, mostrando título, hora de inicio y fin, prioridad (con color e
  icono, no solo color), categoría y cronómetro (RF-CRO-01), además de la
  señalización de RN-06.
- **RF-CAL-08** — **WHEN** se muestra la vista Día o Semana, system **SHALL**
  mostrar la suma de las metas de tiempo de las tareas abiertas de cada día (y
  de la semana completa en la vista Semana), en formato "X h Y min".
- **RF-CAL-09** — **WHEN** el usuario pulsa un espacio vacío del calendario
  **IF** el espacio está dentro de la jornada **THEN** system **SHALL** abrir el
  formulario de nueva tarea con la fecha y la hora de inicio de ese espacio ya
  completadas; en un espacio sombreado no **SHALL** pasar nada.
- **RF-CAL-10** — **WHEN** se muestra el calendario **IF** el usuario no tiene
  ninguna tarea **THEN** system **SHALL** mostrar el mensaje "Todavía no tiene
  tareas" con el botón "+ Agregar mi primera tarea".
- **RF-CAL-11** — **WHEN** el usuario elige un criterio de orden **IF** el
  criterio es `prioridad`, `fecha` o `meta` **THEN** system **SHALL** ordenar
  así las listas de tareas (sección "Vencidas" de RN-05 y lista de un grupo
  superpuesto de RN-08), y guardar el criterio en
  `preferencias.ordenPreferido`. En la cuadrícula del calendario las tareas
  siempre se ubican por horario.

  | Criterio | Orden principal | 1.er desempate | 2.º desempate |
  |---|---|---|---|
  | `prioridad` | alta → media → baja | fecha y hora más cercanas | creación más antigua |
  | `fecha` | fecha y hora más cercanas | prioridad más alta | creación más antigua |
  | `meta` | meta de tiempo más corta | prioridad más alta | creación más antigua |

- **RF-CAL-12** — **WHEN** el usuario aplica un filtro por categoría o por
  estado **IF** ninguna tarea del período visible cumple el filtro **THEN**
  system **SHALL** mostrar "No hay tareas que coincidan" y un botón "Quitar
  filtros".

### 5.6 Ajustes: nombre, horario y recordatorios (RF-AJU)

- **RF-AJU-01** — **WHEN** el usuario abre la sección "Ajustes", system
  **SHALL** mostrar su nombre, su horario de trabajo y las dos casillas de
  recordatorio con la hora guardada, o vacías con el texto "Ninguno" si la
  franja no está configurada.
- **RF-AJU-02** — **WHEN** el usuario guarda un nuevo nombre o un nuevo horario
  de trabajo, system **SHALL** aplicar las validaciones de RF-INI-02 y
  RF-INI-03.
- **RF-AJU-03** — **WHEN** el usuario guarda un nuevo horario de trabajo **IF**
  hay tareas abiertas que quedan fuera del nuevo horario **THEN** system
  **SHALL** guardar el horario, conservar esas tareas sin cambios y mostrar el
  aviso informativo "{N} tareas quedan fuera de su nuevo horario. Ajústelas
  cuando las edite."
- **RF-AJU-04** — **WHEN** el usuario guarda los recordatorios **IF** una
  casilla no está vacía y su valor no es una hora válida HH:MM de 24 h
  **THEN** system **SHALL** rechazar el guardado y mostrar en línea "Hora
  inválida". Una casilla vacía **SHALL** guardarse como `null` ("Ninguno").
- **RF-AJU-05** — **WHEN** el usuario guarda los recordatorios **IF** las dos
  casillas tienen la misma hora **THEN** system **SHALL** rechazar el guardado
  y mostrar "Los dos recordatorios no pueden tener la misma hora".
- **RF-AJU-06** — **WHEN** el usuario cambia la hora de una franja **IF** la
  nueva hora es posterior a la hora actual **THEN** system **SHALL** poner su
  `ultimoAviso` en `null`, para que esa franja pueda avisar Hoy.
- **RF-AJU-07** — **WHEN** el usuario guarda una hora en una franja que estaba
  en "Ninguno" **IF** el navegador soporta notificaciones y el permiso está en
  estado `default` **THEN** system **SHALL** solicitar el permiso de
  notificaciones.
- **RF-AJU-08** — **WHEN** el usuario guarda una hora en una franja **IF** el
  permiso está denegado o el navegador no soporta notificaciones **THEN**
  system **SHALL** guardar la hora igualmente y mostrar "Los recordatorios
  aparecerán solo dentro de la app".

### 5.7 Evaluación periódica (RF-REC)

- **RF-REC-01** — **WHILE** la app está abierta, system **SHALL** evaluar RN-02
  y RN-11 una vez por minuto y también cada vez que la pestaña vuelve a ser
  visible.
- **RF-REC-02** — **WHEN** llega la hora de una franja **IF** no hay tareas
  abiertas de Hoy ni tareas vencidas **THEN** system **SHALL** no mostrar
  ningún aviso y no modificar `ultimoAviso`.

### 5.8 Persistencia (RF-PER)

- **RF-PER-01** — **WHEN** se crea, edita o elimina cualquier entidad o
  preferencia, o se inicia o pausa un cronómetro, **IF** la operación fue
  válida **THEN** system **SHALL** guardar el estado completo en LocalStorage
  bajo la clave `do-it:v1` antes de actualizar la interfaz.
- **RF-PER-02** — **WHEN** la app arranca **IF** la clave `do-it:v1` no
  existe **THEN** system **SHALL** iniciar el primer uso (RF-INI-01); **IF**
  existe y `pasoPrimerUso` no es `'completo'` **THEN** system **SHALL**
  retomar ese paso.
- **RF-PER-03** — **WHEN** la app arranca **IF** el contenido guardado no es
  JSON válido, no tiene `version: 1`, alguna tarea apunta a una categoría
  inexistente o más de una tarea tiene el cronómetro corriendo **THEN** system
  **SHALL** no sobrescribir los datos guardados, mostrar "No se pudieron leer
  sus datos" y ofrecer el botón "Restablecer datos", que solo borra tras una
  confirmación explícita.
- **RF-PER-04** — **WHEN** el sistema intenta guardar **IF** LocalStorage lanza
  un error (por ejemplo, espacio lleno) **THEN** system **SHALL** descartar el
  cambio en memoria, dejar la interfaz como estaba antes de la acción y mostrar
  "No se pudo guardar. Sus datos anteriores siguen intactos."
- **RF-PER-05** — **WHEN** el usuario recarga la página (F5) **IF** los datos
  se guardaron correctamente **THEN** system **SHALL** mostrar exactamente el
  mismo nombre, horario, categorías, tareas, cronómetros, preferencias y paso
  del primer uso.

### 5.9 Interfaz (RF-UI)

- **RF-UI-01** — La navegación principal **SHALL** tener exactamente tres
  secciones: **Calendario**, **Categorías** y **Ajustes** (nombre, horario de
  trabajo y recordatorios).
- **RF-UI-02** — **WHEN** el usuario pulsa "Nueva tarea", system **SHALL**
  abrir un formulario con, en este orden: título, fecha, hora de inicio, "¿En
  cuánto tiempo se propone terminarla?" (casillas de horas y minutos),
  prioridad, categoría y descripción (opcional).
- **RF-UI-03** — **WHEN** el formulario tiene errores, system **SHALL** poner
  el foco en el primer campo inválido.
- **RF-UI-04** — La interfaz **SHALL** poder usarse con teclado y en pantallas
  desde 360 px de ancho sin desplazamiento horizontal de la página (la vista
  Semana puede desplazarse horizontalmente dentro de su propio contenedor).
- **RF-UI-05** — Todos los textos de la interfaz **SHALL** tratar al usuario de
  **usted**.

### 5.10 Estilo visual (RF-EST)

Basado en la referencia visual aportada por el cliente (planificador semanal
minimalista de fondo negro), adaptada a la cuadrícula de horas de esta app.
Los wireframes están en el lienzo
[Do It — Wireframes](https://claude.ai/artifact/MRYwG8ndzKNhKDxhsibYgp).

- **RF-EST-01** — La interfaz **SHALL** usar tema oscuro: fondo negro, texto
  blanco, líneas divisorias finas en gris, sin sombras ni tarjetas con borde.
- **RF-EST-02** — El encabezado del calendario **SHALL** mostrar el mes y el año
  en tipografía grande y gruesa, seguidos del número de semana ISO en gris
  ("Octubre 2026 S43"), y a la derecha los botones redondos de navegación.
- **RF-EST-03** — Cada columna de día **SHALL** tener como encabezado la fecha
  en negrita a la izquierda ("23 oct") y el nombre corto del día en gris a la
  derecha ("Vie"), subrayados por una línea blanca.
- **RF-EST-04** — El día de Hoy **SHALL** mostrar su encabezado y su línea en
  azul.
- **RF-EST-05** — Las etiquetas de categoría **SHALL** mostrarse como píldoras
  de color tipo resaltador (fondo del color de la categoría, texto negro).
- **RF-EST-06** — Un bloque de tarea **SHALL** tener fondo gris muy oscuro,
  el título en blanco (salvo la señalización de RN-06) y su categoría como
  píldora de RF-EST-05, para mantener legible el texto sobre fondo negro.

---

## 6. Casos de borde (resumen verificable)

| # | Entrada o situación | Resultado esperado | Requisito |
|---|---|---|---|
| CB-01 | Título vacío o solo espacios | Error en línea; nada se guarda | RF-TAR-01 |
| CB-02 | Meta: horas `-1`, minutos `75`, `1.5` o `abc` | Error en línea; nada se guarda | RF-TAR-03 |
| CB-03 | Meta: 0 h 0 min, o 24 h 30 min | Error en línea; nada se guarda | RF-TAR-03 |
| CB-04 | Hora de inicio vacía | Error en línea; nada se guarda | RF-TAR-06 |
| CB-05 | Horario 8:00–17:00; tarea a las 7:30 | Error "debe quedar entre las 08:00 y las 17:00" | RN-09 |
| CB-06 | Horario 8:00–17:00; tarea 16:00 con meta de 2 h | Error "debe quedar entre las 08:00 y las 17:00" | RN-09 |
| CB-07 | Horario 8:00–17:00; tarea 15:00 con meta de 2 h (termina 17:00) | Se permite | RN-09 |
| CB-08 | Tarea un sábado y el sábado no es laboral | Error "Ese día no está en su horario de trabajo" | RN-09 |
| CB-09 | "Informe" ya existe abierta esta semana y se crea "  INFORME " | Error de duplicado | RN-01 |
| CB-10 | "Informe" existe pero está completada | Se permite crear | RN-01 |
| CB-11 | "Informe" existe en otra semana | Se permite crear | RN-01 |
| CB-12 | Fecha de ayer al crear | Error en línea | RF-TAR-05 |
| CB-13 | Nueva tarea 9:00–10:00 y ya existe una 9:30–11:00 | Se guarda + aviso informativo de superposición | RN-07 |
| CB-14 | Tres tareas superpuestas el mismo día | Un solo bloque con la de mayor prioridad y "+2" | RN-08 |
| CB-15 | Tarea 9:00–10:00 y otra 10:00–11:00 | No se superponen; dos bloques separados | RN-08 |
| CB-16 | Cronómetro de A corriendo y se inicia el de B | A se pausa (con su tiempo sumado), B corre, aviso informativo | RN-10 |
| CB-17 | Cronómetro iniciado a las 16:00 en día laboral (salida 17:00); la app se abre al día siguiente | Se pausó a las 17:00: suma 1 h, no la noche entera | RN-11 |
| CB-18 | Cronómetro iniciado un sábado no laboral a las 10:00; se abre el lunes | Se pausó a las 24:00 del sábado: suma 14 h | RN-11 |
| CB-19 | Cronómetro corriendo y F5 | Sigue contando sin perder tiempo | RF-CRO-05 |
| CB-20 | Completar una tarea con el cronómetro corriendo | Se detiene y suma el tramo; queda `completada` | RF-TAR-09 |
| CB-21 | "Informe semanal" completada 3 veces con 1:10, 1:20 y 1:30 medidos | Sugerencia "en promedio 1 h 20 min" y meta prellenada | RN-12 |
| CB-22 | Tarea repetida completada sin usar el cronómetro (0 s) | No cuenta para el promedio | RN-12 |
| CB-23 | El usuario escribe la meta y luego el título de una tarea repetida | Se muestra la sugerencia pero no se sobrescribe la meta | RN-12 |
| CB-24 | Categoría con nombre duplicado ("trabajo" vs "Trabajo") | Error en línea | RF-CAT-02 |
| CB-25 | Eliminar la única categoría | Acción deshabilitada | RF-CAT-03 |
| CB-26 | Eliminar categoría con 5 tareas | Se pide categoría destino | RN-04 |
| CB-27 | Los dos recordatorios a las 08:00 | Error; configuración no cambia | RF-AJU-05 |
| CB-28 | Las dos casillas de recordatorio vacías | Se guarda; ambas muestran "Ninguno" y nunca avisan | RF-AJU-04 |
| CB-29 | Llega la hora y no hay tareas para hoy | Ningún aviso | RF-REC-02 |
| CB-30 | App cerrada a la hora de los dos recordatorios; se abre después | Un solo aviso dentro de la app | RN-03 |
| CB-31 | Permiso de notificaciones denegado | Avisos solo dentro de la app | RF-AJU-08 |
| CB-32 | Nombre vacío en la bienvenida | Error en línea; no avanza | RF-INI-02 |
| CB-33 | Bienvenida sin días marcados, o salida 08:00 y entrada 17:00 | Error en línea; no avanza | RF-INI-03 |
| CB-34 | Se cambia el horario a 9:00–15:00 con 4 tareas a las 16:00 | Se guarda; aviso "4 tareas quedan fuera"; tareas intactas | RF-AJU-03 |
| CB-35 | F5 durante el paso "Agregue sus tareas" | Vuelve al mismo paso con las tareas ya agregadas | RF-PER-02 |
| CB-36 | Tarea abierta de mañana | Título naranja + "Por vencer" | RN-06 |
| CB-37 | Tarea abierta de hoy 8:00–9:00 y son las 9:30 | Título rojo + "Vencida"; estado sigue `pendiente` | RN-06, RF-TAR-12 |
| CB-38 | Tarea completada cuyo horario ya pasó | Sin color de alerta ni etiqueta | RN-06 |
| CB-39 | JSON corrupto o dos cronómetros corriendo en LocalStorage | Mensaje de error; datos no se sobrescriben | RF-PER-03 |
| CB-40 | LocalStorage lleno al guardar | Mensaje de error; estado anterior intacto | RF-PER-04 |

## 7. Limitaciones conocidas (decisiones explícitas)

- **Notificaciones con la app cerrada:** una app sin servidor no puede
  programar notificaciones con la pestaña cerrada. Por eso existe RN-03 (aviso
  al abrir la app). Esta limitación es aceptada por el cliente y **no debe
  intentar resolverse** con servicios externos.
- **Cronómetro olvidado:** si el usuario olvida pausar el cronómetro dentro de
  su jornada, se cuenta tiempo de más hasta la hora de salida (RN-11 solo
  corta al final de la jornada).
- **Un navegador, un usuario:** los datos no se sincronizan entre dispositivos
  ni navegadores.

## 8. Fuera de alcance

No se implementa nada de lo siguiente salvo que se agregue primero a este
documento:

- Cuentas, login o varios usuarios.
- Backend, API, servicios en la nube o notificaciones push.
- Vista de mes.
- Tareas sin fecha ni hora (sección "Algún día").
- Arrastrar y soltar tareas en el calendario, o cambiar su tamaño con el mouse.
- Horario de trabajo distinto para cada día, o jornadas que cruzan la
  medianoche.
- Tareas recurrentes que se crean solas (las tareas repetidas se crean a mano y
  la app solo sugiere la meta, RN-12).
- Editar a mano el tiempo medido por el cronómetro.
- Subtareas, etiquetas o adjuntos.
- Exportar o importar datos.
- Más de dos franjas de recordatorio.

## 9. Historial de cambios

| Versión | Cambio | Origen |
|---|---|---|
| 0.1 | Borrador inicial. | Propuesta del equipo. |
| 0.2 | Pantalla de primer uso con nombre del usuario (RF-INI). | Pedido del cliente. |
| 0.2 | Recordatorios sin hora por defecto: casilla vacía = "Ninguno". Se elimina el campo `activo`. | Pedido del cliente. |
| 0.2 | Nueva regla RN-06: tareas por vencer en naranja y vencidas en rojo. | Pedido del cliente. |
| 0.2 | "Duración estimada" pasa a ser "meta de tiempo", ingresada en horas y minutos. | Pedido del cliente. |
| 0.2 | La sección "Recordatorios" pasa a llamarse "Ajustes" e incluye el nombre. | Consecuencia del primer uso. |
| 0.2 | La bienvenida dice "Ingrese su nombre". | Pedido del cliente. |
| 0.3 | Toda la app trata al usuario de "usted". | Pedido del cliente. |
| 0.3 | La lista semanal pasa a ser un calendario con vistas Horas (próximas 3 h), Día y Semana (RF-CAL). | Pedido del cliente. |
| 0.3 | Hora de inicio obligatoria; `fechaLimite` pasa a llamarse `fecha`. "Vencida" se calcula con el fin del horario. | Consecuencia del calendario. |
| 0.3 | Primer uso en tres pasos: nombre → tareas (se puede saltar) → recordatorios. El paso se guarda para sobrevivir a F5. | Pedido del cliente. |
| 0.3 | Nuevas reglas RN-07 y RN-08: superposiciones permitidas, con aviso informativo y un solo bloque "+N" para no saturar el calendario. | Pedido del cliente (problema con Google Calendar). |
| 0.3 | Mensaje para calendario vacío (RF-CAL-10). | Propuesta del equipo. |
| 0.4 | Una tarea vencida sigue pendiente hasta que el usuario la complete (RF-TAR-12, principio 6). | Pedido del cliente. |
| 0.4 | Horario de trabajo obligatorio (días + entrada/salida) en la bienvenida; las tareas deben quedar dentro de él (RN-09). | Pedido del cliente. |
| 0.4 | Horas fuera de la jornada sombreadas en el calendario (RF-CAL-06). | Consecuencia de RN-09. |
| 0.4 | Cronómetro por tarea, uno a la vez, con pausa automática al final de la jornada (RF-CRO, RN-10, RN-11). | Pedido del cliente. |
| 0.4 | Meta sugerida a partir del tiempo medido en tareas repetidas (RN-12). | Pedido del cliente. |
| 0.4 | Los recordatorios pasan a la sección RF-AJU junto con nombre y horario. | Reorganización del documento. |
| 0.5 | Estilo visual basado en la referencia del cliente, adaptado a cuadrícula de horas en todas las vistas (RF-EST). De la referencia se descartan "Algún día" (tareas sin fecha) y arrastrar tareas. | Pedido del cliente. |
| 0.6 | La aplicación se llama **Do It** (antes "Mi Semana", nombre provisional). La clave de LocalStorage pasa a `do-it:v1`. | Pedido del cliente. |
