import React from 'react';
// Importamos SafeAreaView para asegurar que se vea bien en todos los dispositivos.
import { SafeAreaView, Alert } from 'react-native';

// 1. Cambiamos la importación para apuntar a RolePicker.
// Asegúrate de que esta ruta sea la correcta para tu proyecto.
import RolePicker from './src/components/UI/RolePicker'; 

export default function App() {

  console.log('--- App de Depuración para RolePicker Activa ---');

  // 2. Creamos una función de prueba para manejar la confirmación del rol.
  // Cuando pulses el botón "Continuar", esta función se ejecutará.
  const handleRoleSelection = (role) => {
    console.log('Rol seleccionado:', role);
    Alert.alert(
      "Rol Confirmado",
      `Has seleccionado el rol: ${role}`
    );
  };

  return (
    // Usamos un SafeAreaView para que el contenido no se solape con la barra de estado.
    <SafeAreaView className="flex-1">
      
      {/* 3. Renderizamos únicamente el componente RolePicker. */}
      {/* Le pasamos la función que hemos creado como la prop `onRoleConfirm`. */}
      <RolePicker 
        onRoleConfirm={handleRoleSelection}
      />

    </SafeAreaView>
  );
}
