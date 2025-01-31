import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import CustomAlert from './CustomAlert';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', token: null });
  const [isSuccess, setIsSuccess] = useState(false); // Para determinar si el proceso fue exitoso

  const showCustomAlert = (title, message, token = null, success = false) => {
    setAlertData({ title, message, token });
    setIsSuccess(success);
    setAlertVisible(true);
  };

  const handlePasswordReset = async () => {
    const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;

    try {
      // Verificamos primero si existe el archivo:
      const exists = await RNFS.exists(profilePath);
      if (!exists) {
        // No hay cuenta registrada
        showCustomAlert(
          'Cuenta inexistente',
          'No se encontró ninguna cuenta registrada. Por favor, crea una cuenta antes de intentar recuperar el Token.'
        );
        return;
      }

      // Si existe, lo leemos:
      const profileData = await RNFS.readFile(profilePath);
      const userProfile = JSON.parse(profileData).perfilUsuario;

      // Validar si el correo ingresado coincide con el perfil almacenado
      if (userProfile.correo === email.toLowerCase()) {
        // Mostrar el token asociado al correo
        showCustomAlert('Token ID Encontrado', 'Tu token es:', userProfile.loginCode, true);
      } else {
        // Mostrar error si el correo no coincide
        showCustomAlert(
          'Error',
          'El correo electrónico ingresado no coincide con ninguna cuenta registrada en este dispositivo.'
        );
      }

    } catch (error) {
      console.error('Error:', error);
      // Manejamos cualquier otro error genérico aquí
      showCustomAlert('Error', 'Ocurrió un problema al procesar la solicitud.');
    }
  };

  const handleAccept = () => {
    setAlertVisible(false);
    if (isSuccess) {
      // Navegar a la pantalla de Login solo si fue exitoso
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Token ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={(text) => setEmail(text)}
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
