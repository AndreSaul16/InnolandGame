🎮 InnolandGame - Beta Abierta
Un juego educativo interactivo desarrollado con React Native y Expo que combina aprendizaje con diversión a través de desafíos gamificados y experiencias multijugador. Beta Abierta - Disponible para testing y feedback de la comunidad.

InnolandGame es una aplicación móvil innovadora que ofrece una experiencia de aprendizaje única mediante:

Sistema de salas multijugador: Crea o únete a salas de juego para competir con otros jugadores.

Selección de roles especializados: 10 roles únicos con enfoques específicos de aprendizaje e innovación.

Desafíos interactivos con IA: Sistema de validación inteligente que adapta las respuestas según el rol del jugador.

Escáner QR integrado: Funcionalidad de cámara para escanear códigos QR y activar desafíos.

Sistema de puntuación: Magnetos como moneda virtual para incentivar la participación.

Interfaz moderna y responsive: Diseño adaptativo que funciona en diferentes tamaños de pantalla.

🎯 Sistema de Juego
✨ RolePicker: Selección entre 10 roles especializados (Experto en IA, Agente Territorial, Inversor Visionario, etc.).

🏠 HomeScreen: Dashboard personalizado con estadísticas y acceso rápido a funciones.

🎮 GameScreen: Experiencia de juego completa con eventos en tiempo real.

🏆 ScoreBoard: Sistema de puntuación y ranking de jugadores.

📊 ResultsScreen: Análisis detallado de resultados post-partida.

📱 Funcionalidades Técnicas
📷 CameraOpener: Escáner QR integrado con detección automática.

🎯 ChallengeUI: Interfaz de desafíos con validación por IA.

🔄 Sistema de salas: Creación y gestión de salas multijugador en tiempo real.

🎤 Síntesis de voz: Funcionalidad de texto a voz con Expo Speech.

🔒 Autenticación Firebase: Sistema seguro de usuarios y perfiles.

🌐 Multiplataforma: Compatible con iOS, Android y Web.

🎨 Experiencia de Usuario
🎨 Animaciones fluidas: Efectos visuales con React Native Reanimated.

📱 Diseño responsive: Adaptación automática a diferentes dispositivos.

🎭 AvatarPicker: Personalización de perfiles de usuario.

🔔 Modales interactivos: Sistema de eventos y notificaciones en tiempo real.

Core Framework
React Native 0.74.5 - Framework principal

Expo SDK 51 - Plataforma de desarrollo y build

TypeScript - Tipado estático para mayor robustez

Funcionalidades Avanzadas
Firebase 11.9.1 - Backend como servicio (autenticación, base de datos en tiempo real)

React Native Reanimated 3.10 - Animaciones de alto rendimiento

Expo Camera 15.0 - Funcionalidad de cámara y escáner QR

Expo Speech 12.0 - Síntesis de voz

React Navigation 7.1 - Navegación entre pantallas

UI/UX y Utilidades
React Native Gesture Handler - Gestos nativos

React Native SVG - Gráficos vectoriales

React Native Heroicons - Iconografía moderna

Axios - Cliente HTTP para APIs

JSqr - Procesamiento de códigos QR

Prerrequisitos
Node.js (versión 16 o superior)

npm o yarn

Expo CLI (npm install -g @expo/cli)

Android Studio (para desarrollo Android)

Xcode (para desarrollo iOS, solo macOS)

Pasos de Instalación
Clonar el repositorio

git clone https://github.com/AndreSaul16/InnolandGame.git
cd InnolandGame

Instalar dependencias

npm install
# o
yarn install

Configurar variables de entorno

# Crear archivo .env en la raíz del proyecto
# Añadir configuraciones de Firebase y OpenAI

Iniciar el proyecto

npm start
# o
yarn start

Ejecutar en dispositivo/simulador

# Para Android
npm run android

# Para iOS
npm run ios

# Para Web
npm run web

