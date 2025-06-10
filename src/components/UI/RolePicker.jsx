import React, { useState, useRef, useEffect } from "react";
// Importamos los componentes básicos de React Native que usaremos para construir la interfaz.
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
// El componente StatusBar nos permite controlar la barra de estado del teléfono (donde está la hora, batería, etc.).
import { StatusBar } from "expo-status-bar";
// Iconos para hacer la interfaz más atractiva.
import { 
  UserCircleIcon, 
  CheckCircleIcon, 
  ArrowLeftIcon,
  SparklesIcon,
  LightBulbIcon,
  CpuChipIcon,
  MapPinIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  PaintBrushIcon
} from "react-native-heroicons/solid";
// Importamos los datos del juego: la lista de roles y la información del usuario actual.
import { PLAYER_ROLES, currentUser } from "../../data/gameState";
import { AutoFocus } from "expo-camera/build/legacy/Camera.types";
import { gsap } from "gsap";

// Obtenemos las dimensiones de la pantalla para las animaciones
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Mapeo de iconos para cada rol
const roleIcons = {
  'Ciudadano Innovador': SparklesIcon,
  'Conector del ecosistema': LightBulbIcon,
  'Hacker ético': CpuChipIcon,
  'Facilitador de Innovación': AcademicCapIcon,
  'Experto en IA': CpuChipIcon,
  'Agente Territorial': MapPinIcon,
  'Joven talento': SparklesIcon,
  'Inversor visionario': ChartBarIcon,
  'Explorador de tendencias': EyeIcon,
  'Diseñador Flash': PaintBrushIcon,
};

// Descripciones detalladas para cada rol
const roleDescriptions = {
  'Ciudadano Innovador': 'Impulsas la innovación desde la base, conectando ideas con necesidades reales de la comunidad.',
  'Conector del ecosistema': 'Eres el puente entre diferentes actores del ecosistema de innovación, facilitando colaboraciones.',
  'Hacker ético': 'Utilizas la tecnología de manera creativa para resolver problemas sociales y ambientales.',
  'Facilitador de Innovación': 'Guias procesos de innovación, ayudando a otros a desarrollar sus ideas y proyectos.',
  'Experto en IA': 'Dominas las tecnologías de inteligencia artificial y las aplicas para crear soluciones innovadoras.',
  'Agente Territorial': 'Conoces profundamente tu territorio y conectas recursos locales con oportunidades de innovación.',
  'Joven talento': 'Traes frescura y nuevas perspectivas, aportando energía y creatividad al ecosistema.',
  'Inversor visionario': 'Identificas y apoyas proyectos con potencial de impacto, invirtiendo en el futuro.',
  'Explorador de tendencias': 'Anticipas tendencias y oportunidades emergentes, guiando la dirección de la innovación.',
  'Diseñador Flash': 'Creas experiencias y soluciones visualmente impactantes que conectan emocionalmente.',
};

