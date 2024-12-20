import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Modal, TouchableWithoutFeedback, Linking, Switch } from 'react-native';
import RNFS from 'react-native-fs';
import ReactNativeBiometrics from 'react-native-biometrics';
import CustomAlert from './CustomAlert';
import Icon from 'react-native-vector-icons/FontAwesome';
import CheckBox from '@react-native-community/checkbox';

// Importar react-native-localize
import * as RNLocalize from 'react-native-localize';

const countryDataList = [
  { dial_code: '+1', flag: '🇺🇸', name: 'United States' },
  { dial_code: '+51', flag: '🇵🇪', name: 'Peru' },
  { dial_code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { dial_code: '+54', flag: '🇦🇷', name: 'Argentina' },
  { dial_code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { dial_code: '+56', flag: '🇨🇱', name: 'Chile' },
  { dial_code: '+57', flag: '🇨🇴', name: 'Colombia' },
  { dial_code: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { dial_code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { dial_code: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { dial_code: '+504', flag: '🇭🇳', name: 'Honduras' },
  { dial_code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { dial_code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { dial_code: '+507', flag: '🇵🇦', name: 'Panama' },
  { dial_code: '+509', flag: '🇭🇹', name: 'Haiti' },
  { dial_code: '+592', flag: '🇬🇾', name: 'Guyana' },
  { dial_code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { dial_code: '+594', flag: '🇬🇫', name: 'French Guiana' },
  { dial_code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { dial_code: '+597', flag: '🇸🇷', name: 'Suriname' },
  { dial_code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { dial_code: '+34', flag: '🇪🇸', name: 'Spain' },
];

// Mapa de código de país (ISO) a dial_code
const countryCodeMap = {
  US: '+1',
  PE: '+51',
  MX: '+52',
  AR: '+54',
  BR: '+55',
  CL: '+56',
  CO: '+57',
  VE: '+58',
  GT: '+502',
  SV: '+503',
  HN: '+504',
  NI: '+505',
  CR: '+506',
  PA: '+507',
  HT: '+509',
  GY: '+592',
  EC: '+593',
  GF: '+594',
  PY: '+595',
  SR: '+597',
  UY: '+598',
  ES: '+34',
};

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    name: '',
    profileImage: null,
    loginCode: '',
    ciudad: '',
    telefono: '',
    codigoPais: '+51',
    correo: '',
    biometricsEnabled: false,
    fec_ini: '',
    fec_fin: '',
    termsAccepted: false,
  });

  const [firstTime, setFirstTime] = useState(true);
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
  const [errorTelefono, setErrorTelefono] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', token: '' });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ flag: '🇵🇪', dial_code: '+51' });
  const [initialLoginCode, setInitialLoginCode] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileExists = await RNFS.exists(profilePath);
        if (profileExists) {
          const profileData = await RNFS.readFile(profilePath);
          const savedProfile = JSON.parse(profileData).perfilUsuario;
          setProfile(prev => ({ ...prev, ...savedProfile }));
          setInitialLoginCode(savedProfile.loginCode);

          // Usa el codigoPais guardado
          const countryData = countryDataList.find(country => country.dial_code === savedProfile.codigoPais);
          if (countryData) {
            setSelectedCountry({ flag: countryData.flag, dial_code: savedProfile.codigoPais });
          }

          setFirstTime(false);
        } else {
          // No existe perfil guardado, usar región del dispositivo
          const deviceCountry = RNLocalize.getCountry(); // Ej: "PE"
          const dialCode = countryCodeMap[deviceCountry] || '+51'; // Si no se encuentra el país, usar '+51'
          const countryData = countryDataList.find(country => country.dial_code === dialCode);
          if (countryData) {
            setSelectedCountry({ flag: countryData.flag, dial_code: dialCode });
            handleChange('codigoPais', dialCode);
          } else {
            // Si no se encuentra el país en la lista, usar el por defecto
            setSelectedCountry({ flag: '🇵🇪', dial_code: '+51' });
            handleChange('codigoPais', '+51');
          }
          setFirstTime(true);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        showCustomAlert('Error', 'Error al cargar el perfil: ' + error.message);
      }
    };
    loadProfile();
  }, []);

  const showCustomAlert = (title, message, token = '') => {
    setAlertData({ title, message, token });
    setAlertVisible(true);
  };

  const toggleBiometrics = async (enabled) => {
    const rnBiometrics = new ReactNativeBiometrics();

    try {
      if (enabled) {
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Confirma tu identidad para habilitar la autenticación biométrica',
        });

        if (success) {
          setProfile(prev => ({ ...prev, biometricsEnabled: true }));
          showCustomAlert('', 'Autenticación biométrica habilitada.');
        } else {
          showCustomAlert('Error', 'Autenticación fallida. No se habilitó la autenticación biométrica.');
        }
      } else {
        setProfile(prev => ({ ...prev, biometricsEnabled: false }));
        showCustomAlert('', 'Autenticación biométrica deshabilitada.');
      }
    } catch (error) {
      console.error('Error al verificar autenticación biométrica:', error);
      showCustomAlert('Error', 'Autenticación biométrica no disponible en este dispositivo o no se completó.');
      setProfile(prev => ({ ...prev, biometricsEnabled: false }));
    }
  };

  const handleSaveProfile = async () => {
    if (isSubmitting) return;

    if (!profile.termsAccepted) {
      showCustomAlert('Error', 'Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    setIsSubmitting(true);

    if (!profile.name.trim()) {
      showCustomAlert('Error', 'El nombre es obligatorio.');
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(profile.correo)) {
      showCustomAlert('Error', 'Por favor ingresa un correo electrónico válido.');
      setIsSubmitting(false);
      return;
    }

    if (!validateTelefono(profile.telefono)) {
      setIsSubmitting(false);
      return;
    }

    if (!validateLoginCode(profile.loginCode)) {
      setIsSubmitting(false);
      return;
    }

    try {
      const currentDate = new Date();
      const startDate = currentDate.toISOString().split('T')[0];
      const endDate = new Date(currentDate.setMonth(currentDate.getMonth() + 6)).toISOString().split('T')[0];

      const datosPerfil = {
        a: firstTime ? 'I' : 'U',
        cliente_id: profile.clienteId,
        nombre: profile.name,
        correo: profile.correo,
        telefono: profile.telefono,
        codigoPais: selectedCountry.dial_code,
        ciudad: profile.ciudad,
        tec_ope_pass: profile.loginCode,
        fec_ini: profile.fec_ini || startDate,
        fec_fin: profile.fec_fin || endDate,
        fec_cre: firstTime ? startDate : undefined,
        fec_mod: !firstTime ? new Date().toISOString().split('T')[0] : undefined,
        tec_prf_id: 13,
        ope_estado_id: 1,
        termsAccepted: profile.termsAccepted,
        biometricsEnabled: profile.biometricsEnabled,
      };

      const response = await fetch('https://biblioteca1.info/docsafe/api/registrar_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPerfil),
      });

      const result = await response.json();
      if (response.ok && result.success === true) {
        const updatedProfile = { ...profile, clienteId: result.cliente_id || profile.clienteId, fec_ini: startDate, fec_fin: endDate, codigoPais: selectedCountry.dial_code };
        setProfile(updatedProfile);
        await RNFS.writeFile(profilePath, JSON.stringify({ perfilUsuario: updatedProfile }), 'utf8');
        const tokenChanged = initialLoginCode !== profile.loginCode;
        showCustomAlert('Éxito', 'Tu perfil ha sido guardado exitosamente.', tokenChanged ? profile.loginCode : '');
      } else if (result.message && result.message.toLowerCase().includes('correo ya registrado')) {
        showCustomAlert('Cuenta existente', 'El correo ya está registrado. Inicie sesión o use otro correo.');
      } else {
        showCustomAlert('Error', 'Hubo un problema al registrar el usuario.');
      }
    } catch (error) {
      showCustomAlert('Error', 'Hubo un problema al procesar el registro: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const validateEmail = (email) => /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);

  const validateTelefono = (telefono) => {
    if (telefono.length !== 9) {
      setErrorTelefono('El número de teléfono debe contener exactamente 9 dígitos.');
      return false;
    }
    if (!/^\d{9}$/.test(telefono)) {
      setErrorTelefono('El número de teléfono debe contener solo dígitos.');
      return false;
    }
    setErrorTelefono(null);
    return true;
  };

  const validateLoginCode = (loginCode) => {
    if (loginCode.length !== 4 || isNaN(loginCode)) {
      showCustomAlert('Error', 'El código de acceso debe tener 4 dígitos.');
      return false;
    }
    return true;
  };

  const onAcceptAlert = () => {
    setAlertVisible(false);
    if (alertData.title === 'Éxito' && alertData.token) {
      navigation.navigate('Login');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={profile.profileImage ? { uri: profile.profileImage } : require('../src/presentation/assets/Logo.jpg')} style={styles.profileImage} />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} placeholder="Nombre" value={profile.name} onChangeText={(text) => handleChange('name', text)} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo</Text>
          <TextInput style={styles.input} placeholder="Correo" value={profile.correo} onChangeText={(text) => handleChange('correo', text)} keyboardType="email-address" />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <View style={styles.phoneInputContainer}>
            <TouchableOpacity 
              style={[styles.countryCodeButton, { backgroundColor: '#fff', borderColor: '#165bbd' }]} 
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.countryCodeText}>{selectedCountry.flag} {selectedCountry.dial_code}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder="Número de teléfono"
              value={profile.telefono}
              onChangeText={(text) => handleChange('telefono', text)}
              keyboardType="phone-pad"
            />
          </View>
          {errorTelefono && <Text style={styles.errorText}>{errorTelefono}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Código de acceso</Text>
          <TextInput style={styles.input} placeholder="Código de acceso" value={profile.loginCode} onChangeText={(text) => handleChange('loginCode', text)} keyboardType="numeric" maxLength={4} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ciudad</Text>
          <TextInput style={styles.input} placeholder="Ciudad" value={profile.ciudad} onChangeText={(text) => handleChange('ciudad', text)} />
        </View>

        <View style={styles.inputContainer}> 
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Habilitar autenticación biométrica</Text>
            <Switch
              value={profile.biometricsEnabled}
              onValueChange={(value) => toggleBiometrics(value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={profile.biometricsEnabled ? '#155abd' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.termsContainer}>
          <CheckBox
            value={profile.termsAccepted}
            onValueChange={() => handleChange('termsAccepted', !profile.termsAccepted)}
            tintColors={{ true: '#155abd', false: '#767577' }}
          />
          <Text style={styles.termsText} onPress={() => Linking.openURL('https://solucionestecperu.com/soporte/')}>Acepto los <Text style={styles.linkText}>términos y condiciones</Text></Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent={true}
        visible={showCountryPicker}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowCountryPicker(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
              <ScrollView>
                {countryDataList.map((country, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry({ flag: country.flag, dial_code: country.dial_code });
                      handleChange('codigoPais', country.dial_code);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryText}>{country.flag} {country.name} ({country.dial_code})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <CustomAlert visible={alertVisible} title={alertData.title} message={alertData.message} token={alertData.token} onClose={() => setAlertVisible(false)} onAccept={onAcceptAlert} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  scrollContainer: { padding: 20, alignItems: 'center' },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderColor: '#165bbd', borderWidth: 3, alignSelf: 'center', marginBottom: 20 },
  inputContainer: { width: '100%', marginBottom: 15 },
  label: { fontSize: 16, color: '#333', marginBottom: 5, fontWeight: '500' },
  input: { color: '#333', padding: 12, backgroundColor: '#fff', borderRadius: 8, borderColor: '#ccc', borderWidth: 1, fontSize: 16 },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    color: '#333',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
  },
  button: { backgroundColor: '#155abd', paddingVertical: 15, borderRadius: 8, alignItems: 'center', width: '100%', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  errorText: { color: 'red', fontSize: 14, marginTop: 5 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { margin: 20, backgroundColor: 'white', borderRadius: 10, padding: 10, alignItems: 'center' },
  closeButton: { alignSelf: 'flex-end', marginBottom: 10 },
  countryItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomColor: '#ccc', borderBottomWidth: 1 },
  countryText: { fontSize: 16, color: '#333' },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  termsText: { marginLeft: 10, color: '#333', fontSize: 16 },
  linkText: { color: '#155abd', textDecorationLine: 'underline' },
  switchContainer: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default ProfileScreen;