InnolandGame/
├── src/
│   ├── components/
│   │   ├── UI/                   # Componentes de interfaz
│   │   │   ├── GameUI/           # Componentes del juego
│   │   │   │   ├── GameScreen.jsx    # Pantalla principal del juego
│   │   │   │   ├── ScoreBoard.jsx    # Tabla de puntuaciones
│   │   │   │   ├── ResultsScreen.jsx # Pantalla de resultados
│   │   │   │   └── ...             # Otros componentes de juego
│   │   │   ├── HomeUI/           # Componentes del home
│   │   │   │   ├── HomeScreen.jsx    # Pantalla principal
│   │   │   │   ├── ProfileHeader.jsx # Cabecera de perfil
│   │   │   │   └── ...             # Otros componentes del home
│   │   │   ├── LoginUI/          # Sistema de autenticación
│   │   │   ├── RoomUI/           # Gestión de salas
│   │   │   ├── UserUI/           # Perfil de usuario
│   │   │   ├── RolePicker/       # Selector de roles
│   │   │   ├── CameraOpener.jsx    # Escáner QR
│   │   │   ├── ChallengeUI.jsx     # Interfaz de desafíos
│   │   │   └── UIController.jsx    # Controlador principal
│   │   ├── challenges/           # Lógica de desafíos
│   │   └── utils/                # Utilidades y helpers
│   ├── services/                 # Servicios y APIs
│   │   ├── FirebaseDataService.js  # Servicio de Firebase
│   │   └── OpenAIService.jsx       # Integración con IA
│   ├── context/                  # Contextos de React
│   ├── data/                     # Datos estáticos y configuración
│   │   └── challenges.json       # Base de datos de desafíos
│   ├── styles/                   # Estilos globales
│   └── theme.js                  # Configuración de tema
├── assets/                       # Recursos multimedia
│   ├── fonts/                    # Fuentes personalizadas
│   ├── logo/                     # Logotipos
│   └── roles/                    # Imágenes de roles
├── functions/                    # Firebase Cloud Functions
├── App.js                        # Componente principal
├── package.json                  # Dependencias del proyecto
├── app.json                      # Configuración de Expo
└── README.md                     # Este archivo

1. Registro y Autenticación
Crea una cuenta o inicia sesión con Firebase Auth.

Personaliza tu perfil con avatar y información básica.

2. Selección de Rol
Elige entre 10 roles especializados:

🤖 Experto en IA - Enfoque en inteligencia artificial y machine learning.

🌍 Agente Territorial - Conocimiento del ecosistema local aragonés.

💰 Inversor Visionario - Perspectiva de modelos de negocio y escalabilidad.

🔗 Conector del Ecosistema - Facilitación de colaboraciones.

🎨 Diseñador Flash - Creatividad y diseño de experiencias.

🔍 Explorador de Tendencias - Identificación de oportunidades emergentes.

🚀 Facilitador de Innovación - Metodologías de innovación.

🛡️ Hacker Ético - Seguridad y soluciones tecnológicas responsables.

💡 Ciudadano Innovador - Perspectiva centrada en el usuario.

⭐ Joven Talento - Enfoque fresco y disruptivo.

3. Experiencia de Juego
Crear sala: Inicia una nueva partida y comparte el código.

Unirse a sala: Ingresa un código para participar en partidas existentes.

Escanear QR: Usa la cámara para activar desafíos específicos.

Responder desafíos: La IA evalúa tus respuestas según tu rol.

Ganar magnetos: Acumula puntos por respuestas correctas y participación.

4. Desafíos Disponibles
🍷 Conectando Viñedos - Integración tecnológica en la industria vinícola.

🏭 Gigantes de Teruel - Conocimiento del ecosistema empresarial local.

🎒 Mochila Digital Rural - Herramientas para emprendimiento rural.

🌾 AgroTech Aragonés - Innovación en agricultura.

🎉 Fiestas del Pilar 2.0 - Mejora de experiencias en eventos masivos.

npm start - Inicia el servidor de desarrollo de Expo.

npm run android - Ejecuta la app en Android.

npm run ios - Ejecuta la app en iOS.

npm run web - Ejecuta la app en el navegador web.

npm run build:web - Genera build para web.

npm run build:android - Build para Android con EAS.

Permisos Requeridos
📷 Cámara: Para escanear códigos QR de desafíos.

🎤 Audio: Para funcionalidades de síntesis de voz.

🌐 Internet: Para sincronización en tiempo real con Firebase.

Variables de Entorno (.env)
# Firebase Configuration
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_dominio
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_STORAGE_BUCKET=tu_bucket
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id

# OpenAI Configuration
OPENAI_API_KEY=tu_openai_key

