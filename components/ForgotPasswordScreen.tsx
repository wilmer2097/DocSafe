import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RNFS from 'react-native-fs';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handlePasswordReset = async () => {
    const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
    
    try {
      const profileData = await RNFS.readFile(profilePath);
      const userProfile = JSON.parse(profileData).perfilUsuario;

      if (userProfile.correo === email) {
        const newToken = generateToken();
        userProfile.loginCode = newToken;

        await RNFS.writeFile(profilePath, JSON.stringify({ perfilUsuario: userProfile }), 'utf8');
        Alert.alert('Éxito', `Tu nuevo código de acceso es: ${newToken}`);
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', 'El correo ingresado no coincide con el correo registrado.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la solicitud.');
      console.error('Error:', error);
    }
  };

  const generateToken = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Token ID</Text>
      <TextInput
      style={styles.input}
      placeholder="Correo electrónico"
      value={email}
      onChangeText={(text) => setEmail(text.toLowerCase())} // Convierte el texto a minúsculas
      keyboardType="email-address"
      placeholderTextColor="#999"
      />
      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Generar nuevo token</Text>
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
    backgroundColor: '#f7f9fc',
  },
  title: {
    color: '#155abd',
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    color: '#333',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#155abd',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
