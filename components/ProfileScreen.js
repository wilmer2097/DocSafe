import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Switch,
} from 'react-native';
import RNFS from 'react-native-fs';
import ReactNativeBiometrics from 'react-native-biometrics';
import CustomAlert from './CustomAlert';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import CheckBox from '@react-native-community/checkbox';
import * as RNLocalize from 'react-native-localize';

const countryDataList = [
  { dial_code: '1', flag: '🇺🇸', name: 'Estados Unidos' },
  { dial_code: '51', flag: '🇵🇪', name: 'Perú' },
  { dial_code: '52', flag: '🇲🇽', name: 'México' },
  { dial_code: '54', flag: '🇦🇷', name: 'Argentina' },
  { dial_code: '55', flag: '🇧🇷', name: 'Brasil' },
  { dial_code: '56', flag: '🇨🇱', name: 'Chile' },
  { dial_code: '57', flag: '🇨🇴', name: 'Colombia' },
  { dial_code: '58', flag: '🇻🇪', name: 'Venezuela' },
  { dial_code: '502', flag: '🇬🇹', name: 'Guatemala' },
  { dial_code: '503', flag: '🇸🇻', name: 'El Salvador' },
  { dial_code: '504', flag: '🇭🇳', name: 'Honduras' },
  { dial_code: '505', flag: '🇳🇮', name: 'Nicaragua' },
  { dial_code: '506', flag: '🇨🇷', name: 'Costa Rica' },
  { dial_code: '507', flag: '🇵🇦', name: 'Panamá' },
  { dial_code: '509', flag: '🇭🇹', name: 'Haití' },
  { dial_code: '592', flag: '🇬🇾', name: 'Guyana' },
  { dial_code: '593', flag: '🇪🇨', name: 'Ecuador' },
  { dial_code: '594', flag: '🇬🇫', name: 'Guayana Francesa' },
  { dial_code: '595', flag: '🇵🇾', name: 'Paraguay' },
  { dial_code: '597', flag: '🇸🇷', name: 'Surinam' },
  { dial_code: '598', flag: '🇺🇾', name: 'Uruguay' },
  { dial_code: '34', flag: '🇪🇸', name: 'España' },
];

// Mapa de región del dispositivo a prefijo
const countryCodeMap = {
  US: '1',
  PE: '51',
  MX: '52',
  AR: '54',
  BR: '55',
  CL: '56',
  CO: '57',
  VE: '58',
  GT: '502',
  SV: '503',
  HN: '504',
  NI: '505',
  CR: '506',
  PA: '507',
  HT: '509',
  GY: '592',
  EC: '593',
  GF: '594',
  PY: '595',
  SR: '597',
  UY: '598',
  ES: '34',
};