Versión actual: 1.0.0-beta

Estado: Beta Abierta para Testing Comunitario

✅ Funcionalidades Completamente Implementadas
✨ Sistema completo de autenticación y perfiles de usuario.

🎮 Experiencia de juego multijugador en tiempo real.

🎯 10 roles especializados con lógica diferenciada.

📷 Escáner QR integrado con detección automática.

🤖 Validación de respuestas con IA (OpenAI GPT).

🏆 Sistema de puntuación con magnetos.

📊 Dashboard de estadísticas y resultados.

🔄 Gestión de salas multijugador.

🎨 Interfaz responsive y animaciones fluidas.

🌐 Soporte completo para iOS, Android y Web.

🔄 En Desarrollo Activo
🎵 Mejoras en efectos de audio y feedback sonoro.

📈 Analytics avanzados de rendimiento de jugadores.

🌍 Localización en múltiples idiomas.

🔧 Optimizaciones de rendimiento en dispositivos de gama baja.

🎨 Nuevos temas visuales y personalización.

📋 Roadmap Próximas Funcionalidades
🏅 Sistema de logros y badges.

📱 Modo offline para jugar sin conexión.

🎯 Desafíos generados dinámicamente por IA.

👥 Sistema de equipos y torneos.

📊 Dashboard para educadores y facilitadores.

🔗 Integración con plataformas educativas (Moodle, Canvas).

🎪 Modo evento para competiciones masivas.

Como Tester
Descarga la app desde los canales de distribución beta.

Explora todas las funcionalidades disponibles.

Reporta bugs usando el sistema de issues de GitHub.

Comparte feedback sobre la experiencia de usuario.

Sugiere mejoras para futuras versiones.

Como Desarrollador
Fork el repositorio.

Crea una rama para tu feature (git checkout -b feature/NuevaFuncionalidad).

Implementa siguiendo los principios SOLID y Clean Code.

Commit tus cambios (git commit -m 'Añadir nueva funcionalidad').

Push a tu rama (git push origin feature/NuevaFuncionalidad).

Abre un Pull Request con descripción detallada.

Para reportar bugs o sugerir mejoras:

Revisa si ya existe un issue similar.

Crea un nuevo issue con:

Descripción clara del problema.

Pasos para reproducir.

Dispositivo y versión del SO.

Screenshots o videos si es relevante.

Logs de error si están disponibles.

Template de Bug Report
**Descripción del Bug**
Descripción clara y concisa del problema.

**Pasos para Reproducir**
1. Ir a '...'
2. Hacer clic en '....'
3. Observar error

**Comportamiento Esperado**
Descripción de lo que debería ocurrir.

**Screenshots**
Si aplica, añadir screenshots.

**Información del Dispositivo:**
- Dispositivo: [ej. iPhone 12, Samsung Galaxy S21]
- SO: [ej. iOS 15.1, Android 12]
- Versión de la App: [ej. 1.0.0-beta]

Directrices de Contribución
Código limpio: Seguir principios SOLID y Clean Code.

Documentación: Comentar funciones complejas.

Testing: Incluir tests para nuevas funcionalidades.

Consistencia: Mantener el estilo de código existente.

Comunidad
💬 Discusiones: Usa GitHub Discussions para ideas y preguntas.

🐛 Issues: Para bugs y feature requests.

📧 Contacto directo: Para colaboraciones especiales.


André Saúl - Desarrollador Principal

📧 Email: andresaul16s@gmail.com

🐙 GitHub: @AndreSaul16

🔗 LinkedIn: https://www.linkedin.com/in/sbriceño/


Para Usuarios
⭐ ¡Dale una estrella al proyecto si te gusta! 📱 Descarga la beta y comparte tu experiencia 🗣️ Recomienda InnolandGame a tu comunidad

Para Desarrolladores
🔧 Contribuye al código y mejora la plataforma 📖 Mejora la documentación 🧪 Ayuda con testing y QA

Para Educadores
🎓 Prueba InnolandGame en tus clases 📊 Comparte resultados y casos de uso 💡 Sugiere nuevos desafíos educativos

🚀 InnolandGame - Donde la innovación se encuentra con la diversión

Versión Beta Abierta - Tu feedback es fundamental para crear la mejor experiencia de aprendizaje gamificado.
