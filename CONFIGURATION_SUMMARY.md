# 📋 Resumen de Configuración - CodeMio Frontend

Este documento explica todos los archivos de configuración creados para el proyecto frontend.

---

## 📦 Gestión de Dependencias

### `package.json`
**Propósito:** Define las dependencias, scripts y metadatos del proyecto.

**Dependencias principales:**
- React 19.2.4 (Librería de UI)
- React DOM 19.2.4 (Renderizado de React)
- Vite 8.0.0 (Build tool y dev server)
- ESLint 9.39.4 (Linting de código)

**Scripts disponibles:**
- `dev`: Inicia servidor de desarrollo
- `build`: Genera build de producción
- `preview`: Preview del build
- `lint`: Ejecuta ESLint

**Uso:**
```bash
npm ci  # Instalar dependencias
npm run dev  # Desarrollo
npm run build  # Producción
```

---

## 🐳 Archivos Docker

### `Dockerfile`
**Propósito:** Define cómo construir la imagen Docker del frontend.

**Características:**
- **Multi-stage build** para optimizar el tamaño
- **Stage 1 (builder):** Node.js 20 Alpine
  - Instala dependencias con `npm ci`
  - Ejecuta `npm run build`
  - Genera archivos en `dist/`
- **Stage 2 (production):** nginx Alpine
  - Copia archivos del build
  - Configuración nginx para SPA (Single Page Application)
  - Rewrite rules para client-side routing
  - Headers de seguridad
  - Compresión gzip
  - Cache de assets estáticos

**Proceso:**
1. Instala dependencias de Node.js
2. Build de la aplicación React
3. Copia archivos estáticos a nginx
4. Configura nginx para manejar rutas SPA
5. Expone puerto 80

**Uso:**
```bash
docker build -t codemio-frontend .
docker run -p 8080:80 codemio-frontend
```

### `.dockerignore`
**Propósito:** Especifica qué archivos NO deben incluirse en la imagen Docker.

**Archivos excluidos:**
- `node_modules/` (se reinstalan en el build)
- `dist/`, `build/` (se generan en el build)
- `.git/`, `.github/`
- `.env*` (variables de entorno)
- Documentación (`*.md`, `docs/`)
- Archivos de IDE (`.vscode/`, `.idea/`)
- Archivos Docker mismos

**Beneficio:** Reduce el tamaño de la imagen y mejora el tiempo de build.

---

## 🔒 Archivos de Control de Versiones

### `.gitignore`
**Propósito:** Especifica qué archivos NO deben ser rastreados por Git.

**Categorías ignoradas:**
- **Node.js:** `node_modules/`, logs
- **Build:** `dist/`, `dist-ssr/`, `*.local`
- **Variables de entorno:** `.env`, `.env.local`, `.env.*.local`
- **Testing:** `coverage/`, `.nyc_output/`
- **IDE:** `.vscode/`, `.idea/`, `.DS_Store`
- **OS:** `Thumbs.db`
- **Misc:** `*.bak`, `*.tmp`

**Importancia:** Evita subir información sensible o archivos generados al repositorio.

---

## ⚙️ Archivos de Configuración de Entorno

### `.env.example`
**Propósito:** Plantilla de variables de entorno necesarias.

**Variables incluidas:**
- `VITE_API_URL`: URL del API backend (Django)

**Importante:** 
- Variables con prefijo `VITE_` son **públicas** (se incluyen en el build)
- NO incluir secretos o tokens en variables `VITE_*`
- Estas variables están disponibles en `import.meta.env.VITE_*`

**Uso:**
1. Copiar a `.env`: `cp .env.example .env`
2. Editar valores según tu entorno
3. Nunca commitear `.env` al repositorio

