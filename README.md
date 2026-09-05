# Trabajo Final Integrador

> Este README es un documento vivo: se irá actualizando y completando a medida que el equipo avance en el desarrollo del proyecto.

---

## 1. Justificación del stack elegido

| Capa / Componente | Tecnología | Justificación |
|---|---|---|
| Frontend / App móvil | React Native + Expo + NativeWind v5 (Android) | Expo agiliza el desarrollo y build para Android sin configuración nativa manual. NativeWind v5 permite estilizar con la sintaxis de Tailwind CSS v4 (`className`), acelerando el desarrollo de la UI. |
| Backend / API | _Supabase_ | _Expone automáticamente una API REST y en tiempo real sobre la base de datos, sin necesidad de programar y mantener un servidor propio. Integra en un mismo servicio la base de datos, autenticación, storage de archivos y suscripciones en tiempo real (Realtime), reduciendo el trabajo de un equipo chico a definir el esquema y consumirlo desde la app._ |
| Base de datos | _(a completar)_ | _(a completar)_ |
| Notificaciones push | _Supabase Realtime + expo-notifications (notificaciones locales disparadas por eventos de la base de datos)_ | _Al detectar cambios en tiempo real sobre las tablas (por ejemplo, un nuevo cliente pendiente de aprobación), se dispara una notificación local en el dispositivo del dueño/supervisor sin necesidad de un servidor propio de push._ |
| Envío de correos automáticos | _(a completar)_ | _(a completar)_ |
| Lectura/generación de código QR | _react-native-qrcode-svg (generación)_ | _Librería liviana que renderiza el QR como componente SVG nativo, sin depender de servicios externos de generación de imágenes. Se usa para generar automáticamente el QR de cada mesa al momento del alta._ |
| Autenticación / perfiles | _Supabase Auth + tabla profiles (con campo perfil para el rol)_ | _Maneja registro, login y sesión persistente de forma nativa junto con el resto del backend. Los roles (dueño, supervisor, empleados, cliente registrado) se modelan en la tabla profiles, vinculada al usuario autenticado, y las políticas de RLS restringen qué puede hacer cada rol directamente a nivel de base de datos._ |
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
| Delgobbo Giuliana | Módulos 1 y 5 | 23/8 | 4/9 | Delgobbo |
| Gómez Facundo | Módulos 4 | 30/8 | 4/9| Gomez |
| Jauregui Enzo  | Módulo 2 y 3 | 30/8 | 4/9 | Jauregui |
| Almonacid Emir | Base de datos Supabase | 30/8 |4/9 | Almonacid |

---

### Sprint 2 — Sábado 12 de septiembre
**Alcance:** Requisitos 7, 8, 9 (Rechazo de cliente / Aceptación de cliente / Ingreso como cliente anónimo)

| Apellidos y nombres | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
|---|---|---|---|---|
| Gomez Facundo|   |  | | Gomez | 
|Delgobbo Giuliani | | | | Delgobbo |
| Enzo Jauregui| | | | Jauregui|
| Emir Almonacid |  | | | Almonacid|

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
| 2 | Logo principal | Logo | - | `assets/logo.png` | ![Logo](https://i.ibb.co/S40PN8VX/Logo.png) |
| 3 | | Splash / Presentación | | | ![Splash Screen](https://i.ibb.co/LdmzYF9z/Splash-Screen.png) |
| 4 | | Formulario Login | Pantalla | | ![Formulario Login](https://i.ibb.co/mrX3NkKT/Login.png) |
| 5 | | Formulario Registro | Pantalla | | ![Formulario Login](https://i.ibb.co/Gf3dnjWD/Registro.png) |
| 6 | Landing Page | Pantalla | HomeScreen | `assets/images/Landing-Page.png` | ![Landing Page](https://i.postimg.cc/9Q7B64wJ/Landing-Page.png) |
| 7 | Ingreso Invitado | Pantalla | Pantalla | | ![Ingreso Invitado](https://i.ibb.co/6cMPTwSk/Login-Invitado.png) |
| 8 | Agregar Plato | Listados | Listados | | ![Agregar Plato](https://i.ibb.co/fYZ2NhDd/Agregar-Plato.png) |
| 9 | Agregar Bebida | Listados | Listados | | ![Agregar Bebida](https://i.ibb.co/9kyHmL7r/Agregar-Bebida.png) |
| 10 | Manager Home | Pantalla | Pantalla | | ![Manager Home](https://i.ibb.co/yc8h6CLz/Manager-Home.png) |
| 11 | Agregar Mesa | Pantalla | Pantalla | | ![Agregar Mesa](https://i.ibb.co/Xx8XKjqR/Agregar-Mesa.png) |
| 12 | Listado Mesas | Listados | Listados | | ![Agregar Mesa](https://i.ibb.co/pBvchprp/Listado-Mesas.png) |

**Categorías:**
- Íconos (app, botones, controles)
- Pantallas de presentación / splash / login
- Formularios (alta de empleado, plato, bebida, mesa, cliente, etc.)
- Listados (pedidos, mesas, clientes en espera, encuestas, etc.)
- Logos / branding (incluye los usados en los correos automáticos)
- Otras (fotos de perfil, fotos de platos/bebidas de ejemplo, códigos QR generados, gráficos de encuestas, etc.)

---

## 4. Estado general del proyecto

> _### Estado de los módulos 1 al 6 (primera fecha de entrega)

| # | Módulo | Responsable | Estado |
|---|---|---|---|
| 1 | Agregar un empleado (dispositivo 1) | Delgobbo Giuliana | ✅ Finalizado |
| 2 | Agregar un nuevo plato (dispositivo 2) | Jauregui Enzo | ✅ Finalizado |
| 3 | Agregar una nueva bebida (dispositivo 3) | Jauregui Enzo | ✅ Finalizado|
| 4 | Agregar una nueva mesa (dispositivo 4) | Gómez Facundo | ✅ Finalizado  |
| 5 | Crear un cliente registrado (dispositivo 2) | Delgobbo Giuliana | ✅ Finalizado |




