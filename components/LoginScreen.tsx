import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, SafeAreaView, Dimensions, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faKey, faBackspace, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import CustomAlert from './CustomAlert';  // Importamos CustomAlert
import LocalAuthentication from 'react-native-local-authentication';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCode, setSavedCode] = useState('');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);  // Estado para la alerta personalizada
  const [alertData, setAlertData] = useState({ title: '', message: '', token: '' });  // Datos para la alerta

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        try {
          const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
          const profileExists = await RNFS.exists(profilePath);

          if (profileExists) {
            const profileData = await RNFS.readFile(profilePath);
            const { perfilUsuario } = JSON.parse(profileData);

            if (perfilUsuario && perfilUsuario.loginCode) {
              setSavedCode(perfilUsuario.loginCode);
              setBiometricsEnabled(perfilUsuario.biometricsEnabled || false);
            } else {
              showCustomAlert('Error', 'No se pudo cargar el código de acceso.');
            }
          } else {
            showCustomAlert('Error', 'Perfil no encontrado. Por favor, configure el perfil.');
          }
        } catch (error) {
          console.error('Error cargando el perfil:', error);
          showCustomAlert('Error', 'Ocurrió un error al cargar el perfil.');
        }
      };

      loadProfileData();
    }, [navigation])
  );

  const showCustomAlert = (title, message, token = '') => {
    setAlertData({ title, message, token });
    setAlertVisible(true);
  };

  const handlePress = (num) => {
    if (code.length < 4) {
      setCode(code + num);  // Concatenar el número al código actual
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));  // Eliminar el último dígito
  };

  const handleLogin = async () => {
    if (code.length !== 4) {
      showCustomAlert('Error', 'Debe ingresar un código de 4 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const loginData = {
        a: "login_auth",
        tec_ope_pass: code,  // Token ingresado por el usuario
      };

      console.log('Datos enviados a la API para login:', loginData);

      const response = await fetch('https://biblioteca1.info/docsafe/api/registrar_users.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();
      console.log('Respuesta de la API de login:', result);

      if (response.ok && result.success === true) {
        setCode('');  // Limpiar el código ingresado
        navigation.navigate('Home');
      } else {
        showCustomAlert('Error', 'Código incorrecto. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      showCustomAlert('Error', 'No se pudo verificar el código. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricsEnabled) {
      showCustomAlert('Error', 'La autenticación biométrica no está habilitada.');
      return;
    }

    try {
      const isSupported = await LocalAuthentication.isSupported();

      if (isSupported) {
        const result = await LocalAuthentication.authenticate({
          reason: 'Verifica tu identidad con la huella digital'
        });

        if (result.success) {
          navigation.navigate('Home');
        } else {
          showCustomAlert('Error', 'La autenticación biométrica falló. Inténtalo de nuevo.');
        }
      } else {
        showCustomAlert('Error', 'Autenticación biométrica no disponible en este dispositivo.');
      }
    } catch (error) {
      console.error('Error durante la autenticación biométrica:', error);
      showCustomAlert('Error', 'No se pudo completar la autenticación biométrica. Inténtalo de nuevo.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.docSafe}>DocSafe</Text>
        <Image source={require('../src/presentation/assets/Logo.jpg')} style={styles.profileImage} />
        <Text style={styles.title}>Ingresa tu Token ID</Text>
        <View style={styles.codeContainer}>
          {[...Array(4)].map((_, index) => (
            <View key={index} style={styles.codeDot}>
              {code[index] ? <View style={styles.codeFilledDot} /> : null}
            </View>
          ))}
        </View>
        <View style={styles.keypadContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'delete', 0, 'enter'].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.keypadButton,
                (item === 'delete' || item === 'enter') && styles.specialButton
              ]}
              onPress={() => {
                if (item === 'delete') handleDelete();
                else if (item === 'enter') handleLogin();
                else handlePress(item.toString());
              }}
              disabled={loading}
            >
              {item === 'delete' ? (
                <FontAwesomeIcon icon={faBackspace} size={24} color="#fff" />
              ) : item === 'enter' ? (
                loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.keypadButtonText}>✓</Text>
                )
              ) : (
                <Text style={styles.keypadButtonText}>{item}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <FontAwesomeIcon icon={faKey} size={20} color="#155abd" />
          <Text style={styles.forgotPasswordText}>Recuperar Token ID</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricLogin}
        >
          <FontAwesomeIcon icon={faFingerprint} size={24} color="#fff" />
          <Text style={styles.biometricButtonText}>Iniciar sesión con huella digital</Text>
        </TouchableOpacity>
      </View>
      {/* Componente de CustomAlert */}
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        token={alertData.token}
        onClose={() => setAlertVisible(false)}
        onAccept={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  docSafe: {
    fontSize: 40,
    color: '#155abd',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#155abd',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.6,
    marginBottom: 30,
  },
  codeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#155abd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeFilledDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#155abd',
  },
  keypadContainer: {
    width: width * 0.8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: width * 0.24,
    height: width * 0.14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#155abd',
    borderRadius: 10,
    marginBottom: 15,
  },
  specialButton: {
    backgroundColor: '#1e7eff',
  },
  keypadButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  forgotPasswordText: {
    color: '#155abd',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  biometricButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#155abd',
    padding: 10,
    borderRadius: 10,
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
});

export default LoginScreen;
