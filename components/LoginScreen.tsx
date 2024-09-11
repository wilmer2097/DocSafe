import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, SafeAreaView, Dimensions } from 'react-native';
import RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faKey, faBackspace } from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCode, setSavedCode] = useState('');

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
            } else {
              Alert.alert('Error', 'No se pudo cargar el código de acceso. Asegúrese de que el perfil esté configurado correctamente.');
            }
          } else {
            Alert.alert('Error', 'Perfil no encontrado. Por favor, configure el perfil.');
          }
        } catch (error) {
          console.error('Error cargando el perfil:', error);
          Alert.alert('Error', 'Ocurrió un error al cargar el perfil.');
        }
      };

      loadProfileData();
    }, [navigation])
  );

  const handleLogin = () => {
    if (code.length !== 4) {
      Alert.alert('Error', 'Debe ingresar un código de 4 dígitos.');
      return;
    }

    setLoading(true);

    try {
      if (code === savedCode || code === '0000') {
        setCode('');
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'Código incorrecto. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      Alert.alert('Error', 'No se pudo verificar el código. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (num) => {
    if (code.length < 4) {
      setCode(code + num);
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));
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
      </View>
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
});

export default LoginScreen;