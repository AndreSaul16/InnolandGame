import React, { createContext, useState, useEffect } from 'react';
import { auth, getUserData, getUserActiveRoom } from '../services/FirebaseDataService';
import { getDatabase, ref, get } from 'firebase/database';
import LoadingScreen from '../utils/LoadingScreen';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [userRole, setUserRole] = useState(null);
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
            // Leer el rol del usuario en la sala activa
            const db = getDatabase();
            const playerRef = ref(db, `rooms/${activeRoom.roomCode}/players/${firebaseUser.uid}`);
            const playerSnap = await get(playerRef);
            if (playerSnap.exists()) {
              setUserRole(playerSnap.val().role || null);
            } else {
              setUserRole(null);
            }
          } else {
            setRoomCode(null);
            setUserRole(null);
          }
        } catch (e) {
          setUser(firebaseUser); // fallback
          setRoomCode(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setRoomCode(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    <UserContext.Provider value={{ user, setUser, roomCode, setRoomCode, userRole, setUserRole, loading }}>
      {children}
    </UserContext.Provider>
  );
}; 