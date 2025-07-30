# Aweyt - Sistema de Gestión de Turnos

Aweyt es una aplicación web moderna para la gestión de colas y turnos, diseñada para mejorar la eficiencia y la experiencia del cliente en cualquier negocio.

## Características Principales

- **Gestión de Múltiples Empresas:** El sistema está diseñado para que un Super Administrador pueda gestionar licencias para múltiples empresas.
- **Roles de Usuario:** Soporta roles de Super Administrador, Administrador de empresa y Empleado, cada uno con sus permisos específicos.
- **Paneles Personalizados:** Cada rol tiene un dashboard adaptado a sus funciones.
- **Gestión de Turnos:** Creación y gestión de departamentos, servicios y tickets.
- **Vista de Cliente:** Interfaz pública para que los clientes generen sus tickets.
- **Pantalla Pública:** Visualización en tiempo real de los turnos llamados y en espera.
- **Personalización:** Configuración de logos, mensajes y multimedia para las pantallas públicas de cada empresa.
- **Reportes y Estadísticas:** Módulos para visualizar el historial y las métricas de rendimiento.

## Despliegue

Este proyecto fue creado con Vite y React. Para desplegarlo, sigue estos pasos:

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Construir para producción:**
    ```bash
    npm run build
    ```
    Este comando generará una carpeta `dist` con todos los archivos estáticos optimizados para producción.

3.  **Servir los archivos:**
    Sube el contenido de la carpeta `dist` a tu proveedor de hosting (como Grupo Bieco). Asegúrate de configurar tu servidor para que todas las rutas de la aplicación (ej. `/customer/mi-empresa`) redirijan al archivo `index.html`. Esto es crucial para que el enrutamiento del lado del cliente de React Router funcione correctamente.

    Si usas un servidor como Nginx, una configuración similar a esta podría ser necesaria:
    ```nginx
    location / {
      try_files $uri $uri/ /index.html;
    }
    ```

## Buenas Prácticas

- **Variables de Entorno:** Para la futura integración con Supabase, es fundamental utilizar variables de entorno (archivos `.env`) para almacenar las claves de API y URLs. No las incluyas directamente en el código.
- **Seguridad:** La gestión de contraseñas se realiza con `bcrypt.js`. Asegúrate de que cualquier nueva lógica de autenticación siga las mejores prácticas de seguridad.
- **Migración de Datos:** El sistema actualmente usa `localStorage`. Antes de pasar a producción, es altamente recomendable migrar los datos a una base de datos persistente como Supabase. Utiliza el archivo `MIGRACION_SUPABASE.md` como guía.
- **Copias de Seguridad:** Utiliza la función de "Exportar Datos" en el panel del Super Administrador regularmente para crear copias de seguridad de tu información, especialmente antes de realizar cambios importantes.