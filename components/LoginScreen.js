import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Dimensions, ScrollView
} from 'react-native';
import RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faKey, faBackspace, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import CustomAlert from './CustomAlert';
import ReactNativeBiometrics from 'react-native-biometrics';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCode, setSavedCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({ dial_code: '+51', flag: '🇵🇪' });
  const [savedEmail, setSavedEmail] = useState('');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [firstTime, setFirstTime] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', token: '' });

  // Texto que se mostrará en el botón biométrico según el sensor disponible.
  const [sensorLabel, setSensorLabel] = useState('Iniciar sesión con biometría');

  // Al montar el componente, verificamos el tipo de sensor biométrico disponible.
  useEffect(() => {
    const checkBiometry = async () => {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();

      if (available) {
        if (biometryType === 'FaceID') {
          setSensorLabel('Iniciar sesión con Face ID');
        } else if (biometryType === 'TouchID') {
          setSensorLabel('Iniciar sesión con Touch ID');
        } else {
          // Para la mayoría de dispositivos Android (y algunos iOS genéricos) será 'Biometrics'
          setSensorLabel('Iniciar sesión con huella digital');
        }
      } else {
        setSensorLabel('Biometría no disponible');
      }
    };
    checkBiometry();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        try {
          const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
          const profileExists = await RNFS.exists(profilePath);

          if (profileExists) {
            const profileData = await RNFS.readFile(profilePath);
            const { perfilUsuario } = JSON.parse(profileData);

            setSavedCode(perfilUsuario.loginCode);
            setSelectedCountry({ dial_code: '+51', flag: '🇵🇪' });
            setSavedEmail(perfilUsuario.correo);
            setBiometricsEnabled(perfilUsuario.biometricsEnabled || false);
            setFirstTime(false);
          } else {
            setFirstTime(true);
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
      setCode(code + num);
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));
  };

  const handleLogin = async () => {
    if (code.length !== 4) {
      showCustomAlert('Error', 'Debe ingresar un código de 4 dígitos.');
      return;
    }

    if (firstTime && email.trim() === '') {
      showCustomAlert('Error', 'Por favor, ingrese su correo electrónico.');
      return;
    }

    setLoading(true);

    try {
      if (firstTime) {
        // Realizar la validación con el webhook solo si es la primera vez
        const loginData = {
          a: 'login_auth',
          correo: email,
          tec_ope_pass: code,
        };

        const response = await fetch('https://biblioteca1.info/docsafe/api/registrar_users.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
        });

        const result = await response.json();
        if (response.ok && result.success === true) {
          const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
          const profileData = {
            perfilUsuario: {
              estado: result.cliente_data.bestado === 1 ? 'Activo' : 'Inactivo',
              name: result.cliente_data.nombre,
              profileImage: '',
              loginCode: code,
              ciudad: result.cliente_data.ciudad,
              telefono: result.cliente_data.telefono,
              correo: result.cliente_data.correo,
              biometricsEnabled: biometricsEnabled,
              clienteId: result.cliente_data.cliente_id,
            },
          };
          await RNFS.writeFile(profilePath, JSON.stringify(profileData));
          setFirstTime(false);
          setCode('');
          navigation.navigate('Home');
        } else {
          setCode(''); // Limpia el código si es incorrecto
          if (result.message && result.message.toLowerCase().includes('correo ya registrado')) {
            showCustomAlert(
              'Cuenta existente',
              'El correo ya está registrado. Inicie sesión o use otro correo.'
            );
          } else {
            showCustomAlert('Error', result.message || 'Código o correo incorrecto. Inténtalo de nuevo.');
          }
        }
      } else {
        // Validar de forma local si no es la primera vez
        if (code === savedCode) {
          setCode('');
          navigation.navigate('Home');
        } else {
          setCode(''); // Limpia el código si es incorrecto
          showCustomAlert('Error', 'Código incorrecto. Inténtalo de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      showCustomAlert('Error', `No se pudo verificar el código. Inténtalo de nuevo. Detalles del error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    // Verificamos si el usuario tiene habilitada la opción en su perfil.
    if (!biometricsEnabled) {
      showCustomAlert('Error', 'La autenticación biométrica no está habilitada en el perfil.');
      return;
    }

    // Si el sensorLabel indica que no hay biometría disponible, también evitamos el prompt
    if (sensorLabel === 'Biometría no disponible') {
      showCustomAlert('Error', 'El dispositivo no cuenta con Face ID / Touch ID / huella configurada.');
      return;
    }

    try {
      // Instanciamos ReactNativeBiometrics
      const rnBiometrics = new ReactNativeBiometrics();
      // Pedimos la autenticación
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Verifica tu identidad',
      });

      if (success) {
        navigation.navigate('Home');
      } else {
        showCustomAlert('Error', 'Autenticación biométrica cancelada o fallida.');
      }
    } catch (error) {
      console.error('Error durante la autenticación biométrica:', error);
      showCustomAlert('Error', 'Autenticación biométrica no disponible en este dispositivo.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.docSafe}>DocSafe</Text>
        <Image
          source={require('../src/presentation/assets/Logo.jpg')}
          style={styles.profileImage}
        />
        {firstTime && (
          <TextInput
            style={styles.input}
            placeholder="Ingrese su correo"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
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
                (item === 'delete' || item === 'enter') && styles.specialButton,
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
        
        {/* Botón biométrico */}
        <TouchableOpacity
          style={[
            styles.biometricButton,
            sensorLabel === 'Biometría no disponible' && { opacity: 0.5 },
          ]}
          onPress={handleBiometricLogin}
          disabled={sensorLabel === 'Biometría no disponible'}
        >
          <FontAwesomeIcon icon={faFingerprint} size={24} color="#fff" />
          <Text style={styles.biometricButtonText}>{sensorLabel}</Text>
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        token={alertData.token}
        onClose={() => setAlertVisible(false)}
        onAccept={() => setAlertVisible(false)}
      />
    </SafeAreaView>
    </ScrollView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  docSafe: {
    fontSize: 40,
    color: '#155abd',
    fontWeight: 'bold',
    marginBottom: 20
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#155abd',
    marginBottom: 30
  },
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#155abd',
    borderRadius: 10,
    marginBottom: 20
  },
  title: { fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 30 },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 240, // Ajustado a tamaño fijo
    marginBottom: 30
  },
  codeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#155abd',
    justifyContent: 'center',
    alignItems: 'center'
  },
  codeFilledDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#155abd'
  },
  keypadContainer: {
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  keypadButton: {
    width: 85,
    height: 50, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#155abd',
    borderRadius: 10,
    margin: 5, 
  },
  specialButton: { backgroundColor: '#1e7eff' },
  keypadButtonText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  forgotPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30
  },
  forgotPasswordText: {
    color: '#155abd',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10
  },
  biometricButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#155abd',
    padding: 10,
    borderRadius: 10
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600'
  },
});

export default LoginScreen;