const ProfileScreen = ({ navigation, route }) => {
  const { fromWelcome = false } = route.params || {};

  // Estado del perfil
  const [profile, setProfile] = useState({
    name: '',
    profileImage: null,
    loginCode: '',
    ciudad: '',
    telefono: '',
    prefijo: '51',
    correo: '',
    biometricsEnabled: false,
    fec_ini: '',
    fec_fin: '',
    termsAccepted: false,
    clienteId: '',
    internetEnabled: true,
  });

  const [firstTime, setFirstTime] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;

  const [errorTelefono, setErrorTelefono] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', token: '' });

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ flag: '🇵🇪', dial_code: '51' });
  const [showFirstModal, setShowFirstModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showCountryPickerValidation, setShowCountryPickerValidation] = useState(false);

  const [tempSelectedCountry, setTempSelectedCountry] = useState({ flag: '🇵🇪', dial_code: '51' });
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  const [initialLoginCode, setInitialLoginCode] = useState('');

  // Efecto de carga del perfil local
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const exists = await RNFS.exists(profilePath);
        if (exists) {
          const profileData = await RNFS.readFile(profilePath);
          const savedProfile = JSON.parse(profileData).perfilUsuario;

          setProfile((prev) => ({ ...prev, ...savedProfile }));
          setInitialLoginCode(savedProfile.loginCode);

          if (savedProfile.prefijo) {
            const cd = countryDataList.find((c) => c.dial_code === savedProfile.prefijo);
            if (cd) {
              setSelectedCountry({ flag: cd.flag, dial_code: cd.dial_code });
            }
          }
          setFirstTime(false);
        } else {
          const deviceCountry = RNLocalize.getCountry() || 'PE';
          const devicePrefix = countryCodeMap[deviceCountry] || '51';
          setProfile((prev) => ({ ...prev, prefijo: devicePrefix }));

          const cd = countryDataList.find((c) => c.dial_code === devicePrefix);
          if (cd) {
            setSelectedCountry({ flag: cd.flag, dial_code: devicePrefix });
          }
          setFirstTime(true);
        }

        if (fromWelcome) {
          setShowFirstModal(true);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        showCustomAlert('Error', 'Error al cargar el perfil: ' + err.message);
      }
    };
    loadProfile();
  }, [fromWelcome]);

  const showCustomAlert = (title, message, token = '') => {
    setAlertData({ title, message, token });
    setAlertVisible(true);
  };

  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBiometrics = async (enabled) => {
    const rnBiometrics = new ReactNativeBiometrics();
    try {
      if (enabled) {
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Confirma tu identidad para habilitar la autenticación biométrica',
        });
        if (success) {
          setProfile((prev) => ({ ...prev, biometricsEnabled: true }));
          showCustomAlert('', 'Autenticación biométrica habilitada.');
        } else {
          showCustomAlert('Error', 'Autenticación fallida. No se habilitó la autenticación biométrica.');
        }
      } else {
        setProfile((prev) => ({ ...prev, biometricsEnabled: false }));
        showCustomAlert('', 'Autenticación biométrica deshabilitada.');
      }
    } catch (err) {
      console.error('Error:', err);
      showCustomAlert('Error', 'Autenticación biométrica no disponible.');
      setProfile((prev) => ({ ...prev, biometricsEnabled: false }));
    }
  };

  const toggleInternetMode = async (enabled) => {
    setProfile((prev) => ({ ...prev, internetEnabled: enabled }));
    try {
      const updatedProfile = { ...profile, internetEnabled: enabled };
      await RNFS.writeFile(profilePath, JSON.stringify({ perfilUsuario: updatedProfile }), 'utf8');
    } catch (err) {
      console.error('Error saving internetEnabled:', err);
      showCustomAlert('Error', 'No se pudo guardar la preferencia de internet.');
    }
  };

  const handleSaveProfile = async () => {
    if (isSubmitting) return;
  
    const useCloud = profile.internetEnabled;
  
    if (profile.correo) profile.correo = profile.correo.toLowerCase();
    if (profile.name) profile.name = profile.name.toLowerCase();
    if (profile.ciudad) profile.ciudad = profile.ciudad.toLowerCase();
  
    if (!profile.termsAccepted) {
      showCustomAlert('Error', 'Debes aceptar los términos y condiciones.');
      return;
    }
  
    setIsSubmitting(true);
  
    if (!profile.name.trim()) {
      showCustomAlert('Error', 'El nombre es obligatorio.');
      setIsSubmitting(false);
      return;
    }
    if (!validateEmail(profile.correo)) {
      showCustomAlert('Error', 'Correo electrónico inválido.');
      setIsSubmitting(false);
      return;
    }
    if (!validateTelefono(profile.telefono)) {
      showCustomAlert('Error', 'El número de teléfono debe ser 9 dígitos.');
      setIsSubmitting(false);
      return;
    }
    if (!validateLoginCode(profile.loginCode)) {
      showCustomAlert('Error', 'El código de acceso debe tener 4 dígitos numéricos.');
      setIsSubmitting(false);
      return;
    }
  
    if (!useCloud) {
      await saveProfileLocally(profile);
      setIsSubmitting(false);
      showCustomAlert('Guardado', 'Tus datos se han guardado localmente.');
      return;
    }
  
    try {
      const currentDate = new Date();
      const today = currentDate.toISOString().split('T')[0];
  
      const endDateObj = new Date(currentDate);
      endDateObj.setMonth(endDateObj.getMonth() + 6);
      const endDate = endDateObj.toISOString().split('T')[0];
  
      let actionType = isExistingUser ? 'U' : 'I';
      if (!fromWelcome) actionType = 'U';
  
      let datosPerfil = {};
  
      if (actionType === 'I') {
        datosPerfil = {
          a: 'I',
          tec_prf_id: 13,
          ope_estado_id: 1,
          correo: profile.correo,
          tec_ope_pass: profile.loginCode || '', // Asegúrate de que no sea null
          nombre: profile.name,
          telefono: profile.telefono,
          ciudad: profile.ciudad,
          fec_cre: today,
          fec_ini: today,
          fec_fin: endDate,
          prefijo: parseInt(profile.prefijo, 10),
        };
      } else {
        datosPerfil = {
          a: 'U',
          cliente_id: profile.clienteId || '', // Asegúrate de que cliente_id no sea undefined
          fec_mod: today,
          nombre: profile.name,
          correo: profile.correo,
          telefono: profile.telefono,
          ciudad: profile.ciudad,
          prefijo: parseInt(profile.prefijo, 10),
          fec_ini: profile.fec_ini || today,
          fec_fin: profile.fec_fin || endDate,
          ope_estado_id: 1,
          tec_ope_pass: profile.loginCode || '', // Asegúrate de que no sea null
        };
      }
  
      // Imprimir en consola los datos que se enviarán a la API
      console.log('Datos enviados a la API:', JSON.stringify(datosPerfil, null, 2));
  
      const response = await fetch(
        'https://biblioteca1.info/docsafe/api/registrar_users.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosPerfil),
        }
      );
  
      const responseText = await response.text();
      let result;
  
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Error al parsear JSON:', parseErr);
        console.error('Texto devuelto por el servidor:', responseText);
        showCustomAlert(
          'Error en el servidor',
          'La respuesta del servidor no es un JSON válido. Detalles: ' + responseText
        );
        setIsSubmitting(false);
        return;
      }
  
      if (response.ok && result.success === true) {
        const { cliente_data } = result;
  
        // Actualiza el estado profile con los datos de la API
        setProfile((prev) => ({
          ...prev,
          ...cliente_data,
          prefijo: String(cliente_data.prefijo),
          loginCode: cliente_data.tec_ope_pass || prev.loginCode, // Actualiza loginCode
          clienteId: cliente_data.cliente_id || prev.clienteId, // Actualiza clienteId
        }));
  
        const foundCountry = countryDataList.find(
          (c) => c.dial_code === String(cliente_data.prefijo)
        );
        if (foundCountry) {
          setSelectedCountry({
            flag: foundCountry.flag,
            dial_code: foundCountry.dial_code,
          });
        }
  
        await saveProfileLocally({
          ...profile,
          ...cliente_data,
          prefijo: String(cliente_data.prefijo),
          loginCode: cliente_data.tec_ope_pass || profile.loginCode, // Guarda loginCode
          clienteId: cliente_data.cliente_id || profile.clienteId, // Guarda clienteId
        });
  
        const tokenChanged = initialLoginCode !== profile.loginCode;
        showCustomAlert(
          'Éxito',
          'Tu perfil ha sido guardado exitosamente.',
          tokenChanged ? profile.loginCode : ''
        );
      } else {
        showCustomAlert('Error', result.message || 'Hubo un problema al registrar el usuario.');
      }
    } catch (err) {
      showCustomAlert('Error', 'Hubo un problema al procesar el registro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveProfileLocally = async (profileData) => {
    try {
      // Filtramos los campos que no deseamos guardar
      const {
        tec_ope_pass,
        tec_prf_id,
        ope_estado_id,
        nombre,
        fec_cre,
        cliente_id,
        tec_ope_id,
        ...filteredProfile
      } = profileData;
  
      // Guardamos solo los campos necesarios
      await RNFS.writeFile(
        profilePath,
        JSON.stringify({ perfilUsuario: filteredProfile }),
        'utf8'
      );
    } catch (err) {
      console.error('Error saving profile locally:', err);
      showCustomAlert('Error', 'No se pudo guardar el perfil localmente.');
    }
  };

  const handleOpenValidationModal = () => {
    if (!profile.internetEnabled) {
      showCustomAlert('Modo sin Internet', 'Debes habilitar internet para validar cuenta.');
      return;
    }
    setTempEmail('');
    setTempPhone('');
    setTempSelectedCountry({ flag: '🇵🇪', dial_code: '51' });
    setShowValidationModal(true);
  };

  const fetchExistingData = async () => {
    if (!profile.internetEnabled) {
      showCustomAlert('Modo sin Internet', 'Debes habilitar internet para validar cuenta.');
      return;
    }
    try {
      const body = {
        a: 'login_second',
        correo: tempEmail.toLowerCase(),
        prefijo: tempSelectedCountry.dial_code,
        telefono: tempPhone,
      };

      const resp = await fetch('https://biblioteca1.info/docsafe/api/registrar_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const textResp = await resp.text();
      let data;
      try {
        data = JSON.parse(textResp);
      } catch (e) {
        showCustomAlert('Error', 'No se pudo parsear la respuesta del servidor: ' + textResp);
        return;
      }

      if (resp.ok && data.success) {
        const { cliente_data } = data;
        setProfile((prev) => ({
          ...prev,
          name: cliente_data.nombre || prev.name,
          correo: cliente_data.correo || prev.correo,
          prefijo: String(cliente_data.prefijo) || prev.prefijo,
          telefono: cliente_data.telefono || prev.telefono,
          ciudad: cliente_data.ciudad || prev.ciudad,
          fec_ini: cliente_data.fec_ini || prev.fec_ini,
          fec_fin: cliente_data.fec_fin || prev.fec_fin,
          clienteId: cliente_data.cliente_id || prev.clienteId,
        }));

        const foundC = countryDataList.find(
          (c) => c.dial_code === String(cliente_data.prefijo)
        );
        if (foundC) {
          setSelectedCountry({
            flag: foundC.flag,
            dial_code: foundC.dial_code,
          });
        }
        setIsExistingUser(true);
        setShowValidationModal(false);
        showCustomAlert(
          'Datos cargados',
          'Se autocompletaron los datos. Modifica y guarda de nuevo.'
        );
      } else {
        showCustomAlert('Error', data.message || 'No se pudo obtener datos del usuario.');
      }
    } catch (err) {
      showCustomAlert('Error', err.message);
    }
  };

  const onAcceptAlert = () => {
    setAlertVisible(false);
    if (alertData.title === 'Éxito' && alertData.token) {
      navigation.navigate('Login');
    }
  };

  let buttonLabel = 'Guardar Localmente';
  if (firstTime || fromWelcome) {
    if (profile.internetEnabled) {
      buttonLabel = 'Guardar y Registrar';
    } else {
      buttonLabel = 'Guardar Localmente';
    }
  } else {
    if (profile.internetEnabled) {
      buttonLabel = 'Guardar y Actualizar en la Nube';
    } else {
      buttonLabel = 'Guardar Localmente';
    }
  }

  const showInternetSwitch = !fromWelcome && !firstTime;

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={
            profile.profileImage
              ? { uri: profile.profileImage }
              : require('../src/presentation/assets/Logo.jpg')
          }
          style={styles.profileImage}
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={profile.name}
            onChangeText={(text) => handleChange('name', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={profile.correo}
            onChangeText={(text) => handleChange('correo', text)}
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <View style={styles.phoneInputContainer}>
            <TouchableOpacity
              style={[styles.countryCodeButton, { backgroundColor: '#fff', borderColor: '#165bbd' }]}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.countryCodeText}>
                {selectedCountry.flag} +{selectedCountry.dial_code}
              </Text>
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
          <Text style={styles.label}>Código de acceso (4 dígitos)</Text>
          <TextInput
            style={styles.input}
            placeholder="Código de acceso"
            value={profile.loginCode}
            onChangeText={(text) => handleChange('loginCode', text)}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ciudad"
            value={profile.ciudad}
            onChangeText={(text) => handleChange('ciudad', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Habilitar autenticación biométrica</Text>
            <Switch
              value={profile.biometricsEnabled}
              onValueChange={(val) => toggleBiometrics(val)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={profile.biometricsEnabled ? '#155abd' : '#f4f3f4'}
            />
          </View>
        </View>

        {showInternetSwitch && (
          <View style={styles.inputContainer}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>Usar la app con Internet</Text>
              <Switch
                value={profile.internetEnabled}
                onValueChange={(val) => toggleInternetMode(val)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={profile.internetEnabled ? '#155abd' : '#f4f3f4'}
              />
            </View>
            <Text style={{ fontStyle: 'italic', color: '#333' }}>
              {profile.internetEnabled
                ? 'Funciona con validaciones/actualizaciones en la nube.'
                : 'Solo guardará localmente.'}
            </Text>
          </View>
        )}

        <View style={styles.termsContainer}>
          <CheckBox
            value={profile.termsAccepted}
            onValueChange={() => handleChange('termsAccepted', !profile.termsAccepted)}
            tintColors={{ true: '#155abd', false: '#767577' }}
          />
          <Text
            style={styles.termsText}
            onPress={() => Linking.openURL('https://solucionestecperu.com/soporte/')}
          >
            Acepto los <Text style={styles.linkText}>términos y condiciones</Text>
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
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
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCountryPicker(false)}
              >
                <FontAwesomeIcon icon={faTimes} size={24} color="#000" />
              </TouchableOpacity>
              <ScrollView>
                {countryDataList.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry({ flag: c.flag, dial_code: c.dial_code });
                      handleChange('prefijo', c.dial_code);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryText}>
                      {c.flag} {c.name} (+{c.dial_code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        token={alertData.token}
        onClose={() => setAlertVisible(false)}
        onAccept={onAcceptAlert}
      />

      <Modal
        transparent
        animationType="slide"
        visible={showFirstModal}
        onRequestClose={() => setShowFirstModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalOptionContainer}>
            <Text style={styles.modalTitle}>¿Ya tienes un correo registrado?</Text>
            <Text style={styles.modalMessage}>
              Elige si deseas actualizar los datos de tu cuenta existente
              o crear una nueva cuenta con un correo distinto.
            </Text>

            <View style={{ justifyContent: 'space-around', marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#165bbd' }]}
                onPress={() => {
                  setShowFirstModal(false);
                  handleOpenValidationModal();
                }}
              >
                <Text style={styles.optionButtonText}>Actualizar Datos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#165bbd', marginTop: 15 }]}
                onPress={() => setShowFirstModal(false)}
              >
                <Text style={styles.optionButtonText}>Crear Cuenta Nueva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="slide"
        visible={showValidationModal}
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalContentSecond}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowValidationModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} size={24} color="#000" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Validar Datos Existentes</Text>
            <Text style={{ marginBottom: 10 }}>
              Ingresa tu correo, país y teléfono registrados
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Correo existente"
              value={tempEmail}
              onChangeText={setTempEmail}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.countryCodeButton, { marginBottom: 10, width: '100%' }]}
              onPress={() => setShowCountryPickerValidation(true)}
            >
              <Text style={styles.countryCodeText}>
                {tempSelectedCountry.flag} +{tempSelectedCountry.dial_code}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              value={tempPhone}
              onChangeText={setTempPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.button, { marginTop: 10 }]}
              onPress={fetchExistingData}
            >
              <Text style={styles.buttonText}>Cargar Datos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="slide"
        visible={showCountryPickerValidation}
        onRequestClose={() => setShowCountryPickerValidation(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCountryPickerValidation(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCountryPickerValidation(false)}
              >
                <FontAwesomeIcon icon={faTimes} size={24} color="#000" />
              </TouchableOpacity>
              <ScrollView>
                {countryDataList.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.countryItem}
                    onPress={() => {
                      setTempSelectedCountry({ flag: c.flag, dial_code: c.dial_code });
                      setShowCountryPickerValidation(false);
                    }}
                  >
                    <Text style={styles.countryText}>
                      {c.flag} {c.name} (+{c.dial_code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// Validaciones
const validateEmail = (email) =>
  /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);
const validateTelefono = (telefono) =>
  /^[0-9]{9}$/.test(telefono);
const validateLoginCode = (loginCode) =>
  loginCode.length === 4 && !isNaN(loginCode);

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  scrollContainer: { padding: 20, alignItems: 'center' },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: '#165bbd',
    borderWidth: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  inputContainer: { width: '100%', marginBottom: 15 },
  label: { fontSize: 16, color: '#333', marginBottom: 5, fontWeight: '500' },
  input: {
    color: '#333',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 10,
  },
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
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#155abd',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  errorText: { color: 'red', fontSize: 14, marginTop: 5 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  closeButton: { alignSelf: 'flex-end', marginBottom: 10 },
  countryItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  countryText: { fontSize: 16, color: '#333' },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  termsText: { marginLeft: 10, color: '#333', fontSize: 16 },
  linkText: { color: '#155abd', textDecorationLine: 'underline' },
  switchContainer: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOptionContainer: {
    width: '85%', backgroundColor: '#fff',
    borderRadius: 10, padding: 20,
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16, marginBottom: 10,
  },
  optionButton: {
    padding: 12, borderRadius: 8,
  },
  optionButtonText: {
    color: '#fff', fontSize: 16, textAlign: 'center',
  },
  modalContentSecond: {
    width: '85%', backgroundColor: '#fff',
    borderRadius: 10, padding: 20,
  },
});

export default ProfileScreen;