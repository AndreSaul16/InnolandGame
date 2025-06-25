import React, { createContext, useState, useEffect } from 'react';
import { auth, getUserData, getUserActiveRoom, saveBattleModeState, getBattleModeState, deleteBattleModeState } from '../services/FirebaseDataService';
import { Platform } from 'react-native';
import LoadingScreen from '../utils/LoadingScreen';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión de usuario con Firebase Auth y comprobar sala activa
  useEffect(() => {
    setLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser.uid);
          setUser({ ...firebaseUser, ...userData });
          // Buscar si el usuario está en una sala activa
          const activeRoom = await getUserActiveRoom(firebaseUser.uid);
          if (activeRoom) {
            setRoomCode(activeRoom.roomCode);
            setUserRole(null); // Si quieres restaurar roles, añade lógica aquí
          } else {
            setRoomCode(null);
            setUserRole(null);
          }
          // Restaurar battleState SIEMPRE desde Firebase
          try {
            const battleData = await getBattleModeState(firebaseUser.uid);
            if (battleData) {
              setBattleState(battleData);
            } else {
              setBattleState(null);
            }
          } catch (err) {
            setBattleState(null);
            console.error('[UserContext] Error restaurando battleState desde Firebase:', err);
          }
        } catch (e) {
          setUser(firebaseUser); // fallback
          setRoomCode(null);
          setUserRole(null);
          setBattleState(null);
        }
      } else {
        setUser(null);
        setRoomCode(null);
        setUserRole(null);
        setBattleState(null); // Limpiar battleState al cerrar sesión
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Guardar battleState en Firebase cuando cambie
  useEffect(() => {
    if (user && user.uid && battleState) {
      saveBattleModeState(user.uid, battleState);
    }
    // No borrar battleState en Firebase automáticamente cuando es null
  }, [battleState, user]);

  // Guardar y restaurar roomCode en localStorage solo en web
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedRoom = window.localStorage.getItem('roomCode');
      if (savedRoom) setRoomCode(savedRoom);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (roomCode) {
        window.localStorage.setItem('roomCode', roomCode);
      } else {
        window.localStorage.removeItem('roomCode');
      }
    }
  }, [roomCode]);

  if (loading) return <LoadingScreen message="Restaurando sesión..." />;

  return (
    <UserContext.Provider value={{ user, setUser, roomCode, setRoomCode, userRole, setUserRole, battleState, setBattleState, loading }}>
      {children}
    </UserContext.Provider>
  );
};