**Ejemplos:**
```env
# Desarrollo local
VITE_API_URL=http://localhost:8000/api

# Producción
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 🔄 Archivos de CI/CD

### `.github/workflows/production.yml`
**Propósito:** Define el pipeline de CI/CD con GitHub Actions.

**Jobs configurados:**

#### 1. **test**
- Corre en Ubuntu latest
- Checkout del código
- Setup de Node.js 20 con cache de npm
- Instala dependencias (`npm ci`)
- Ejecuta linting (`npm run lint`)
- Build de la aplicación (`npm run build`)
- Valida que el directorio `dist/` exista

#### 2. **build**
- Solo se ejecuta si `test` pasa exitosamente
- Construye imagen Docker
- Valida que el build de Docker funcione
- Usa cache de GitHub Actions para optimizar

**Triggers:**
- Push a `main`
- Pull requests a `main`

**Beneficios:**
- Validación automática de código antes de merge
- Detección temprana de errores de build
- Garantiza que Docker build funcione
- Feedback rápido en PRs

---

## 📝 Templates de GitHub

### `.github/ISSUE_TEMPLATE/config.yml`
**Propósito:** Configuración del selector de templates de GitHub.

Define:
- Deshabilitación de issues en blanco
- Enlaces de contacto a documentación y discusiones

### `.github/ISSUE_TEMPLATE/task.yml`
**Propósito:** Template para crear tareas de desarrollo frontend.

Incluye:
- **Descripción:** Campo de texto para detallar la tarea
- **Componentes:** Selector de componentes/áreas del frontend
- **Roles:** Selector múltiple del equipo
- **Definition of Done (DoD):** Lista de criterios
- **Prioridad:** Alta, Media, Baja
- **Estimación:** Tiempo estimado
- **Criterios de Aceptación:** Especificaciones
- **Checklist:** UI/UX, accesibilidad, responsive, etc.

### `.github/ISSUE_TEMPLATE/bug_report.yml`
**Propósito:** Template para reportar errores en el frontend.

Incluye:
- **Versión:** Versión del proyecto
- **Navegador:** Chrome, Firefox, Safari, Edge
- **Ambiente:** Desarrollo o Producción
- **URL:** Dónde ocurre el problema
- **Descripción:** Detalle del problema
- **Pasos para Reproducir:** Lista ordenada
- **Comportamiento Esperado vs. Actual**
- **Logs de Consola**
- **Capturas de Pantalla**
- **Severidad:** Crítico, Alto, Medio, Bajo

### `.github/ISSUE_TEMPLATE/feature_request.yml`
**Propósito:** Template para proponer nuevas funcionalidades.

Incluye:
- **Descripción de la Funcionalidad**
- **Problema que Resuelve**
- **Solución Propuesta**
- **Mockups/Diseños** (opcional)
- **Alternativas Consideradas**
- **Prioridad Sugerida**
- **Impacto en UX**

### `.github/pull_request_template.md`
**Propósito:** Template para Pull Requests estandarizados.

**Secciones incluidas:**
- **Versión y Ambiente**
- **Descripción:** Qué hace el PR y por qué
- **Pasos para Probar:** Cómo validar los cambios
- **Issue Relacionado:** Enlaces a issues
- **Capturas/Videos:** Before/After visuals
- **Información Adicional:**
  - Cambios técnicos
  - Nuevas dependencias
  - Variables de entorno
  - Testing (linting, build, manual)
  - Documentación actualizada
  - Checklist de UI/UX
  - Accesibilidad
  - Responsive design
  - Performance
  - Browser compatibility
  - Reviewers sugeridos
  - Deployment notes

**Beneficios:**
- Estandarización de PRs
- Mejor comunicación del equipo
- Documentación de cambios visuales
- Checklist de calidad UI/UX

---

## ⚡ Scripts de Automatización

### `setup.sh`
**Propósito:** Script automatizado para configuración inicial del proyecto.

**Funciones:**
1. Verifica instalación de Node.js 20+
2. Instala dependencias con `npm ci`
3. Crea archivo `.env` desde `.env.example` si no existe
4. Ejecuta build de validación
5. Muestra próximos pasos

**Uso:**
```bash
chmod +x setup.sh
./setup.sh
```

**Beneficio:** Configuración de entorno en un solo comando.

---

## 🧪 Archivos de Linting

### `eslint.config.js`
**Propósito:** Configuración de ESLint para mantener calidad de código.

**Configuración:**
- Usa configuración flat de ESLint 9
- Ignora directorio `dist/`
- Aplica a archivos `.js` y `.jsx`
- Configuraciones:
  - Configuración recomendada de ESLint
  - React Hooks rules
  - React Refresh para HMR
- Globals de browser
- ECMAScript 2020
- Soporte para JSX

**Reglas personalizadas:**
- Permite variables no usadas que empiecen con mayúscula o underscore

**Uso:**
```bash
npm run lint  # Ver errores
npm run lint -- --fix  # Fix automático
```

---

## ⚙️ Archivo de Configuración Vite

### `vite.config.js`
**Propósito:** Configuración de Vite para build y desarrollo.

**Configuración actual:**
- Plugin de React para JSX y Fast Refresh
- Base path: `/` (raíz del dominio)

**Configuraciones opcionales que se pueden agregar:**
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/',  // Base path para deployment
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'  // Proxy para desarrollo
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

---

## 📊 Estructura Final del Repositorio

```
codemio_front/
├── .github/
│   └── workflows/
│       └── production.yml      # 🆕 Pipeline CI/CD
│   └── ISSUE_TEMPLATE/
│       ├── config.yml          # 🆕 Configuración templates
│       ├── task.yml            # 🆕 Template de tareas
│       ├── bug_report.yml      # 🆕 Template de bugs
│       └── feature_request.yml # 🆕 Template de features
│   └── pull_request_template.md # 🆕 Template de PRs
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .dockerignore               # 🆕 Archivos excluidos de Docker
├── .env.example                # 🆕 Plantilla de variables
├── .gitignore                  # ✏️ Completado
├── COMMANDS.md                 # 🆕 Referencia de comandos
├── CONFIGURATION_SUMMARY.md    # 🆕 Este archivo
├── Dockerfile                  # 🆕 Imagen Docker
├── eslint.config.js            # Configuración ESLint
├── index.html                  # HTML base
├── package.json                # Dependencias
├── package-lock.json           # Lock de dependencias
├── README.md                   # 🆕 Documentación principal
├── setup.sh                    # 🆕 Script de configuración
└── vite.config.js              # Configuración Vite
```

---

## 🚀 Flujos de Trabajo

### Desarrollo Local (Primera vez)

```bash
# 1. Clonar repositorio
git clone https://github.com/MiguelSP040/codemio_front.git
cd codemio_front

