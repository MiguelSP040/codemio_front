---
name: 🔄 Pull Request Frontend
about: Template para Pull Requests en CodeMio Frontend
title: '[TIPO] Breve descripción del cambio'
labels: ''
assignees: ''
---

## 📋 Información del Pull Request

### 🏷️ Versión y Ambiente

- **Versión:** v0.0.0 <!-- Especifica la versión del proyecto -->
- **Ambiente afectado:** 
  - [ ] Desarrollo
  - [ ] Producción
- **Rama base:** `main` / `develop` / `otra`
- **Rama feature:** `feat/nombre-de-la-feature`

---

### 📝 Descripción

<!-- Proporciona una descripción clara y concisa de los cambios realizados -->

**¿Qué hace este PR?**


**¿Por qué es necesario este cambio?**


**¿Qué problema resuelve?**


---

### 🔄 Pasos para Probar

<!-- Lista los pasos para probar los cambios realizados -->

1. 
2. 
3. 
4. 

**Comandos para testing:**
```bash
# Ejemplo:
npm run dev
npm run lint
npm run build
```

---

### 🎫 Issue Relacionado

<!-- Enlaza el issue o ticket relacionado -->

- **Issue:** Closes #<!-- número del issue -->
- **Jira/Trello:** <!-- Enlace al ticket externo si aplica -->
- **Documentación:** <!-- Enlace a documentación relacionada -->

---

### 📸 Capturas de Pantalla o Videos

<!-- Si aplica, agrega capturas de pantalla o videos de la funcionalidad -->

**Antes:**
<!-- Imagen o video del estado anterior -->

**Después:**
<!-- Imagen o video del nuevo estado -->

---

### ℹ️ Información Adicional

#### 🔧 Cambios Técnicos

- **Archivos modificados:** 
  - `src/components/NuevoComponente.jsx`
  - `src/pages/Dashboard.jsx`

- **Nuevas dependencias:** 
  - [ ] No se agregaron nuevas dependencias
  - [ ] Sí, se agregaron: <!-- listar dependencias -->

- **Variables de entorno:**
  - [ ] No requiere nuevas variables
  - [ ] Sí, requiere agregar al `.env`: <!-- listar variables -->

- **Cambios en configuración:**
  - [ ] No requiere cambios en configuración
  - [ ] Sí, requiere actualizar: <!-- especificar -->

#### 🧪 Testing

- [ ] Linting pasa sin errores (`npm run lint`)
- [ ] Build exitoso (`npm run build`)
- [ ] Probado en desarrollo local (`npm run dev`)
- [ ] Probado manualmente en navegadores principales
- [ ] Tests unitarios agregados/actualizados (si aplica)
- [ ] Tests de integración agregados/actualizados (si aplica)

**Navegadores probados:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Dispositivos probados:**
- [ ] Desktop (1920x1080+)
- [ ] Tablet (768px+)
- [ ] Mobile (375px+)

#### 📚 Documentación

- [ ] README.md actualizado (si aplica)
- [ ] COMMANDS.md actualizado (si aplica)
- [ ] Comentarios JSDoc agregados/actualizados
- [ ] CONFIGURATION_SUMMARY.md actualizado (si aplica)
- [ ] Screenshots/mockups actualizados (si aplica)

#### 🎯 Checklist de Calidad

- [ ] El código sigue las convenciones de [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] He realizado self-review de mi código
- [ ] He comentado el código en áreas complejas
- [ ] Mis cambios no generan nuevos warnings
- [ ] El linting pasa sin errores
- [ ] He actualizado la documentación relevante
- [ ] Mis cambios no rompen funcionalidad existente
- [ ] Las props de componentes están documentadas

#### 🎨 Checklist UI/UX

- [ ] Diseño responsive implementado
- [ ] Accesibilidad considerada (ARIA labels, keyboard navigation)
- [ ] Estados de loading/error manejados
- [ ] Feedback visual apropiado para acciones del usuario
- [ ] Transiciones/animaciones fluidas
- [ ] Compatible con temas (si aplica)
- [ ] Textos e iconos apropiados
- [ ] Consistente con el sistema de diseño

#### ♿ Accesibilidad

- [ ] Navegación por teclado funcional
- [ ] Atributos ARIA apropiados
- [ ] Contraste de colores adecuado
- [ ] Textos alternativos en imágenes
- [ ] Focus visible en elementos interactivos
- [ ] Probado con lector de pantalla (si es crítico)

#### 🔒 Seguridad

- [ ] No se exponen secretos o información sensible
- [ ] Variables sensibles en `.env` (no en código)
- [ ] Validación de input del usuario
- [ ] Sanitización de datos antes de renderizar
- [ ] No se hace commit de archivos `.env`
- [ ] No se incluyen tokens o API keys en el código

#### ⚡ Performance

- [ ] No se identifican problemas de performance
- [ ] Imágenes optimizadas (formato, tamaño)
- [ ] Lazy loading implementado donde corresponde
- [ ] Componentes memoizados si es necesario
- [ ] Bundle size considerado
- [ ] No hay re-renders innecesarios

---

### 👥 Reviewers

<!-- Tag a las personas que deberían revisar este PR -->

@<!-- username1 --> @<!-- username2 -->

---

### 🚀 Deployment

- [ ] Listo para merge a develop
- [ ] Listo para merge a main
- [ ] Requiere deployment manual
- [ ] Requiere configuración adicional en producción

**Notas de deployment:**
<!-- Cualquier consideración especial para el deployment -->

---

### 📝 Notas Adicionales

<!-- Cualquier información adicional que los reviewers deban saber -->

---

### 🏁 Post-Merge Checklist

- [ ] Verificar deployment exitoso
- [ ] Monitorear logs por errores
- [ ] Verificar funcionalidad en producción
- [ ] Actualizar stakeholders
- [ ] Cerrar issue relacionado

---

**Tipo de cambio:**
- [ ] 🐛 Bug fix
- [ ] ✨ Nueva funcionalidad
- [ ] 💥 Breaking change
- [ ] 📝 Documentación
- [ ] 🎨 Mejora de UI/UX
- [ ] ♻️ Refactorización
- [ ] ⚡ Mejora de performance
- [ ] ♿ Accesibilidad
- [ ] 🔧 Configuración
- [ ] 🔒 Seguridad

---

_Template version: 1.0.0_
