# 📝 Comandos Útiles - CodeMio Frontend

Referencia rápida de comandos para desarrollo del frontend.

---

## 📦 NPM y Gestión de Dependencias

### Instalación de dependencias

```bash
# Instalar todas las dependencias (recomendado para CI/CD)
npm ci

# Instalar todas las dependencias (crea/actualiza package-lock.json)
npm install

# Instalar dependencia de producción
npm install nombre-paquete

# Instalar dependencia de desarrollo
npm install -D nombre-paquete

# Actualizar dependencias
npm update

# Ver dependencias desactualizadas
npm outdated

# Auditoría de seguridad
npm audit

# Fix automático de vulnerabilidades
npm audit fix
```

### Desinstalación de dependencias

```bash
# Desinstalar paquete
npm uninstall nombre-paquete

# Desinstalar paquete de desarrollo
npm uninstall -D nombre-paquete
```

---

## 🚀 Scripts de Desarrollo

### Servidor de desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 5173)
npm run dev

# Iniciar con puerto específico
npm run dev -- --port 3000

# Iniciar y abrir navegador automáticamente
npm run dev -- --open
```

### Build de producción

```bash
# Generar build de producción
npm run build

# Preview del build de producción
npm run preview

# Preview con puerto específico
npm run preview -- --port 8080
```

### Linting y formateo

```bash
# Ejecutar ESLint
npm run lint

# Fix automático de problemas de linting
npm run lint -- --fix

# Lint de archivo específico
npx eslint src/App.jsx

# Lint con formato de salida específico
npx eslint . --format stylish
```

---

## 🐳 Docker

### Build de imágenes

```bash
# Build de imagen Docker
docker build -t codemio-frontend .

# Build con tag específico
docker build -t codemio-frontend:v1.0.0 .

# Build sin cache
docker build --no-cache -t codemio-frontend .

# Build con build args
docker build --build-arg VITE_API_URL=https://api.example.com -t codemio-frontend .
```

### Ejecutar contenedores

```bash
# Ejecutar contenedor
docker run -p 8080:80 codemio-frontend

# Ejecutar en background
docker run -d -p 8080:80 codemio-frontend

# Ejecutar con nombre específico
docker run --name frontend -p 8080:80 codemio-frontend

# Ejecutar con variables de entorno
docker run -e VITE_API_URL=https://api.example.com -p 8080:80 codemio-frontend

# Ejecutar con volumen (desarrollo)
docker run -v $(pwd)/src:/app/src -p 8080:80 codemio-frontend
```

### Gestión de contenedores

```bash
# Listar contenedores en ejecución
docker ps

# Listar todos los contenedores
docker ps -a

# Detener contenedor
docker stop <container-id>

# Eliminar contenedor
docker rm <container-id>

# Ver logs de contenedor
docker logs <container-id>

# Ver logs en tiempo real
docker logs -f <container-id>

# Ejecutar comando en contenedor
docker exec -it <container-id> sh
```

### Gestión de imágenes

```bash
# Listar imágenes
docker images

# Eliminar imagen
docker rmi codemio-frontend

# Eliminar imágenes no utilizadas
docker image prune

# Inspeccionar imagen
docker inspect codemio-frontend
```

---

## 🔧 Git y Control de Versiones

### Configuración inicial

```bash
# Inicializar repositorio
git init

# Configurar nombre de rama principal
git branch -M main

# Agregar remoto
git remote add origin https://github.com/MiguelSP040/codemio_front.git

# Ver remotos configurados
git remote -v
```

### Workflow básico

```bash
# Ver estado del repositorio
git status

# Agregar archivos al staging
git add .
git add src/App.jsx

# Commit con mensaje
git commit -m "feat: add user authentication"

# Push a remoto
git push origin main

# Push y establecer upstream (primera vez)
git push -u origin main

# Pull cambios del remoto
git pull origin main
```

### Branches

```bash
# Crear branch
git checkout -b feat/new-feature

# Cambiar de branch
git checkout main

# Listar branches
git branch

# Listar branches remotos
git branch -r

# Eliminar branch local
git branch -d feat/old-feature

# Eliminar branch remoto
git push origin --delete feat/old-feature
```

### Conventional Commits

```bash
# Nueva funcionalidad
git commit -m "feat: add dashboard component"

# Corrección de error
git commit -m "fix: resolve API timeout issue"

# Documentación
git commit -m "docs: update README with deployment steps"

# Estilo (formato, punto y coma faltante, etc.)
git commit -m "style: format code with prettier"

# Refactorización
git commit -m "refactor: restructure components folder"

# Performance
git commit -m "perf: optimize image loading"

# Tests
git commit -m "test: add unit tests for Login component"

# Build
git commit -m "build: update vite to v8.0.0"

