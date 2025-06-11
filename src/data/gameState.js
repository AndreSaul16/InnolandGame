// src/data/gameState.js

// Esta lista contiene todos los roles posibles en el juego.
const rolesData = {
  'Ciudadano Innovador': {
    icon: 'SparklesIcon',
    description: 'Impulsas la innovación desde la base, conectando ideas con necesidades reales de la comunidad.'
  },
  'Conector del ecosistema': {
    icon: 'LightBulbIcon',
    description: 'Eres el puente entre diferentes actores del ecosistema de innovación, facilitando colaboraciones.'
  },
  'Hacker ético': {
    icon: 'CpuChipIcon',
    description: 'Utilizas la tecnología de manera creativa para resolver problemas sociales y ambientales.'
  },
  'Facilitador de Innovación': {
    icon: 'AcademicCapIcon',
    description: 'Guias procesos de innovación, ayudando a otros a desarrollar sus ideas y proyectos.'
  },
  'Experto en IA': {
    icon: 'CpuChipIcon',
    description: 'Dominas las tecnologías de inteligencia artificial y las aplicas para crear soluciones innovadoras.'
  },
  'Agente Territorial': {
    icon: 'MapPinIcon',
    description: 'Conoces profundamente tu territorio y conectas recursos locales con oportunidades de innovación.'
  },
  'Joven talento': {
    icon: 'SparklesIcon',
    description: 'Traes frescura y nuevas perspectivas, aportando energía y creatividad al ecosistema.'
  },
  'Inversor visionario': {
    icon: 'ChartBarIcon',
    description: 'Identificas y apoyas proyectos con potencial de impacto, invirtiendo en el futuro.'
  },
  'Explorador de tendencias': {
    icon: 'EyeIcon',
    description: 'Anticipas tendencias y oportunidades emergentes, guiando la dirección de la innovación.'
  },
  'Diseñador Flash': {
    icon: 'PaintBrushIcon',
    description: 'Creas experiencias y soluciones visualmente impactantes que conectan emocionalmente.'
  }
};

// Exportar los datos completos como array de objetos
export const PLAYER_ROLES_DATA = Object.entries(rolesData).map(([name, data]) => ({
  name,
  ...data
}));

export default rolesData;