# 2. Ejecutar script de setup
./setup.sh

# 3. Editar .env con URL del backend
nano .env

# 4. Iniciar servidor
npm run dev
```

### Desarrollo Local (Subsecuente)

```bash
# Iniciar servidor de desarrollo
npm run dev

# En otra terminal, ejecutar linting
npm run lint
```

### Con Docker

```bash
# Build de imagen
docker build -t codemio-frontend .

# Ejecutar contenedor
docker run -p 8080:80 codemio-frontend

# Acceder en http://localhost:8080
```

### Despliegue a Producción

```bash
# 1. Hacer cambios
git add .
git commit -m "feat: add new component"

# 2. Push a GitHub
git push origin main

# 3. GitHub Actions ejecuta automáticamente:
#    - Linting
#    - Build
#    - Docker build validation

# 4. Render detecta el push y despliega automáticamente
```

---

## ✅ Checklist de Configuración Completa

- [x] `package.json` con todas las dependencias
- [x] `Dockerfile` optimizado con nginx
- [x] `.dockerignore` para reducir tamaño de imagen
- [x] `.gitignore` completo para frontend
- [x] `.env.example` como plantilla
- [x] `.github/workflows/production.yml` para CI/CD
- [x] `.github/ISSUE_TEMPLATE/` con templates
- [x] `.github/pull_request_template.md` para PRs
- [x] `setup.sh` para configuración automática
- [x] `eslint.config.js` para calidad de código
- [x] `vite.config.js` configurado
- [x] `README.md` con documentación completa
- [x] `COMMANDS.md` con referencia de comandos
- [x] `CONFIGURATION_SUMMARY.md` con resumen

---

## 🎯 Próximos Pasos

1. **Desarrollo de Componentes:**
   - Layout principal y navegación
   - Páginas de autenticación
   - Dashboard de proyectos
   - Componentes de carga de archivos
   - Visualización de métricas

2. **Integración con Backend:**
   - Configurar cliente HTTP (fetch/axios)
   - Implementar servicios de API
   - Manejo de autenticación (JWT)
   - Gestión de estado (Context API/Redux)

3. **UI/UX:**
   - Sistema de diseño
   - Componentes reutilizables
   - Responsive design
   - Accesibilidad (WCAG)

4. **Testing:**
   - Configurar Vitest
   - Unit tests de componentes
   - Integration tests
   - E2E tests (Playwright/Cypress)

5. **Despliegue:**
   - Configurar Render Static Site
   - Configurar variables de entorno
   - Validar CORS con backend
   - Monitoreo y analytics

---

## 📞 Soporte

Si tienes dudas sobre alguno de estos archivos, revisa:
- `README.md` para guía general
- `COMMANDS.md` para referencia de comandos
- `CONFIGURATION_SUMMARY.md` para detalles de configuración
- Documentación oficial de [React](https://react.dev/)
- Documentación oficial de [Vite](https://vitejs.dev/)
