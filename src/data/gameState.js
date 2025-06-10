// src/data/gameState.js

// Esta lista contiene todos los roles posibles en el juego.
export const PLAYER_ROLES = [
    'Ciudadano Innovador', 'Conector del ecosistema', 'Hacker ético', 'Facilitador de Innovación', 
    'Experto en IA', 'Agente Territorial', 'Joven talento', 'Inversor visionario', 
    'Explorador de tendencias', 'Diseñador Flash'
  ];
  
  // Este objeto simula la información del jugador activo.
  // En el futuro, esto podría venir de un login o una base de datos.
  export const currentUser = {
    name: 'Andrés',
    defaultRole: PLAYER_ROLES[0], // El rol por defecto al empezar
    // ... aquí podrían ir otros datos como magnetos, etc.
  };
  