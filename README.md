# Trabajo Final Integrador

> Este README es un documento vivo: se irá actualizando y completando a medida que el equipo avance en el desarrollo del proyecto.

---

## 1. Justificación del stack elegido

| Capa / Componente | Tecnología | Justificación |
|---|---|---|
| Frontend / App móvil | React Native + Expo + NativeWind v5 (Android) | Expo agiliza el desarrollo y build para Android sin configuración nativa manual. NativeWind v5 permite estilizar con la sintaxis de Tailwind CSS v4 (`className`), acelerando el desarrollo de la UI. |
| Backend / API | _(a completar)_ | _(a completar)_ |
| Base de datos | _(a completar)_ | _(a completar)_ |
| Notificaciones push | _(a completar)_ | _(a completar)_ |
| Envío de correos automáticos | _(a completar)_ | _(a completar)_ |
| Lectura/generación de código QR | _(a completar)_ | _(a completar)_ |
| Autenticación / perfiles | _(a completar)_ | _(a completar)_ |
| Otros | _(a completar)_ | _(a completar)_ |

---

## 2. Planificación por Sprints

Cada semana representa un sprint. Por cada sprint se detalla la tabla de tareas del equipo con:

1. Apellidos y nombres
2. Módulos (objetivos) a desarrollar
3. Fecha de inicio de la tarea
4. Fecha de finalización de la tarea
5. Branch (si posee)

---

### Sprint 1 — Sábado 05 de septiembre
**Alcance:** Requisitos 1, 2, 3, 4, 5, 6 (Agregar empleado / Agregar plato / Agregar bebida / Agregar mesa / Crear un cliente registrado / Verificar ingreso del cliente registrado)

| Apellidos y nombres | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
|---|---|---|---|---|
| Delgobbo Giuliana | Módulos 1 y 5 | 23/8 | 2/9 | Delgobbo |
| Gómez Facundo | Módulos 4 y 6 | 30/8 | | Gomez |
| Jauregui Enzo  | Módulo 2 y 3 | 30/8 | | Jauregui |
| Almonacid Emir | Base de datos Supabase | 30/8 | | Almonacid |

---

### Sprint 2 — Sábado 12 de septiembre
**Alcance:** Requisitos 7, 8, 9 (Rechazo de cliente / Aceptación de cliente / Ingreso como cliente anónimo)

| Apellidos y nombres | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
|---|---|---|---|---|
| Gomez Facundo| 4 y 6  | 30/08 | | Gomez | 
|Delgobbo Giuliani | 1 y 5|30/08 | | Delgobbo |
| Enzo Jauregui| 2 y 3| 30/08| | Jauregui|
| Emir Almonacid | BD | 30/08| | Almonacid|

---

### Sprint 3 — Sábado 19 de septiembre
**Alcance:** Requisitos 10, 11, 12 (Asignación de mesa / Listado de productos y consulta al mozo / Pedido del cliente)

| Apellidos y nombres | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

---

### Sprint 4 — Sábado 26 de septiembre
**Alcance:** Requisitos 10, 11, 12 (Asignación de mesa / Listado de productos y consulta al mozo / Pedido del cliente)

| Apellidos y nombres | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

---

### Sprint 5 — Sábado 03 de octubre
**Alcance:** Requisitos 13, 14, 15 (Rechazo/confirmación del pedido por el mozo / Juegos y descuentos)

| Apellidos y nombres | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

> **Nota:** Mínimo de puntos aprobados requerido para poder realizar la entrega en primera fecha.

---

### Sprint 6 — Sábado 10 de octubre
**Alcance:** Requisitos 16, 17, 18 (Sector cocina / Sector bar / Aviso de pedido completo)

| Apellidos y nombres | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

---

### Sprint 7 — Sábado 17 de octubre
**Alcance:** Requisitos 19, 20, 21, 22 (Entrega del pedido / Encuesta / Solicitud de cuenta / Confirmación de pago y liberación de mesa)

| Apellidos y nombres | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

---

## 3. Índice de imágenes del proyecto

Índice de **todas y cada una** de las imágenes asociadas al proyecto (íconos, pantallas de presentación/splash, formularios, listados, logos, capturas de pantalla, etc.), para que cualquier miembro del equipo pueda ubicar rápidamente el recurso visual correspondiente.

| # | Nombre / Descripción | Categoría | Pantalla / Módulo asociado | Ruta / Archivo | Vista previa |
|---|---|---|---|---|---|
| 1 | Ícono de la app | Ícono | - | `assets/icon.png` | ![Splash Icon](https://i.ibb.co/KzF1wn8X/splash-icon.png) |
| 2 | | Splash / Presentación | | | |
| 3 | | Formulario Login | Pantalla | | ![Formulario Login](https://i.ibb.co/mrX3NkKT/Login.png) |
| 4 | | Formulario Registro | Pantalla | | ![Formulario Login](https://i.ibb.co/Gf3dnjWD/Registro.png) |
| 5 | | Listado | | | |
| 6 | Logo principal | Logo | - | `assets/logo.png` | ![Logo](https://i.ibb.co/S40PN8VX/Logo.png) |
| 7 | Landing Page | Pantalla | HomeScreen | `assets/images/Landing-Page.png` | ![Landing Page](https://i.postimg.cc/9Q7B64wJ/Landing-Page.png) |
| 8 | Ingreso Invitado | Pantalla | Pantalla | | ![Ingreso Invitado](https://i.ibb.co/6cMPTwSk/Login-Invitado.png) |

**Categorías:**
- Íconos (app, botones, controles)
- Pantallas de presentación / splash / login
- Formularios (alta de empleado, plato, bebida, mesa, cliente, etc.)
- Listados (pedidos, mesas, clientes en espera, encuestas, etc.)
- Logos / branding (incluye los usados en los correos automáticos)
- Otras (fotos de perfil, fotos de platos/bebidas de ejemplo, códigos QR generados, gráficos de encuestas, etc.)

---

## 4. Estado general del proyecto

> _(Opcional, a completar más adelante: checklist de requisitos entregados, pendientes, bugs conocidos, links de interés, instrucciones de instalación/ejecución, etc.)_
