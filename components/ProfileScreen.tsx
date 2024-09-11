import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, KeyboardAvoidingView } from 'react-native';
import RNFS from 'react-native-fs';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    estado: 'Activo',
    name: '',
    profileImage: null,
    loginCode: '',
    grupo: '',
    ciudad: '',
    telefono: '',
    correo: '',
  });
  
  const [firstTime, setFirstTime] = useState(true);
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileExists = await RNFS.exists(profilePath);
        if (profileExists) {
          const profileData = await RNFS.readFile(profilePath);
          const savedProfile = JSON.parse(profileData).perfilUsuario;
          setProfile(prev => ({ ...prev, ...savedProfile }));
          setFirstTime(false);  // Assume it's not the first time if profile exists
        } else {
          const generatedLoginCode = Math.floor(1000 + Math.random() * 9000).toString();
          setProfile(prev => ({ ...prev, loginCode: generatedLoginCode }));
          setFirstTime(true);  // First-time setup
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

  const handleSaveProfile = async () => {
    if (!profile.name.trim() || profile.loginCode.length !== 4) {
      Alert.alert('Error', 'Nombre y un código de acceso de 4 dígitos son requeridos.');
      return;
    }

    if (!validateEmail(profile.correo)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido.');
      return;
    }

    try {
      const newProfile = JSON.stringify({ perfilUsuario: profile });
      await RNFS.writeFile(profilePath, newProfile, 'utf8');
      Alert.alert('Éxito', `Perfil actualizado exitosamente. Tu código de acceso es: ${profile.loginCode}`);
      navigation.navigate('Login'); 
    } catch (error) {
      console.error('Error al guardar el perfil:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil: ' + error.message);
    }
  };


  const handleChange = (key, value) => {
    if (key === 'correo') {
      value = value.toLowerCase(); // Convierte el correo a minúsculas
    }
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={profile.profileImage ? { uri: profile.profileImage } : require('../src/presentation/assets/Logo.jpg')}
          style={styles.profileImage}
        />

        
        {/* Identificador Personal */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Identificador Personal</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={profile.name}
            onChangeText={(text) => handleChange('name', text)}
          />
        </View>

        {/* Correo */}
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

        {/* Teléfono */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={profile.telefono}
            onChangeText={(text) => handleChange('telefono', text)}
            keyboardType="phone-pad"
          />
        </View>

        {/* The following fields are only shown after the first save */}
        {!firstTime && (
          <>
            {/* Ciudad */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ciudad</Text>
              <TextInput
                style={styles.input}
                placeholder="Ciudad"
                value={profile.ciudad}
                onChangeText={(text) => handleChange('ciudad', text)}
              />
            </View>

            {/* Grupo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Grupo</Text>
              <TextInput
                style={styles.input}
                placeholder="Grupo"
                value={profile.grupo}
                onChangeText={(text) => handleChange('grupo', text)}
              />
            </View>
            {/* Estado (Fixed and Non-editable) */}
            <View style={styles.inputContainer}>
            <Text style={styles.label}>Estado</Text>
            <TextInput
              style={styles.input}
              value={profile.estado}
              editable={false}
            />
          </View>
            {/* Código de acceso (Not editable, shown after first save) */}
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
