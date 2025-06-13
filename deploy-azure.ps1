# Script de despliegue para Azure Web App
# Ejecutar como: .\deploy-azure.ps1

param(
    [string]$ResourceGroup = "InnolandGame-RG",
    [string]$WebAppName = "innoland-game-web",
    [string]$Location = "East US"
)

Write-Host "🚀 Iniciando despliegue de InnolandGame a Azure..." -ForegroundColor Green

# Verificar si Azure CLI está instalado
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI encontrado: v$($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI no encontrado. Por favor instálalo desde: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Verificar si el usuario está logueado en Azure
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Conectado a Azure como: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "🔐 Iniciando sesión en Azure..." -ForegroundColor Yellow
    az login
}

# Verificar si el grupo de recursos existe
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "📦 Creando grupo de recursos: $ResourceGroup" -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location
} else {
    Write-Host "✅ Grupo de recursos encontrado: $ResourceGroup" -ForegroundColor Green
}

# Verificar si el plan de App Service existe
$planExists = az appservice plan list --resource-group $ResourceGroup --query "[?name=='$WebAppName-Plan']" --output tsv
if (-not $planExists) {
    Write-Host "📋 Creando plan de App Service..." -ForegroundColor Yellow
    az appservice plan create --name "$WebAppName-Plan" --resource-group $ResourceGroup --sku B1 --is-linux
} else {
    Write-Host "✅ Plan de App Service encontrado" -ForegroundColor Green
}

# Verificar si la Web App existe
$webAppExists = az webapp list --resource-group $ResourceGroup --query "[?name=='$WebAppName']" --output tsv
if (-not $webAppExists) {
    Write-Host "🌐 Creando Web App..." -ForegroundColor Yellow
    az webapp create --name $WebAppName --resource-group $ResourceGroup --plan "$WebAppName-Plan" --runtime "NODE|18-lts"
} else {
    Write-Host "✅ Web App encontrada: $WebAppName" -ForegroundColor Green
}

# Construir la aplicación
Write-Host "🔨 Construyendo la aplicación..." -ForegroundColor Yellow
npm run build:web

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la aplicación" -ForegroundColor Red
    exit 1
}

# Configurar variables de entorno
Write-Host "⚙️ Configurando variables de entorno..." -ForegroundColor Yellow
az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroup --settings WEBSITE_NODE_DEFAULT_VERSION=18.17.0 WEBSITE_RUN_FROM_PACKAGE=1

# Obtener el perfil de publicación
Write-Host "📄 Generando perfil de publicación..." -ForegroundColor Yellow
$publishProfile = az webapp deployment list-publishing-profiles --name $WebAppName --resource-group $ResourceGroup --xml

# Crear archivo temporal con el perfil
$publishProfile | Out-File -FilePath "publish-profile.xml" -Encoding UTF8

Write-Host "📤 Subiendo archivos a Azure..." -ForegroundColor Yellow

# Usar Azure CLI para subir los archivos
try {
    # Crear un archivo ZIP con el contenido de dist
    Compress-Archive -Path "dist\*" -DestinationPath "dist.zip" -Force
    
    # Subir el ZIP a Azure
    az webapp deployment source config-zip --resource-group $ResourceGroup --name $WebAppName --src "dist.zip"
    
    Write-Host "✅ Despliegue completado exitosamente!" -ForegroundColor Green
    
    # Obtener la URL de la aplicación
    $webAppUrl = az webapp show --name $WebAppName --resource-group $ResourceGroup --query "defaultHostName" --output tsv
    Write-Host "🌐 Tu aplicación está disponible en: https://$webAppUrl" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error durante el despliegue: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Limpiar archivos temporales
    if (Test-Path "publish-profile.xml") { Remove-Item "publish-profile.xml" }
    if (Test-Path "dist.zip") { Remove-Item "dist.zip" }
}

Write-Host "🎉 ¡Despliegue completado! Tu aplicación InnolandGame está ahora en Azure." -ForegroundColor Green
Write-Host "💡 Para ver los logs en tiempo real, ejecuta: az webapp log tail --name $WebAppName --resource-group $ResourceGroup" -ForegroundColor Cyan 