# CI/CD
git commit -m "ci: add GitHub Actions workflow"

# Tareas auxiliares
git commit -m "chore: update dependencies"
```

### Stash (guardar cambios temporalmente)

```bash
# Guardar cambios temporalmente
git stash

# Guardar con mensaje
git stash save "work in progress on feature X"

# Listar stashes
git stash list

# Aplicar último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{0}

# Eliminar stash
git stash drop stash@{0}
```

### Historial y diferencias

```bash
# Ver historial de commits
git log

# Ver historial resumido
git log --oneline

# Ver historial con gráfico
git log --graph --oneline --all

# Ver cambios no commiteados
git diff

# Ver cambios en staging
git diff --staged

# Ver cambios de un commit específico
git show <commit-hash>
```

---

## 🌐 Vite Específico

### Servidor de desarrollo

```bash
# Iniciar con host específico
npm run dev -- --host 0.0.0.0

# Iniciar con HTTPS
npm run dev -- --https

# Modo debug
npm run dev -- --debug

# Limpiar cache de Vite
rm -rf node_modules/.vite
```

### Build

```bash
# Build con sourcemaps
npm run build -- --sourcemap

# Build sin minificar
npm run build -- --minify false

# Analizar bundle
npx vite-bundle-visualizer
```

---

## 🔍 Debugging y Troubleshooting

### Limpieza

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar cache de npm
npm cache clean --force

# Limpiar cache de Vite
rm -rf node_modules/.vite

# Limpiar build
rm -rf dist
```

### Información del sistema

```bash
# Ver versión de Node.js
node -v

# Ver versión de npm
npm -v

# Ver variables de entorno
printenv | grep VITE

# Ver configuración de npm
npm config list
```

### Debugging de build

```bash
# Build con información detallada
npm run build -- --debug

# Preview con logs detallados
npm run preview -- --debug

# Verificar archivos del build
ls -la dist/
```

---

## 📊 Análisis y Optimización

### Bundle analysis

```bash
# Instalar bundle visualizer
npm install -D rollup-plugin-visualizer

# Agregar a vite.config.js y ejecutar build
npm run build
```

### Performance

```bash
# Lighthouse (requiere Chrome)
npx lighthouse http://localhost:5173 --view

# Analizar tamaño de paquetes
npm run build
ls -lh dist/assets/
```

---

## 🧪 Testing (cuando se configure)

```bash
# Ejecutar tests (cuando se configure Vitest)
npm test

# Tests en modo watch
npm test -- --watch

# Tests con coverage
npm test -- --coverage

# Tests de un archivo específico
npm test -- src/components/Button.test.jsx
```

---

## 🔐 Seguridad

```bash
# Auditoría de seguridad
npm audit

# Ver vulnerabilidades de alto nivel
npm audit --audit-level=high

# Fix automático (si es posible)
npm audit fix

# Fix forzado (puede romper compatibilidad)
npm audit fix --force

# Ver detalles de una vulnerabilidad
npm audit --json
```

---

## 📝 Shortcuts Útiles

### Durante desarrollo

```bash
# Ctrl + C: Detener servidor de desarrollo
# r: Reiniciar servidor (en modo dev de Vite)
# u: Mostrar URL del servidor
# o: Abrir en navegador
# c: Limpiar console
# q: Salir
```

---

## 🚀 Workflow Completo Recomendado

### Setup inicial (una vez)

```bash
git clone https://github.com/MiguelSP040/codemio_front.git
cd codemio_front
./setup.sh
```

### Desarrollo diario

```bash
# 1. Actualizar código
git pull origin main

# 2. Crear branch para feature
git checkout -b feat/nueva-funcionalidad

# 3. Instalar dependencias nuevas (si hay)
npm ci

# 4. Iniciar desarrollo
npm run dev

# 5. Hacer cambios...

# 6. Verificar calidad
npm run lint
npm run build

# 7. Commit
git add .
git commit -m "feat: descripción del cambio"

# 8. Push
git push origin feat/nueva-funcionalidad

# 9. Crear Pull Request en GitHub
```

### Pre-push checklist

```bash
# Verificar linting
npm run lint

# Verificar build
npm run build

# Ver estado de git
git status

# Ver cambios
git diff

# Commit y push
git add .
git commit -m "tipo: descripción"
git push origin <branch>
```

---

## 📞 Ayuda

Para más información sobre comandos específicos:

```bash
# Ayuda de npm
npm help

# Ayuda de comando específico
npm help install

# Ayuda de Vite
npx vite --help

# Ayuda de ESLint
npx eslint --help

# Ayuda de Docker
docker --help
docker run --help
```

---

## 🔗 Referencias

- [npm Documentation](https://docs.npmjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [ESLint Documentation](https://eslint.org/)
- [Docker Documentation](https://docs.docker.com/)
- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
