import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CameraIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  PhoneIcon,
  StarIcon,
} from 'react-native-heroicons/solid';
import { COLORS, FONTS } from '../../../theme';
import {
  getUserData,
  updateUserProfile,
  uploadProfileImage,
  updateUserEmail,
  updateUserPassword,
  deleteProfileImage,
} from '../../../services/FirebaseDataService';
import { showAlert } from '../../../utils/showAlert';
import AvatarPicker, { AVATAR_IMAGES } from './AvatarPicker';

const ProfileScreen = ({ user, onGoBack }) => {
  // Estados para los datos del usuario
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Estados para la edición
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  
  // Estados para cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Animaciones
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Cargar datos actualizados del usuario
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const freshUserData = await getUserData(user.uid);
      setUserData(freshUserData);
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  };

  const handleSelectAvatar = async (avatarSource) => {
    setImageLoading(true);
    try {
      // Si el avatar es local (require), guardamos el índice
      const avatarIndex = AVATAR_IMAGES.findIndex(img => img === avatarSource);
      let photoValue = avatarIndex !== -1 ? avatarIndex : avatarSource;
      await updateUserProfile(user.uid, { photoURL: photoValue });
      setUserData(prev => ({ ...prev, photoURL: photoValue }));
      showAlert('¡Éxito!', 'Avatar actualizado correctamente');
    } catch (error) {
      showAlert('Error', 'No se pudo actualizar el avatar');
    } finally {
      setImageLoading(false);
    }
  };

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setEditValues({ [field]: currentValue });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = async (field) => {
    setLoading(true);
    try {
      const newValue = editValues[field];
      
      if (field === 'email') {
        // Para email necesitamos la contraseña actual
        Alert.prompt(
          'Confirmar cambio de email',
          'Ingresa tu contraseña actual para confirmar el cambio',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              onPress: async (password) => {
                try {
                  await updateUserEmail(user.uid, newValue, password);
                  setUserData(prev => ({ ...prev, email: newValue }));
                  setEditingField(null);
                  showAlert('¡Éxito!', 'Email actualizado correctamente');
                } catch (error) {
                  showAlert('Error', 'No se pudo actualizar el email. Verifica tu contraseña.');
                }
              },
            },
          ],
          'secure-text'
        );
      } else {
        // Para otros campos, actualizar directamente
        await updateUserProfile(user.uid, { [field]: newValue });
        setUserData(prev => ({ ...prev, [field]: newValue }));
        setEditingField(null);
        showAlert('¡Éxito!', 'Perfil actualizado correctamente');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      showAlert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Error', 'Todos los campos son obligatorios');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      showAlert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    try {
      await updateUserPassword(user.uid, currentPassword, newPassword);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showAlert('¡Éxito!', 'Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      showAlert('Error', 'No se pudo actualizar la contraseña. Verifica tu contraseña actual.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderEditableField = (field, value, icon, label, keyboardType = 'default') => {
    const isEditing = editingField === field;
    
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <View style={styles.fieldIcon}>
            {icon}
          </View>
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
        
        <View style={styles.fieldContent}>
          {isEditing ? (
            <View style={styles.editingContainer}>
              <TextInput
                style={styles.editInput}
                value={editValues[field] || ''}
                onChangeText={(text) => setEditValues(prev => ({ ...prev, [field]: text }))}
                keyboardType={keyboardType}
                autoFocus
                placeholder={`Nuevo ${label.toLowerCase()}`}
                placeholderTextColor={COLORS.gray}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={cancelEditing}
                >
                  <XMarkIcon size={16} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={() => saveField(field)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <CheckIcon size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              <Text style={styles.fieldValue}>{value || 'No especificado'}</Text>
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => startEditing(field, value)}
              >
                <PencilSquareIcon size={20} color={COLORS.blue} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPasswordField = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldIcon}>
          <LockClosedIcon size={20} color={COLORS.blue} />
        </View>
        <Text style={styles.fieldLabel}>Contraseña</Text>
      </View>
      
      <View style={styles.fieldContent}>
        <View style={styles.displayContainer}>
          <Text style={styles.fieldValue}>••••••••</Text>
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => setShowPasswordModal(true)}
          >
            <PencilSquareIcon size={20} color={COLORS.blue} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPasswordModal(false)}
            >
              <XMarkIcon size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {/* Contraseña actual */}
            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Contraseña actual</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                  secureTextEntry={!showPasswords.current}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor={COLORS.gray}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeSlashIcon size={20} color={COLORS.gray} />
                  ) : (
                    <EyeIcon size={20} color={COLORS.gray} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Nueva contraseña */}
            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Nueva contraseña</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                  secureTextEntry={!showPasswords.new}
                  placeholder="Ingresa tu nueva contraseña"
                  placeholderTextColor={COLORS.gray}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeSlashIcon size={20} color={COLORS.gray} />
                  ) : (
                    <EyeIcon size={20} color={COLORS.gray} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                  secureTextEntry={!showPasswords.confirm}
                  placeholder="Confirma tu nueva contraseña"
                  placeholderTextColor={COLORS.gray}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeSlashIcon size={20} color={COLORS.gray} />
                  ) : (
                    <EyeIcon size={20} color={COLORS.gray} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={() => setShowPasswordModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveModalButton]}
              onPress={handlePasswordChange}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveModalButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
            <XMarkIcon size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Foto de perfil */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              {imageLoading ? (
                <View style={styles.profileImagePlaceholder}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : (typeof userData.photoURL === 'number' && AVATAR_IMAGES[userData.photoURL]) ? (
                <Image source={AVATAR_IMAGES[userData.photoURL]} style={styles.profileImage} />
              ) : userData.photoURL ? (
                <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <UserIcon size={48} color={COLORS.gray} />
                </View>
              )}
              
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowAvatarPicker(true)}
                disabled={imageLoading}
              >
                <CameraIcon size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.profileName}>
              {userData.nombre} {userData.apellido}
            </Text>
            <Text style={styles.profileUsername}>@{userData.username}</Text>
          </View>

          {/* Estadísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <StarIcon size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{userData.magnetos_totales || 0}</Text>
              <Text style={styles.statLabel}>Magnetos</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <CalendarDaysIcon size={24} color={COLORS.blue} />
              </View>
              <Text style={styles.statValue}>
                {userData.fecha_creacion ? new Date(userData.fecha_creacion).getFullYear() : '2024'}
              </Text>
              <Text style={styles.statLabel}>Miembro desde</Text>
            </View>
          </View>

          {/* Información del perfil */}
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            {renderEditableField(
              'nombre',
              userData.nombre,
              <UserIcon size={20} color={COLORS.blue} />,
              'Nombre'
            )}
            
            {renderEditableField(
              'apellido',
              userData.apellido,
              <UserIcon size={20} color={COLORS.blue} />,
              'Apellido'
            )}
            
            {renderEditableField(
              'username',
              userData.username,
              <UserIcon size={20} color={COLORS.blue} />,
              'Nombre de usuario'
            )}
            
            {renderEditableField(
              'telefono',
              userData.telefono,
              <PhoneIcon size={20} color={COLORS.blue} />,
              'Teléfono',
              'phone-pad'
            )}
          </View>

          {/* Información de cuenta */}
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Información de Cuenta</Text>
            
            {renderEditableField(
              'email',
              userData.email,
              <EnvelopeIcon size={20} color={COLORS.blue} />,
              'Email',
              'email-address'
            )}
            
            {renderPasswordField()}
            
            {/* Fecha de nacimiento (solo lectura) */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <View style={styles.fieldIcon}>
                  <CalendarDaysIcon size={20} color={COLORS.blue} />
                </View>
                <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldValue}>{formatDate(userData.fechaNacimiento)}</Text>
              </View>
            </View>
          </View>

          {/* Información de seguridad */}
          <View style={[styles.profileSection, styles.lastSection]}>
            <Text style={styles.sectionTitle}>Seguridad</Text>
            
            <View style={styles.securityInfo}>
              <ShieldCheckIcon size={24} color={COLORS.success} />
              <View style={styles.securityText}>
                <Text style={styles.securityTitle}>Cuenta verificada</Text>
                <Text style={styles.securitySubtitle}>
                  Tu cuenta está protegida y verificada
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Modal de cambio de contraseña */}
      {renderPasswordModal()}

      {/* Modal para elegir avatar */}
      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelectAvatar={handleSelectAvatar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.darkBlue,
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 135, 0.2)',
      },
      default: {
        shadowColor: COLORS.darkBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.darkBlue,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileName: {
    fontSize: 24,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.text,
    color: COLORS.gray,
    textAlign: 'center',
  },
  profileSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.blue}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: FONTS.text,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  fieldContent: {
    marginLeft: 44,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.black,
    flex: 1,
  },
  editIcon: {
    padding: 8,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  editActions: {
    flexDirection: 'row',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  saveButton: {
    backgroundColor: COLORS.success,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}10`,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  securityText: {
    marginLeft: 12,
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontFamily: FONTS.text,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  securitySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.text,
    color: COLORS.gray,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.gray}30`,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.text,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.black,
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.gray}30`,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelModalButton: {
    backgroundColor: `${COLORS.gray}20`,
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontFamily: FONTS.text,
    fontWeight: '600',
    color: COLORS.gray,
  },
  saveModalButton: {
    backgroundColor: COLORS.primary,
  },
  saveModalButtonText: {
    fontSize: 16,
    fontFamily: FONTS.text,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },
});

export default ProfileScreen;