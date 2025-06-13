# Guía de Despliegue en Azure Web App

## Requisitos Previos

1. **Cuenta de Azure** con suscripción activa
2. **Azure CLI** instalado en tu máquina
3. **GitHub** para el repositorio del código

## Opción 1: Despliegue Automático con GitHub Actions (Recomendado)

### 1. Crear Azure Web App

```powershell
# Iniciar sesión en Azure
az login

# Crear grupo de recursos (si no existe)
az group create --name InnolandGame-RG --location "East US"

# Crear plan de App Service
az appservice plan create --name InnolandGame-Plan --resource-group InnolandGame-RG --sku B1 --is-linux

# Crear Web App
az webapp create --name innoland-game-web --resource-group InnolandGame-RG --plan InnolandGame-Plan --runtime "NODE|18-lts"
```

### 2. Configurar GitHub Secrets

En tu repositorio de GitHub, ve a **Settings > Secrets and variables > Actions** y agrega:

- `AZURE_WEBAPP_PUBLISH_PROFILE`: Descarga el perfil de publicación desde Azure Portal
- `REACT_APP_OPENAI_API_KEY`: Tu clave de API de OpenAI
- `REACT_APP_OPENAI_ASSISTANT_ID`: ID de tu asistente de OpenAI
- `AZURE_FUNCTION_URL`: URL de tu Azure Function (si aplica)
- `REACT_APP_AZURE_FUNCTION_URL`: URL de tu Azure Function para el frontend

### 3. Configurar Variables de Entorno en Azure

En Azure Portal, ve a tu Web App > **Configuration > Application settings** y agrega:

```
WEBSITE_NODE_DEFAULT_VERSION = 18.17.0
WEBSITE_RUN_FROM_PACKAGE = 1
```

## Opción 2: Despliegue Manual

### 1. Construir la aplicación

```powershell
npm run build:web
```

### 2. Subir archivos a Azure

```powershell
# Instalar Azure CLI si no lo tienes
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Iniciar sesión
az login

# Configurar el perfil de publicación
az webapp deployment list-publishing-profiles --name innoland-game-web --resource-group InnolandGame-RG --xml

# Usar Azure Storage Explorer o Azure CLI para subir la carpeta dist
```

## Opción 3: Despliegue con Azure DevOps

1. Crear un pipeline en Azure DevOps
2. Usar el archivo `azure-deploy.yml` como base
3. Configurar las variables de entorno en el pipeline

## Configuración de Dominio Personalizado

1. En Azure Portal, ve a tu Web App > **Custom domains**
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones de Azure

## Monitoreo y Logs

- **Application Insights**: Habilita para monitoreo avanzado
- **Logs**: Ve a **Log stream** en Azure Portal para logs en tiempo real
- **Métricas**: Monitorea el rendimiento en **Metrics**

## Troubleshooting

### Error: "Module not found"
- Verifica que todas las dependencias estén en `package.json`
- Ejecuta `npm install` antes del build

### Error: "Environment variables not found"
- Verifica que las variables estén configuradas en Azure Portal
- Asegúrate de que los nombres coincidan con los del código

### Error: "Routing not working"
- Verifica que el archivo `web.config` esté en la raíz del proyecto
- Asegúrate de que las reglas de rewrite estén correctas

## Comandos Útiles

```powershell
# Ver logs en tiempo real
az webapp log tail --name innoland-game-web --resource-group InnolandGame-RG

# Reiniciar la aplicación
az webapp restart --name innoland-game-web --resource-group InnolandGame-RG

# Ver configuración
az webapp config show --name innoland-game-web --resource-group InnolandGame-RG
```

## Seguridad

1. **HTTPS**: Azure Web Apps incluye HTTPS por defecto
2. **Variables de entorno**: Nunca subas credenciales al código
3. **Headers de seguridad**: Configurados en `web.config`
4. **CORS**: Configura según tus necesidades en Azure Portal

## Costos Estimados

- **Plan B1**: ~$13/mes (recomendado para desarrollo)
- **Plan S1**: ~$73/mes (recomendado para producción)
- **Plan P1V2**: ~$146/mes (para alta disponibilidad)

## Soporte

- [Documentación oficial de Azure Web Apps](https://docs.microsoft.com/en-us/azure/app-service/)
- [Guía de React Native Web](https://docs.expo.dev/guides/running-in-web-browser/)
- [Troubleshooting de Azure Web Apps](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-dotnet-visual-studio) 