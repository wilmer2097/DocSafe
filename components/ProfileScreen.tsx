import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, KeyboardAvoidingView } from 'react-native';
import RNFS from 'react-native-fs';
import CustomAlert from './CustomAlert';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    estado: 'Activo',
    name: '',
    profileImage: null,
    loginCode: '',
    ciudad: '',
    telefono: '',
    correo: '',
  });

  const [firstTime, setFirstTime] = useState(true);
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
  const [errorTelefono, setErrorTelefono] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

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
          const generatedLoginCode = Math.floor(1000 + Math.random() * 9000).toString();
          setProfile(prev => ({ ...prev, loginCode: generatedLoginCode }));
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

  const handleSaveProfile = async () => {
    if (!profile.name.trim() || profile.loginCode.length !== 4) {
      Alert.alert('Error', 'Nombre y un código de acceso de 4 dígitos son requeridos.');
      return;
    }

    if (!validateEmail(profile.correo)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!validateTelefono(profile.telefono)) {
      Alert.alert('Error', errorTelefono);
      return;
    }

    try {
      const newProfile = JSON.stringify({ perfilUsuario: profile });
      await RNFS.writeFile(profilePath, newProfile, 'utf8');
      setShowAlert(true);
    } catch (error) {
      console.error('Error al guardar el perfil:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil: ' + error.message);
    }
  };

  const handleChange = (key, value) => {
    if (key === 'correo') {
      value = value.toLowerCase();
    }
  
    if (key === 'telefono') {
      // Limpiar el número de teléfono para asegurar que solo queden 9 dígitos
      // Eliminar caracteres no numéricos y mantener solo los últimos 9 dígitos
      const cleanedValue = value.replace(/\D+/g, '').slice(-9);
      setProfile(prev => ({ ...prev, [key]: cleanedValue }));
    } else {
      setProfile(prev => ({ ...prev, [key]: value }));
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
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Código de acceso</Text>
              <TextInput
                style={styles.input}
                placeholder="Código de acceso"
                value={profile.loginCode}
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
