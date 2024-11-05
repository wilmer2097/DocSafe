import React, { useState, useEffect } from 'react'; 
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, KeyboardAvoidingView, Switch } from 'react-native';
import RNFS from 'react-native-fs';
import ReactNativeBiometrics from 'react-native-biometrics';
import CustomAlert from './CustomAlert';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    estado: 'Activo',
    name: '',
    profileImage: null,
    loginCode: '', // Ahora editable
    ciudad: '',
    telefono: '',
    correo: '',
    biometricsEnabled: false,
  });

  const [firstTime, setFirstTime] = useState(true);
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
  const [errorTelefono, setErrorTelefono] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileExists = await RNFS.exists(profilePath);
        if (profileExists) {
          const profileData = await RNFS.readFile(profilePath);
          const savedProfile = JSON.parse(profileData).perfilUsuario;
          setProfile(prev => ({ ...prev, ...savedProfile }));
          setFirstTime(false);
        } else {
          setFirstTime(true);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Error al cargar el perfil: ' + error.message);
      }
    };
    loadProfile();
  }, []);

  const validateEmail = (email) => {
    const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    return pattern.test(email);
  };

  const validateTelefono = (telefono) => {
    if (telefono.length !== 9) {
      setErrorTelefono('El número de teléfono debe contener exactamente 9 dígitos.');
      return false;
    }
    const pattern = /^\d{9}$/;
    if (!pattern.test(telefono)) {
      setErrorTelefono('El número de teléfono debe contener solo dígitos.');
      return false;
    }
    setErrorTelefono(null);
    return true;
  };

  const validateLoginCode = (loginCode) => {
    if (loginCode.length !== 4 || isNaN(loginCode)) {
      Alert.alert('Error', 'El código de acceso debe tener 4 dígitos.');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (isSubmitting) {
      return;
    }
  
    setIsSubmitting(true);
    
    // Validaciones
    if (!profile.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      setIsSubmitting(false);
      return;
    }
  
    if (!validateEmail(profile.correo)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido.');
      setIsSubmitting(false);
      return;
    }
  
    if (!validateTelefono(profile.telefono)) {
      Alert.alert('Error', errorTelefono);
      setIsSubmitting(false);
      return;
    }
  
    if (!validateLoginCode(profile.loginCode)) {
      setIsSubmitting(false);
      return;
    }
  
    try {
      if (firstTime) {
        // Crear nuevo perfil (similar al código existente para creación)
        const datosPerfil = {
          a: "I",
          nombre: profile.name,
          correo: profile.correo,
          telefono: profile.telefono,
          ciudad: profile.ciudad,
          tec_ope_pass: profile.loginCode,
          fec_ini: new Date().toISOString().split('T')[0],
          fec_fin: "2025-10-01",
          fec_cre: new Date().toISOString().split('T')[0],
          tec_prf_id: 13,
          ope_estado_id: 1,
        };
  
        const response = await fetch('https://biblioteca1.info/docsafe/api/registrar_users.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datosPerfil),
        });
  
        const result = await response.json();
        if (response.ok && result.success === true) {
          const clienteId = result.cliente_id;
          await setProfile(prev => ({ ...prev, clienteId }));
  
          const newProfile = JSON.stringify({ perfilUsuario: { ...profile, clienteId } });
          await RNFS.writeFile(profilePath, newProfile, 'utf8');
          setShowAlert(true);
        } else {
          Alert.alert('Error', 'Hubo un problema al registrar el usuario.');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Actualizar perfil existente
        const datosPerfilActualizados = {
          a: "U",
          cliente_id: profile.clienteId,
          nombre: profile.name,
          correo: profile.correo,
          telefono: profile.telefono,
          ciudad: profile.ciudad,
          tec_ope_pass: profile.loginCode,  // Código de acceso actualizado
          fec_mod: new Date().toISOString().split('T')[0],
          fec_ini: "2024-10-27",  // Fecha de inicio
          fec_fin: "2024-11-27",  // Fecha de fin
          ope_estado_id: 1,
        };
  
        const response = await fetch('https://biblioteca1.info/docsafe/api/registrar_users.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datosPerfilActualizados),
        });
  
        const result = await response.json();
        if (response.ok && result.success === true) {
          const updatedProfile = JSON.stringify({ perfilUsuario: profile });
          await RNFS.writeFile(profilePath, updatedProfile, 'utf8');
          setShowAlert(true);
        } else {
          Alert.alert('Error', 'Hubo un problema al actualizar el perfil.');
          setIsSubmitting(false);
          return;
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al procesar el registro: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleChange = (key, value) => {
    if (key === 'correo') {
      value = value.toLowerCase();
    }

    if (key === 'telefono') {
      const cleanedValue = value.replace(/\D+/g, '').slice(-9);
      setProfile(prev => ({ ...prev, [key]: cleanedValue }));
    } else {
      setProfile(prev => ({ ...prev, [key]: value }));
    }
  };

  const toggleBiometrics = async (enabled) => {
    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    if (available && (biometryType === ReactNativeBiometrics.TouchID || biometryType === ReactNativeBiometrics.Biometrics)) {
      setProfile(prev => ({ ...prev, biometricsEnabled: enabled }));
    } else {
      Alert.alert('Error', 'Autenticación biométrica no disponible en este dispositivo.');
    }
  };

  const onCloseAlert = () => {
    setShowAlert(false);
  };

  const onAcceptAlert = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={profile.profileImage ? { uri: profile.profileImage } : require('../src/presentation/assets/Logo.jpg')}
          style={styles.profileImage}
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={profile.name}
            onChangeText={(text) => handleChange('name', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo"
            value={profile.correo}
            onChangeText={(text) => handleChange('correo', text)}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={profile.telefono}
            onChangeText={(text) => handleChange('telefono', text)}
            keyboardType="phone-pad"
            maxLength={12}
          />
          {errorTelefono && <Text style={styles.error}>{errorTelefono}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Código de acceso</Text>
          <TextInput
            style={styles.input}
            placeholder="Código de acceso"
            value={profile.loginCode}
            onChangeText={(text) => handleChange('loginCode', text)}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Habilitar autenticación biométrica</Text>
          <Switch
            value={profile.biometricsEnabled}
            onValueChange={(value) => toggleBiometrics(value)}
          />
        </View>

        {!firstTime && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ciudad</Text>
              <TextInput
                style={styles.input}
                placeholder="Ciudad"
                value={profile.ciudad}
                onChangeText={(text) => handleChange('ciudad', text)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Estado</Text>
              <TextInput
                style={styles.input}
                value={profile.estado}
                editable={false}
              />
            </View>
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
      {showAlert && (
        <CustomAlert
          visible={showAlert}
          onClose={onCloseAlert}
          onAccept={onAcceptAlert}
          title="Perfil Guardado"
          message="Tu perfil ha sido guardado exitosamente."
          token={profile.loginCode}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: '#165bbd',
    borderWidth: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    color: '#333',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#155abd',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileScreen;
