import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
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
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileExists = await RNFS.exists(profilePath);
        if (profileExists) {
          const profileData = await RNFS.readFile(profilePath);
          const savedProfile = JSON.parse(profileData).perfilUsuario;
          setProfile(prev => ({ ...prev, ...savedProfile }));
        } else {
          // Generar automáticamente el código de acceso si no existe un perfil guardado
          const generatedLoginCode = Math.floor(1000 + Math.random() * 9000).toString();
          setProfile(prev => ({ ...prev, loginCode: generatedLoginCode }));
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

  const handleChooseImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        Alert.alert('Cancelado', 'Selección de imagen cancelada');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Error al seleccionar la imagen: ' + response.errorMessage);
      } else {
        setProfile(prev => ({ ...prev, profileImage: response.assets[0].uri }));
      }
    });
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
      Alert.alert('Éxito', 'Perfil actualizado exitosamente.');

      // Regresa al login después de actualizar el perfil para forzar el uso del nuevo código
      navigation.navigate('Login'); 
    } catch (error) {
      console.error('Error al guardar el perfil:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil: ' + error.message);
    }
  };

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleChooseImage}>
        <Image
          source={profile.profileImage ? { uri: profile.profileImage } : require('../src/presentation/assets/foto.jpg')}
          style={styles.profileImage}
        />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Estado"
        value={profile.estado}
        onChangeText={(text) => handleChange('estado', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={profile.name}
        onChangeText={(text) => handleChange('name', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Grupo"
        value={profile.grupo}
        onChangeText={(text) => handleChange('grupo', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Ciudad"
        value={profile.ciudad}
        onChangeText={(text) => handleChange('ciudad', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={profile.telefono}
        onChangeText={(text) => handleChange('telefono', text)}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={profile.correo}
        onChangeText={(text) => handleChange('correo', text)}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Código de acceso"
        value={profile.loginCode}
        editable={false} // No editable ya que se genera automáticamente
      />
      <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  input: {
    color: 'black',
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#185abd',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
