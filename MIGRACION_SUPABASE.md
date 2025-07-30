# Plan de Migración de `localStorage` a Supabase

Este documento describe los pasos y la estructura de tablas recomendada para migrar el sistema Aweyt de `localStorage` a una base de datos persistente en Supabase.

## Pasos para la Migración

1.  **Configurar el Proyecto en Supabase:**
    *   Crea un nuevo proyecto en [Supabase](https://supabase.com/).
    *   Ve a la sección "SQL Editor" y utiliza los scripts de abajo para crear las tablas.
    *   Obtén la URL del proyecto y la `anon key` desde la configuración de API de tu proyecto en Supabase.

2.  **Integrar el Cliente de Supabase en React:**
    *   Instala el cliente de Supabase: `npm install @supabase/supabase-js`.
    *   Crea un archivo de utilidad (ej. `src/lib/supabaseClient.js`) para inicializar el cliente de Supabase usando las variables de entorno.
        ```javascript
        // src/lib/supabaseClient.js
        import { createClient } from '@supabase/supabase-js';

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

        export const supabase = createClient(supabaseUrl, supabaseAnonKey);
        ```
    *   Asegúrate de crear un archivo `.env` en la raíz de tu proyecto con tus claves.

3.  **Refactorizar la Lógica de Datos:**
    *   Reemplaza todas las llamadas a `localStorage.getItem` y `localStorage.setItem` con consultas a Supabase.
    *   **Ejemplo:** En lugar de `JSON.parse(localStorage.getItem('aweyt_companies'))`, usarías `const { data, error } = await supabase.from('companies').select('*');`.
    *   Adapta los hooks y contextos (`AuthContext`, `QueueContext`, `useQueueSystem`) para que realicen operaciones asíncronas con Supabase.

4.  **Adaptar la Autenticación:**
    *   Reemplaza la lógica de `bcrypt.js` con el sistema de autenticación de Supabase (`supabase.auth.signInWithPassword`, `supabase.auth.signUp`).
    *   La tabla `users` se puede vincular con la tabla `auth.users` de Supabase a través de los IDs de usuario.

## Estructura de Tablas Recomendada

Aquí tienes los scripts SQL para crear las tablas en Supabase.

### Tabla `companies`
Almacena la información de cada empresa licenciada.

```sql
CREATE TABLE companies (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo TEXT, -- URL al logo en Supabase Storage
  license_start_date DATE NOT NULL,
  license_expiry_date DATE NOT NULL,
  payment_frequency TEXT, -- 'monthly' o 'annually'
  total_cost NUMERIC(10, 2),
  currency TEXT,
  status TEXT, -- 'activo', 'inactivo', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla `users`
Almacena los perfiles de los usuarios, vinculados a la autenticación de Supabase.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL, -- 'admin', 'employee'
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  department_id BIGINT, -- Se vinculará más adelante
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB -- Para almacenar permisos específicos
);
```

### Tabla `departments`
Departamentos de cada empresa.

```sql
CREATE TABLE departments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  average_time_minutes INT DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Añadir la referencia en la tabla de usuarios
ALTER TABLE users ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
```

### Tabla `services`
Servicios ofrecidos por cada departamento.

```sql
CREATE TABLE services (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  avg_time_minutes INT DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla `tickets`
El corazón del sistema, almacena cada ticket generado.

```sql
CREATE TABLE tickets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  number TEXT NOT NULL,
  customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'called', 'serving', 'completed', 'cancelled', 'redirected'
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  served_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  redirected_from_dept_name TEXT
);
```