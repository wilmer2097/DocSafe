import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import CustomAlert from './CustomAlert';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [userToken, setUserToken] = useState(''); // Estado para almacenar el token ingresado por el usuario

  const handlePasswordReset = async () => {
    const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;

    if (!userToken || userToken.length !== 4 || isNaN(userToken)) {
      Alert.alert('Error', 'El token debe tener exactamente 4 dígitos.');
      return;
    }

    try {
      const profileData = await RNFS.readFile(profilePath);
      const userProfile = JSON.parse(profileData).perfilUsuario;

      if (userProfile.correo === email) {
        const clienteId = userProfile.clienteId;

        if (!clienteId) {
          Alert.alert('Error', 'No se pudo encontrar el ID del cliente.');
          return;
        }

        const datos = {
          a: "pass_change",
          cliente_id: clienteId,
          tec_ope_pass: userToken, // Usamos el token ingresado por el usuario
        };

        const response = await fetch('https://biblioteca1.info/docsafe/api/registrar_users.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setNewToken(userToken);

          userProfile.loginCode = userToken;
          await RNFS.writeFile(profilePath, JSON.stringify({ perfilUsuario: userProfile }), 'utf8');

          setShowAlert(true);
        } else {
          Alert.alert('Error', 'Hubo un problema al actualizar el token.');
        }
      } else {
        Alert.alert('Correo electrónico no encontrado.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Ocurrió un problema al procesar la solicitud.');
    }
  };

  const onCloseAlert = () => {
    setShowAlert(false);
    navigation.navigate('Login');
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
      <TextInput
        style={styles.input}
        placeholder="Ingresa el nuevo token de 4 dígitos"
        value={userToken}
        onChangeText={setUserToken}
        keyboardType="numeric"
        maxLength={4}
        placeholderTextColor="#999"
      />
      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Actualizar Token</Text>
      </TouchableOpacity>

      {showAlert && (
        <CustomAlert
          visible={showAlert}
          onClose={onCloseAlert}
          title="Token Actualizado"
          message="Tu nuevo Token ID ha sido actualizado exitosamente."
          token={newToken}
          onAccept={onCloseAlert}
        />
      )}
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
