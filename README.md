# 🎮 InnolandGame

Un juego educativo interactivo desarrollado con React Native y Expo que combina aprendizaje con diversión a través de desafíos gamificados.

## 📋 Descripción

InnolandGame es una aplicación móvil que ofrece una experiencia de aprendizaje única mediante:
- **Selección de roles**: Los usuarios pueden elegir entre diferentes roles de aprendizaje
- **Desafíos interactivos**: Sistema de retos que adaptan el contenido según el rol seleccionado
- **Funcionalidades multimedia**: Integración de cámara, audio y animaciones
- **Interfaz moderna**: Diseño intuitivo y atractivo con componentes UI personalizados

## 🚀 Características Principales

- ✨ **RolePicker**: Componente para selección de roles de usuario
- 📷 **CameraOpener**: Funcionalidad de cámara integrada
- 🎯 **ChallengeScreen**: Pantalla de desafíos interactivos
- 🎨 **Animaciones GSAP**: Efectos visuales fluidos
- 📱 **Multiplataforma**: Compatible con iOS, Android y Web
- 🎤 **Síntesis de voz**: Funcionalidad de texto a voz

## 🛠️ Tecnologías Utilizadas

- **React Native** - Framework principal
- **Expo** - Plataforma de desarrollo
- **GSAP** - Animaciones avanzadas
- **React Native Camera** - Funcionalidad de cámara
- **React Native Speech** - Síntesis de voz
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos (NativeWind)

## 📦 Instalación

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- Expo CLI
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
│   │   ├── UI/
│   │   │   ├── RolePicker.jsx      # Selector de roles
│   │   │   ├── ChallengeScreen.jsx # Pantalla de desafíos
│   │   │   └── CameraOpener.jsx    # Componente de cámara
│   │   ├── challenges/             # Componentes de desafíos
│   │   └── utils/                  # Utilidades
│   ├── services/                   # Servicios y APIs
│   ├── data/                       # Datos estáticos
│   └── styles/                     # Estilos globales
├── App.js                          # Componente principal
├── package.json                    # Dependencias del proyecto
└── README.md                       # Este archivo
```

## 🎯 Uso

1. **Selección de Rol**: Al iniciar la aplicación, el usuario debe seleccionar un rol de aprendizaje
2. **Confirmación**: El sistema confirma la selección del rol
3. **Desafíos**: Se presentan desafíos específicos según el rol elegido
4. **Interacción**: El usuario puede usar la cámara, audio y otras funcionalidades

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo de Expo
- `npm run android` - Ejecuta la app en Android
- `npm run ios` - Ejecuta la app en iOS
- `npm run web` - Ejecuta la app en el navegador web

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**André Saúl** - [GitHub](https://github.com/AndreSaul16)

## 🙏 Agradecimientos

- Equipo de desarrollo de React Native
- Comunidad de Expo
- Contribuidores y testers

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub! 