// --- DEFINICIÓN DEL COMPONENTE ---
// RolePicker es un componente funcional que recibe una prop: `onRoleConfirm`.
// `onRoleConfirm` es una función que se llamará cuando el usuario pulse el botón "Continuar".
const RolePicker = ({ onRoleConfirm }) => {
  // --- ESTADO DEL COMPONENTE ---
  // Usamos el hook `useState` para crear una variable de estado llamada `selectedRole`.
  // Esta variable guardará el rol que el usuario ha seleccionado.
  // Se inicializa con el valor `currentUser.defaultRole`.
  // `setSelectedRole` es la función que usamos para actualizar el valor de `selectedRole`.
  const [selectedRole, setSelectedRole] = useState(currentUser.defaultRole);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);
  
  // Referencias para las animaciones GSAP
  const containerRef = useRef(null);
  const rolesListRef = useRef(null);
  const expandedViewRef = useRef(null);
  const roleButtonsRefs = useRef({});

  // Función para manejar el click en un rol
  const handleRoleClick = (role) => {
    if (isExpanded && expandedRole === role) {
      // Si ya está expandido y clickeamos el mismo rol, volvemos al estado inicial
      animateToInitialState();
    } else if (!isExpanded) {
      // Si no está expandido, expandimos el rol clickeado
      setSelectedRole(role);
      setExpandedRole(role);
      setIsExpanded(true);
      animateToExpandedState(role);
    } else {
      // Si está expandido pero clickeamos otro rol, cambiamos al nuevo rol
      setSelectedRole(role);
      setExpandedRole(role);
      animateRoleChange(role);
    }
  };

  // Animación para expandir un rol
  const animateToExpandedState = (role) => {
    const timeline = gsap.timeline();
    
    // Ocultamos los otros roles con una animación suave
    PLAYER_ROLES.forEach((r) => {
      if (r !== role && roleButtonsRefs.current[r]) {
        timeline.to(roleButtonsRefs.current[r], {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          ease: "power2.out"
        }, 0);
      }
    });

    // Expandimos el rol seleccionado
    if (roleButtonsRefs.current[role]) {
      timeline.to(roleButtonsRefs.current[role], {
        position: 'absolute',
        top: screenHeight * 0.2,
        left: screenWidth * 0.1,
        width: screenWidth * 0.8,
        height: screenHeight * 0.6,
        zIndex: 1000,
        duration: 0.5,
        ease: "power2.inOut"
      }, 0.2);

      timeline.to(roleButtonsRefs.current[role], {
        scale: 1.1,
        duration: 0.3,
        ease: "back.out(1.7)"
      }, 0.5);
    }

    // Mostramos la vista expandida
    timeline.to(expandedViewRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 0.4);
  };

  // Animación para volver al estado inicial
  const animateToInitialState = () => {
    const timeline = gsap.timeline();
    
    // Ocultamos la vista expandida
    timeline.to(expandedViewRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in"
    });

    // Restauramos todos los roles a su posición original
    PLAYER_ROLES.forEach((role) => {
      if (roleButtonsRefs.current[role]) {
        timeline.to(roleButtonsRefs.current[role], {
          position: 'relative',
          top: 'auto',
          left: 'auto',
          width: 'auto',
          height: 'auto',
          zIndex: 1,
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        }, 0.2);
      }
    });

    timeline.call(() => {
      setIsExpanded(false);
      setExpandedRole(null);
    });
  };

  // Animación para cambiar de rol expandido
  const animateRoleChange = (newRole) => {
    const timeline = gsap.timeline();
    
    // Ocultamos el rol anterior
    if (expandedRole && roleButtonsRefs.current[expandedRole]) {
      timeline.to(roleButtonsRefs.current[expandedRole], {
        opacity: 0,
        scale: 0.9,
        duration: 0.2,
        ease: "power2.in"
      });
    }

    // Expandimos el nuevo rol
    if (roleButtonsRefs.current[newRole]) {
      timeline.to(roleButtonsRefs.current[newRole], {
        opacity: 1,
        scale: 1.1,
        duration: 0.3,
        ease: "back.out(1.7)"
      }, 0.2);
    }
  };

  // --- ESTRUCTURA VISUAL (JSX) ---
  // El `return` define lo que el componente va a mostrar en pantalla.
  return (
    // `SafeAreaView` es el contenedor principal. Se asegura de que el contenido no quede
    // oculto por el "notch" o la barra de estado en los iPhones.
    // Le aplicamos el estilo `styles.container` que hemos definido abajo.
    <SafeAreaView style={styles.container}>
      {/* Este componente controla la barra de estado. `style="light"` hace que el texto (hora, etc.) sea blanco. */}
      <StatusBar style="light" />

      {/* Header con título y botón de confirmación */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Elige tu Rol</Text>
          <Text style={styles.subtitle}>
            Tu rol definirá cómo la IA evaluará tus respuestas
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => onRoleConfirm(selectedRole)}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmButtonText}>Confirmar</Text>
          <CheckCircleIcon size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Contenedor principal */}
      <View style={styles.mainContainer} ref={containerRef}>
        {/* Lista de roles en dos columnas */}
        <View style={styles.rolesList} ref={rolesListRef}>
          {PLAYER_ROLES.map((role, index) => {
            const IconComponent = roleIcons[role] || UserCircleIcon;
            const isSelected = selectedRole === role;
            const isExpandedRole = expandedRole === role;
            
            return (
              <View 
                key={role} 
                style={[
                  styles.roleContainer,
                  { opacity: isExpanded && !isExpandedRole ? 0 : 1 }
                ]}
                ref={(el) => {
                  if (el) roleButtonsRefs.current[role] = el;
                }}
              >
                <TouchableOpacity
                  onPress={() => handleRoleClick(role)}
                  style={[
                    styles.roleButton,
                    isSelected ? styles.roleButtonSelected : styles.roleButtonUnselected,
                    isExpandedRole && styles.roleButtonExpanded
                  ]}
                  activeOpacity={0.8}
                >
                  <IconComponent
                    size={isExpandedRole ? 48 : 32}
                    color={isSelected ? "white" : "#9ca3af"}
                  />
                  <Text style={[
                    styles.roleText,
                    isExpandedRole && styles.roleTextExpanded
                  ]}>
                    {role}
                  </Text>
                  
                  {/* Descripción que aparece cuando está expandido */}
                  {isExpandedRole && (
                    <Text style={styles.roleDescription}>
                      {roleDescriptions[role]}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Vista expandida con detalles del rol */}
        <View 
          style={styles.expandedView} 
          ref={expandedViewRef}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          {isExpanded && expandedRole && (
            <View style={styles.expandedContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={animateToInitialState}
              >
                <ArrowLeftIcon size={24} color="white" />
                <Text style={styles.backButtonText}>Volver</Text>
              </TouchableOpacity>
              
              <View style={styles.expandedRoleInfo}>
                <Text style={styles.expandedRoleTitle}>{expandedRole}</Text>
                <Text style={styles.expandedRoleDescription}>
                  {roleDescriptions[expandedRole]}
                </Text>
                
                {/* Aquí podrías agregar más detalles del rol */}
                <View style={styles.roleStats}>
                  <Text style={styles.statsTitle}>Características del rol:</Text>
                  <Text style={styles.statsText}>• Innovación y creatividad</Text>
                  <Text style={styles.statsText}>• Colaboración en equipo</Text>
                  <Text style={styles.statsText}>• Pensamiento estratégico</Text>
                  <Text style={styles.statsText}>• Adaptabilidad al cambio</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- DEFINICIÓN DE ESTILOS ---
// `StyleSheet.create` es una forma optimizada de crear objetos de estilo en React Native.
// Cada clave en este objeto (ej. `container`) es un conjunto de reglas de estilo
// que podemos aplicar a nuestros componentes de arriba.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", // Fondo más oscuro y moderno
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  
  titleContainer: {
    flex: 1,
  },
  
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    maxWidth: 200,
  },
  
  confirmButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  
  rolesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  
  roleContainer: {
    width: '48%', // Dos columnas con gap
    aspectRatio: 1.2, // Proporción cuadrada
    marginBottom: 12,
  },
  
  roleButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  roleButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
  },
  
  roleButtonUnselected: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  
  roleButtonExpanded: {
    backgroundColor: '#1E40AF',
    borderColor: '#60A5FA',
    shadowColor: '#1E40AF',
    shadowOpacity: 0.6,
  },
  
  roleText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  
  roleTextExpanded: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
  },
  
  roleDescription: {
    color: '#E2E8F0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    opacity: 0.9,
  },
  
  expandedView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    opacity: 0,
    zIndex: 1000,
  },
  
  expandedContent: {
    flex: 1,
    padding: 20,
  },
  
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  expandedRoleInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  expandedRoleTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  expandedRoleDescription: {
    color: '#E2E8F0',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    maxWidth: 300,
  },
  
  roleStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  
  statsTitle: {
    color: '#60A5FA',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  statsText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
});

export default RolePicker;