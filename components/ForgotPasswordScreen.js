import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import CustomAlert from './CustomAlert';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', token: null });
  const [isSuccess, setIsSuccess] = useState(false); // Nueva bandera para determinar si el proceso fue exitoso

  const showCustomAlert = (title, message, token = null, success = false) => {
    setAlertData({ title, message, token });
    setIsSuccess(success); // Establece si la alerta es exitosa o no
    setAlertVisible(true);
  };

  const handlePasswordReset = async () => {
    const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;

    try {
      // Leer el archivo JSON local
      const profileData = await RNFS.readFile(profilePath);
      const userProfile = JSON.parse(profileData).perfilUsuario;

      // Validar si el correo ingresado coincide con el perfil almacenado
      if (userProfile.correo === email) {
        // Mostrar el token asociado al correo
        showCustomAlert('Token ID Encontrado', 'Tu token es:', userProfile.loginCode, true);
      } else {
        // Mostrar error si el correo no coincide
        showCustomAlert('Error', 'Correo electrónico no encontrado.');
      }
    } catch (error) {
      console.error('Error:', error);
      showCustomAlert('Error', 'Ocurrió un problema al procesar la solicitud.');
    }
  };

  const handleAccept = () => {
    setAlertVisible(false);
    if (isSuccess) {
      navigation.navigate('Login'); // Navegar a la pantalla de Login solo si fue exitoso
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Token ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={(text) => setEmail(text.toLowerCase())}
        keyboardType="email-address"
        placeholderTextColor="#999"
      />
      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Mostrar Token ID</Text>
      </TouchableOpacity>

      <CustomAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)} // Cierra la alerta sin navegar
        title={alertData.title}
        message={alertData.message}
        token={alertData.token}
        onAccept={handleAccept} // Solo navegar cuando el usuario presione "Aceptar" y sea un éxito
      />
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
  },
  button: {
    backgroundColor: '#155abd',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
