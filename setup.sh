#!/bin/bash

# CodeMio Frontend - Setup Script
# Automatiza la configuración inicial del proyecto

set -e  # Exit on error

echo "🚀 CodeMio Frontend - Configuración Inicial"
echo "==========================================="
echo ""

# Check Node.js installation
echo "📦 Verificando instalación de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado."
    echo "Por favor instala Node.js 20+ desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Advertencia: Node.js versión $NODE_VERSION detectada. Se recomienda Node.js 20+."
fi

echo "✅ Node.js $(node -v) detectado"
echo ""

# Install dependencies
echo "📥 Instalando dependencias..."
npm ci
echo "✅ Dependencias instaladas correctamente"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "✅ Archivo .env creado"
    echo ""
    echo "⚠️  IMPORTANTE: Edita el archivo .env y configura:"
    echo "   - VITE_API_URL: URL del backend"
    echo ""
else
    echo "ℹ️  El archivo .env ya existe, no se sobrescribirá"
    echo ""
fi

# Validate build
echo "🔨 Validando build del proyecto..."
npm run build
echo "✅ Build completado exitosamente"
echo ""

echo "✨ ¡Configuración completada!"
echo ""
echo "Próximos pasos:"
echo "1. Edita el archivo .env con la URL del backend"
echo "2. Ejecuta 'npm run dev' para iniciar el servidor de desarrollo"
echo "3. Abre http://localhost:5173 en tu navegador"
echo ""
echo "Para más información, consulta README.md"
