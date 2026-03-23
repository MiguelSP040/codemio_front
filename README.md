# CodeMio Frontend

<div align="center">

![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![ESLint](https://img.shields.io/badge/ESLint-9.39.4-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Latest-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white)

</div>

---

## 📋 Descripción

**CodeMio Frontend** es la interfaz web de usuario desarrollada con React y Vite que permite interactuar con el sistema de análisis estático de código Java.

### ¿Qué hace esta aplicación?

La aplicación frontend proporciona una interfaz intuitiva para:

- **Gestión de usuarios:** Registro, autenticación y administración de perfiles
- **Dashboard de proyectos:** Visualización y gestión de proyectos Java
- **Carga de archivos:** Interface para subir archivos `.java` individuales o proyectos `.zip`
- **Visualización de métricas:** Dashboards interactivos mostrando resultados del análisis de código
- **Evaluación de calidad:** Representación visual de métricas y rangos de buenas prácticas
- **Gestión de proyectos:** CRUD completo de proyectos y archivos

### Características Principales

✅ **Interface moderna y responsiva** con React 19  
✅ **Build ultra-rápido** con Vite 8  
✅ **Code quality** con ESLint configurado  
✅ **Hot Module Replacement (HMR)** para desarrollo  
✅ **Integración con API REST** del backend Django  
✅ **Contenedorización con Docker** para despliegue  
✅ **CI/CD automatizado** con GitHub Actions  
✅ **Optimizado para producción** con nginx  

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Framework** | React | 19.2.4 | Librería de UI |
| **Build Tool** | Vite | 8.0.0 | Build y dev server |
| **Linting** | ESLint | 9.39.4 | Calidad de código |
| **HTTP Client** | Fetch API | Native | Comunicación con backend |
| **Contenedor** | nginx | alpine | Servidor estático |
| **CI/CD** | GitHub Actions | - | Integración continua |
| **Despliegue** | Render | - | Hosting static site |

---

## 📚 Documentación Adicional

| Archivo | Propósito |
|---------|-----------|
| [`README.md`](README.md) | **Guía principal** - Instalación, configuración y uso general |
| [`CONFIGURATION_SUMMARY.md`](CONFIGURATION_SUMMARY.md) | **Resumen de configuración** - Explicación de archivos de configuración |
| [`COMMANDS.md`](COMMANDS.md) | **Referencia de comandos** - Comandos útiles para desarrollo |
| [`setup.sh`](setup.sh) | **Script de configuración** - Automatización del setup |

---

## 📦 Requisitos Previos

- Node.js 20+ (recomendado)
- npm 10+
- Docker (opcional, para contenedorización)
- Git

---

## 🚀 Instalación y Configuración

### Método 1: Script Automatizado (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/MiguelSP040/codemio_front.git
cd codemio_front

# Ejecutar script de configuración
chmod +x setup.sh
./setup.sh

# Iniciar servidor de desarrollo
npm run dev
```

El script `setup.sh` automáticamente:
- ✅ Verifica Node.js instalado
- ✅ Instala todas las dependencias
- ✅ Crea el archivo `.env` desde `.env.example`
- ✅ Valida el build del proyecto

### Método 2: Configuración Manual

Sigue los pasos detallados a continuación.

---

## 🛠️ Configuración Manual

### 1. Clonar el repositorio

```bash
git clone https://github.com/MiguelSP040/codemio_front.git
cd codemio_front
```

### 2. Instalar dependencias

```bash
npm ci
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Para desarrollo local (backend corriendo en localhost)
VITE_API_URL=http://localhost:8000/api

# Para producción (backend desplegado)
# VITE_API_URL=https://your-backend.onrender.com/api
```

### 4. Ejecutar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

### 5. Build para producción

```bash
npm run build
```

Los archivos estáticos se generarán en el directorio `dist/`

---

## 🐳 Docker

### Construir imagen Docker

```bash
docker build -t codemio-frontend .
```

### Ejecutar contenedor

```bash
docker run -p 8080:80 codemio-frontend
```

La aplicación estará disponible en: `http://localhost:8080`

### Build con variables de entorno

```bash
docker build --build-arg VITE_API_URL=https://api.example.com -t codemio-frontend .
```

---

## 📝 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con HMR en puerto 5173 |
| `npm run build` | Genera build de producción en `dist/` |
| `npm run preview` | Preview del build de producción localmente |
| `npm run lint` | Ejecuta ESLint para verificar calidad de código |

---

## 🏗️ Estructura del Proyecto

```
codemio_front/
├── .github/
│   └── workflows/
│       └── production.yml     # GitHub Actions CI/CD
├── public/                    # Archivos estáticos públicos
├── src/
│   ├── assets/               # Imágenes, fuentes, etc.
│   ├── components/           # Componentes React reutilizables
│   ├── pages/                # Páginas/vistas de la aplicación
│   ├── services/             # Servicios de API y lógica de negocio
│   ├── utils/                # Funciones utilitarias
│   ├── App.jsx               # Componente raíz
│   ├── main.jsx              # Punto de entrada
│   └── index.css             # Estilos globales
├── .dockerignore             # Archivos excluidos de Docker
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Archivos excluidos de Git
├── Dockerfile                # Configuración Docker
├── eslint.config.js          # Configuración ESLint
├── index.html                # HTML base
├── package.json              # Dependencias y scripts
├── setup.sh                  # Script de configuración
└── vite.config.js            # Configuración Vite
```

---

## 🌐 Despliegue en Render (Static Site)

### Configuración

1. Conecta tu repositorio de GitHub con Render
2. Crea un nuevo **Static Site**
3. Configura los siguientes valores:

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Configura las variables de entorno en Render:

```
VITE_API_URL=https://your-backend.onrender.com/api
```

### Despliegue Automático

Cada push a la rama `main` activará:
1. GitHub Actions ejecutará linting, build y validación de Docker
2. Render detectará el commit y desplegará automáticamente

---

## 🔗 Integración con Backend

Esta aplicación frontend se comunica con el backend CodeMio (Django):

- **Repositorio Backend:** [MiguelSP040/codemio_back](https://github.com/MiguelSP040/codemio_back)
- **Comunicación:** API REST via HTTP/HTTPS
- **CORS:** El backend debe tener configurado `CORS_ALLOWED_ORIGINS` con la URL del frontend

### Desarrollo Local

Para desarrollo local con ambos proyectos:

1. **Clonar ambos repositorios por separado:**

```bash
# Backend
git clone https://github.com/MiguelSP040/codemio_back.git
cd codemio_back
./setup.sh
python manage.py runserver

# Frontend (en otra terminal)
git clone https://github.com/MiguelSP040/codemio_front.git
cd codemio_front
./setup.sh
npm run dev
```

2. **Configurar `.env` del frontend:**

```env
VITE_API_URL=http://localhost:8000/api
```

3. **Configurar CORS en el backend:**

En `codemio_back/.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🧪 Testing

```bash
# Ejecutar linting
npm run lint

# Fix automático de problemas de linting
npm run lint -- --fix

# Build de producción (test)
npm run build
```

---

## 🔒 Seguridad

- Nunca commitees el archivo `.env`
- Las variables de entorno con prefijo `VITE_` son **públicas** (se incluyen en el build)
- No incluyas secretos o tokens en variables `VITE_*`
- Mantén las dependencias actualizadas
- Revisa las alertas de seguridad de GitHub

---

## 📝 Conventional Commits

Este proyecto sigue [Conventional Commits v1.0.0](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Tipos permitidos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de errores
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan lógica)
- `refactor`: Refactorización de código
- `perf`: Mejoras de rendimiento
- `test`: Agregar o modificar tests
- `build`: Cambios en sistema de construcción
- `ci`: Cambios en CI/CD
- `chore`: Tareas auxiliares

**Ejemplos:**
```bash
git commit -m "feat: add user authentication page"
git commit -m "fix: resolve API connection timeout"
git commit -m "docs: update installation instructions"
```

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feat/amazing-feature`)
3. Commit tus cambios siguiendo Conventional Commits
4. Push a la rama (`git push origin feat/amazing-feature`)
5. Abre un Pull Request usando el [template de PR](.github/pull_request_template.md)

### 📝 Templates Disponibles

El proyecto incluye templates de GitHub para facilitar la colaboración:

| Template | Uso |
|----------|-----|
| **[Pull Request](.github/pull_request_template.md)** | Se aplica automáticamente al crear un PR |
| **[Task](.github/ISSUE_TEMPLATE/task.yml)** | Crear nuevas tareas de desarrollo |
| **[Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml)** | Reportar errores o problemas |
| **[Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml)** | Proponer nuevas funcionalidades |

---

## 👥 Equipo

Desarrollado por el equipo de CodeMio - UTEZ

### Integrantes del Proyecto

<table>
  <tr>
    <th>Nombre</th>
    <th>Rol(es)</th>
    <th>GitHub</th>
  </tr>
  <tr>
    <td><strong>Miguel Angel Sanchez Perez</strong></td>
    <td>
      🔐 Administrador de Bases de Datos y Seguridad<br/>
      🧪 Lead de Integración y QA
    </td>
    <td>
      <a href="https://github.com/MiguelSP040">
        <img src="https://img.shields.io/badge/GitHub-MiguelSP040-181717?style=flat-square&logo=github" alt="MiguelSP040"/>
      </a>
    </td>
  </tr>
  <tr>
    <td><strong>Martin Antonio Joaquín Landa</strong></td>
    <td>⚙️ Desarrollador Backend</td>
    <td>
      <a href="https://github.com/M4ltin12">
        <img src="https://img.shields.io/badge/GitHub-M4ltin12-181717?style=flat-square&logo=github" alt="M4ltin12"/>
      </a>
    </td>
  </tr>
  <tr>
    <td><strong>Daniela Carrate Bahena</strong></td>
    <td>🎨 Frontend & UX</td>
    <td>
      <a href="https://github.com/danielita05">
        <img src="https://img.shields.io/badge/GitHub-danielita05-181717?style=flat-square&logo=github" alt="danielita05"/>
      </a>
    </td>
  </tr>
  <tr>
    <td><strong>Luis David Rojas Vargas</strong></td>
    <td>💻 Desarrollador JS</td>
    <td>
      <a href="https://github.com/DavidReds7">
        <img src="https://img.shields.io/badge/GitHub-DavidReds7-181717?style=flat-square&logo=github" alt="DavidReds7"/>
      </a>
    </td>
  </tr>
  <tr>
    <td><strong>Luis Ignacio Valera Aguilar</strong></td>
    <td>📊 Business Intelligence</td>
    <td>
      <a href="https://github.com/IgnacioValera">
        <img src="https://img.shields.io/badge/GitHub-IgnacioValera-181717?style=flat-square&logo=github" alt="IgnacioValera"/>
      </a>
    </td>
  </tr>
</table>

---

## 📞 Soporte

Para reportar problemas o solicitar características, abre un issue en el [repositorio de GitHub](https://github.com/MiguelSP040/codemio_front/issues).

---

## 📄 Licencia

Este proyecto es parte del trabajo académico en UTEZ y está desarrollado con fines educativos.
