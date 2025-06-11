# 🎮 InnolandGame - Beta

Un juego educativo interactivo desarrollado con React Native y Expo que combina aprendizaje con diversión a través de desafíos gamificados. **Versión Beta** - En desarrollo activo.

## 📋 Descripción

InnolandGame es una aplicación móvil que ofrece una experiencia de aprendizaje única mediante:
- **Selección de roles**: Los usuarios pueden elegir entre diferentes roles de aprendizaje
- **Desafíos interactivos**: Sistema de retos que adaptan el contenido según el rol seleccionado
- **Funcionalidades multimedia**: Integración de cámara, audio y animaciones
- **Interfaz moderna**: Diseño intuitivo y atractivo con componentes UI personalizados

## 🚀 Características Principales

- ✨ **RolePicker**: Componente para selección de roles de usuario
- 📷 **CameraOpener**: Funcionalidad de cámara integrada para escanear códigos QR
- 🎯 **ChallengeManager**: Pantalla de desafíos interactivos
- 🎨 **Animaciones fluidas**: Efectos visuales con React Native Reanimated
- 📱 **Multiplataforma**: Compatible con iOS, Android y Web
- 🎤 **Síntesis de voz**: Funcionalidad de texto a voz con Expo Speech
- 🔒 **Permisos seguros**: Manejo de permisos de cámara y audio

## 🛠️ Tecnologías Utilizadas

- **React Native** - Framework principal
- **Expo** - Plataforma de desarrollo y build
- **React Native Reanimated** - Animaciones avanzadas
- **Expo Camera** - Funcionalidad de cámara
- **Expo Speech** - Síntesis de voz
- **TypeScript** - Tipado estático
- **React Native Gesture Handler** - Gestos nativos
- **React Native SVG** - Gráficos vectoriales
- **Axios** - Cliente HTTP

## 📦 Instalación

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (para desarrollo Android)
- Xcode (para desarrollo iOS, solo macOS)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/AndreSaul16/InnolandGame.git
   cd InnolandGame
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Iniciar el proyecto**
   ```bash
   npm start
   # o
   yarn start
   ```

4. **Ejecutar en dispositivo/simulador**
   ```bash
   # Para Android
   npm run android
   
   # Para iOS
   npm run ios
   
   # Para Web
   npm run web
   ```

## 🏗️ Estructura del Proyecto

```
InnolandGame/
├── src/
│   ├── components/
│   │   ├── UI/                    # Componentes de interfaz
│   │   │   ├── RolePicker.jsx     # Selector de roles
│   │   │   ├── ChallengeManager.jsx # Pantalla de desafíos
│   │   │   └── CameraOpener.jsx   # Componente de cámara
│   │   ├── challenges/            # Componentes de desafíos
│   │   └── utils/                 # Utilidades y helpers
│   ├── services/                  # Servicios y APIs
│   ├── data/                      # Datos estáticos
│   └── styles/                    # Estilos globales
├── assets/                        # Recursos multimedia
├── android/                       # Configuración específica de Android
├── App.js                         # Componente principal
├── package.json                   # Dependencias del proyecto
├── app.json                       # Configuración de Expo
└── README.md                      # Este archivo
```

## 🎯 Uso

1. **Selección de Rol**: Al iniciar la aplicación, el usuario debe seleccionar un rol de aprendizaje
2. **Confirmación**: El sistema confirma la selección del rol
3. **Desafíos**: Se presentan desafíos específicos según el rol elegido
4. **Interacción**: El usuario puede usar la cámara para escanear códigos QR, audio y otras funcionalidades

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo de Expo
- `npm run android` - Ejecuta la app en Android
- `npm run ios` - Ejecuta la app en iOS
- `npm run web` - Ejecuta la app en el navegador web

## 📱 Configuración de Permisos

La aplicación requiere los siguientes permisos:
- **Cámara**: Para escanear códigos QR de INNOLAND
- **Audio**: Para funcionalidades de síntesis de voz

## 🚧 Estado del Proyecto - Beta

**Versión actual**: 1.0.0-beta

### ✅ Funcionalidades Implementadas
- Selección de roles de usuario
- Sistema de desafíos básico
- Integración de cámara para códigos QR
- Síntesis de voz
- Interfaz de usuario moderna
- Configuración multiplataforma

### 🔄 En Desarrollo
- Mejoras en la experiencia de usuario
- Optimización de rendimiento
- Nuevos tipos de desafíos
- Sistema de progreso del usuario

### 📋 Próximas Funcionalidades
- Sistema de puntuación
- Modo multijugador
- Personalización avanzada
- Integración con backend

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reportar Bugs

Si encuentras algún bug o tienes sugerencias, por favor:
1. Revisa si ya existe un issue relacionado
2. Crea un nuevo issue con una descripción detallada
3. Incluye pasos para reproducir el problema
4. Especifica tu dispositivo y versión del sistema operativo

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**André Saúl** - [GitHub](https://github.com/AndreSaul16)

## 🙏 Agradecimientos

- Equipo de desarrollo de React Native
- Comunidad de Expo
- Contribuidores y testers de la versión beta

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!

**Nota**: Esta es una versión beta. Algunas funcionalidades pueden estar en desarrollo o sujetas a cambios. 