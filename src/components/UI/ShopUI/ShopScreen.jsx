import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../../theme';
import { UserContext } from '../../../context/UserContext';
import { getUsersTotalMagnetos, addMagnetosToUser } from '../../../services/FirebaseDataService';
import { showAlert } from '../../../utils/showAlert';
import { useNavigation } from '@react-navigation/native';

// Lista inicial de artículos disponibles en la tienda
const ITEMS = [
  { id: 'item1', name: 'Avatar Especial', cost: 100, icon: 'account-star' },
  { id: 'item2', name: 'Power-Up', cost: 75, icon: 'flash' },
  { id: 'item3', name: 'Color Tema', cost: 50, icon: 'palette' },
  { id: 'item4', name: 'Sticker Exclusivo', cost: 30, icon: 'sticker' },
];

const ShopScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [magnetos, setMagnetos] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar los magnetos totales del usuario
  const loadMagnetos = async () => {
    if (!user) return;
    try {
      const totals = await getUsersTotalMagnetos([user.uid]);
      setMagnetos(totals[user.uid] ?? 0);
    } catch (e) {
      console.warn('Error obteniendo magnetos:', e);
    }
  };

  useEffect(() => {
    loadMagnetos();
  }, [user]);

  // Maneja el canje de un artículo
  const handleRedeem = async (item) => {
    if (!user) return;
    if (magnetos < item.cost) {
      showAlert('Sin Magnetos', 'No tienes suficientes magnetos para esta compra.');
      return;
    }
    try {
      setLoading(true);
      // Restamos los magnetos usando una transacción atómica negativa
      await addMagnetosToUser(user.uid, -item.cost);
      await loadMagnetos();
      showAlert('¡Éxito!', `Has canjeado ${item.name} por ${item.cost} magnetos.`);
    } catch (e) {
      showAlert('Error', 'No se pudo completar la compra. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <MaterialCommunityIcons name={item.icon} size={48} color={COLORS.blue} />
      <Text style={styles.itemName}>{item.name}</Text>
      <View style={styles.costContainer}>
        <MaterialCommunityIcons name="magnet" size={20} color={COLORS.blue} />
        <Text style={styles.costText}>{item.cost}</Text>
      </View>
      <TouchableOpacity
        style={[styles.redeemButton, (magnetos < item.cost) && styles.redeemButtonDisabled]}
        onPress={() => handleRedeem(item)}
        disabled={magnetos < item.cost || loading}
        activeOpacity={0.8}
      >
        <Text style={styles.redeemButtonText}>Canjear</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.blue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tienda</Text>
        {/* Espaciador para centrar el título */}
        <View style={{ width: 24 }} />
      </View>

      {/* Magnetos actuales */}
      <View style={styles.magnetosContainer}>
        <MaterialCommunityIcons name="magnet" size={32} color={COLORS.blue} />
        <Text style={styles.magnetosText}>{magnetos}</Text>
      </View>

      {/* Lista de artículos */}
      <FlatList
        data={ITEMS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.darkBlue,
  },
  magnetosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  magnetosText: {
    marginLeft: 8,
    fontSize: 24,
    fontFamily: FONTS.title,
    color: COLORS.darkBlue,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  itemName: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.darkBlue,
    marginVertical: 8,
    textAlign: 'center',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  costText: {
    marginLeft: 4,
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.darkBlue,
  },
  redeemButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  redeemButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});

export default ShopScreen; 