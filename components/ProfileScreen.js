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
  Switch
} from 'react-native';
import RNFS from 'react-native-fs';
import ReactNativeBiometrics from 'react-native-biometrics';
import CustomAlert from './CustomAlert';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import CheckBox from '@react-native-community/checkbox';
import * as RNLocalize from 'react-native-localize';

// ---------------------------------------------------
// Lista de "países" (picker) para ambos modales
// ---------------------------------------------------
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

// ---------------------------------------------------
// Mapa de región del dispositivo a prefijo
// ---------------------------------------------------
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
  /**
   * fromWelcome = true  => Pantalla abierta tras "Crear Cuenta" (WelcomeScreen)
   * fromWelcome = false => Pantalla abierta desde otra parte de la app
   */
  const { fromWelcome = false } = route.params || {};

  const [profile, setProfile] = useState({
    name: '',
    profileImage: null,
    loginCode: '',
    ciudad: '',
    telefono: '',
    prefijo: '51', // Campo para la API (en lugar de codigoPais)
    correo: '',
    biometricsEnabled: false,
    fec_ini: '',
    fec_fin: '',
    termsAccepted: false,
    clienteId: '',
  });

  // Indica si el perfil no existía localmente
  const [firstTime, setFirstTime] = useState(true);

  // Indica si el usuario ya existe en la BD (tras "login_second")
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Ruta local del JSON donde guardamos el perfil
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;

  // Manejo de errores
  const [errorTelefono, setErrorTelefono] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert personalizado
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', token: '' });

  // Country Picker (principal)
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ flag: '🇵🇪', dial_code: '51' });

  // Guardamos el loginCode inicial (para saber si cambió y si redirigir)
  const [initialLoginCode, setInitialLoginCode] = useState('');

  // Modal #1: Pregunta "¿Actualizar o crear nueva?"
  const [showFirstModal, setShowFirstModal] = useState(false);

  // Modal #2: Validación con login_second (correo + prefijo + teléfono)
  const [showValidationModal, setShowValidationModal] = useState(false);

  // En el modal #2, también usamos un picker para el prefijo
  const [showCountryPickerValidation, setShowCountryPickerValidation] = useState(false);
  const [tempSelectedCountry, setTempSelectedCountry] = useState({ flag: '🇵🇪', dial_code: '51' });

  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // ------------------------------------------------------------------
  // Al montar el componente:
  //  1) Leemos el perfil local. Si existe, lo cargamos al state.
  //  2) Si fromWelcome = true => abrimos el modal #1
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileExists = await RNFS.exists(profilePath);
        if (profileExists) {
          const profileData = await RNFS.readFile(profilePath);
          const savedProfile = JSON.parse(profileData).perfilUsuario;

          setProfile((prev) => ({ ...prev, ...savedProfile }));
          setInitialLoginCode(savedProfile.loginCode);

          if (savedProfile.prefijo) {
            const countryData = countryDataList.find(
              (c) => c.dial_code === savedProfile.prefijo
            );
            if (countryData) {
              setSelectedCountry({
                flag: countryData.flag,
                dial_code: countryData.dial_code,
              });
            }
          }
          setFirstTime(false);
        } else {
          // No existe perfil => set defaults
          const deviceCountry = RNLocalize.getCountry() || 'PE';
          const devicePrefix = countryCodeMap[deviceCountry] || '51';

          setProfile((prev) => ({ ...prev, prefijo: devicePrefix }));

          const countryData = countryDataList.find((c) => c.dial_code === devicePrefix);
          if (countryData) {
            setSelectedCountry({ flag: countryData.flag, dial_code: devicePrefix });
          }
          setFirstTime(true);
        }

        // Si venimos de WelcomeScreen, mostramos modal #1
        if (fromWelcome) {
          setShowFirstModal(true);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        showCustomAlert('Error', 'Error al cargar el perfil: ' + error.message);
      }
    };
    loadProfile();
  }, [fromWelcome]);

  // --------------------------------------------------------------------
  // setProfile con callback
  // --------------------------------------------------------------------
  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  // --------------------------------------------------------------------
  // showCustomAlert
  // --------------------------------------------------------------------
  const showCustomAlert = (title, message, token = '') => {
    setAlertData({ title, message, token });
    setAlertVisible(true);
  };

  // --------------------------------------------------------------------
  // Biometría
  // --------------------------------------------------------------------
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
    } catch (error) {
      console.error('Error al verificar autenticación biométrica:', error);
      showCustomAlert(
        'Error',
        'Autenticación biométrica no disponible en este dispositivo o no se completó.'
      );
      setProfile((prev) => ({ ...prev, biometricsEnabled: false }));
    }
  };

  // --------------------------------------------------------------------
  // handleSaveProfile
  //   - Insert => "a": "I", "ope_estado_id": 2, "fec_cre", ...
  //   - Update => "a": "U", "ope_estado_id": 1, "fec_mod", ...
  // --------------------------------------------------------------------
  const handleSaveProfile = async () => {
    if (isSubmitting) return;

    // Convertir a minúsculas
    if (profile.correo) profile.correo = profile.correo.toLowerCase();
    if (profile.name) profile.name = profile.name.toLowerCase();
    if (profile.ciudad) profile.ciudad = profile.ciudad.toLowerCase();

    // Validación de términos
    if (!profile.termsAccepted) {
      showCustomAlert('Error', 'Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    setIsSubmitting(true);

    // Validaciones
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
      showCustomAlert('Error', 'El número de teléfono debe tener 9 dígitos (solo números).');
      return;
    }
    if (!validateLoginCode(profile.loginCode)) {
      setIsSubmitting(false);
      showCustomAlert('Error', 'El código de acceso debe tener 4 dígitos numéricos.');
      return;
    }

    // Si NO venimos de WelcomeScreen => guardado local
    if (!fromWelcome) {
      await saveProfileLocally(profile);
      setIsSubmitting(false);
      showCustomAlert('Guardado', 'Tus datos se han guardado localmente.');
      return;
    }

    // Venimos de WelcomeScreen => Insertar/Actualizar en la nube
    try {
      const currentDate = new Date();
      // Formato YYYY-MM-DD
      const today = currentDate.toISOString().split('T')[0];

      // Ejemplo: Sumamos +6 meses
      const endDateObj = new Date(currentDate);
      endDateObj.setMonth(endDateObj.getMonth() + 6);
      const endDate = endDateObj.toISOString().split('T')[0];

      // Si isExistingUser => Update ("U"), si no => Insert ("I")
      const actionType = isExistingUser ? 'U' : 'I';

      let datosPerfil = {};

      if (actionType === 'I') {
        datosPerfil = {
          a: 'I',
          tec_prf_id: 13,
          ope_estado_id: 2, // Insert => 2 (según tu especificación)
          correo: profile.correo,
          tec_ope_pass: profile.loginCode,
          nombre: profile.name,
          telefono: profile.telefono,
          ciudad: profile.ciudad,
          fec_cre: today,
          fec_ini: today,   // O el que desees (por ejemplo, '2025-02-01')
          fec_fin: endDate, // Por ejemplo
          prefijo: parseInt(profile.prefijo, 10),
        };
      } else {
        // Update
        datosPerfil = {
          a: 'U',
          cliente_id: profile.clienteId, // O el que retornó en la validación
          fec_mod: today,
          nombre: profile.name,
          correo: profile.correo,
          telefono: profile.telefono,
          ciudad: profile.ciudad,
          prefijo: parseInt(profile.prefijo, 10),
          fec_ini: profile.fec_ini || today,
          fec_fin: profile.fec_fin || endDate,
          ope_estado_id: 1, // Update => 1 (ejemplo en tu JSON)
          tec_ope_pass: profile.loginCode,
        };
      }

      const response = await fetch(
        'https://biblioteca1.info/docsafe/api/registrar_users.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosPerfil),
        }
      );

      const result = await response.json();
      if (response.ok && result.success === true) {
        // Se actualizaron/insertaron datos
        // La respuesta viene en result.cliente_data
        const { cliente_data } = result;

        // Actualizar profile con lo que retornó
        // (p. ej. "cliente_id", "fec_cre", etc.)
        setProfile((prev) => ({
          ...prev,
          ...cliente_data,
          // Aseguramos convertir prefijo a string para el picker
          prefijo: String(cliente_data.prefijo),
        }));

        // Actualizar picker de país
        const foundCountry = countryDataList.find(
          (c) => c.dial_code === String(cliente_data.prefijo)
        );
        if (foundCountry) {
          setSelectedCountry({
            flag: foundCountry.flag,
            dial_code: foundCountry.dial_code,
          });
        }

        // Guardar local
        await saveProfileLocally({
          ...profile,
          ...cliente_data,
          prefijo: String(cliente_data.prefijo),
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
    } catch (error) {
      showCustomAlert('Error', 'Hubo un problema al procesar el registro: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------
  // Guardar en JSON local
  // --------------------------------------------------------------------
  const saveProfileLocally = async (profileData) => {
    try {
      await RNFS.writeFile(
        profilePath,
        JSON.stringify({ perfilUsuario: profileData }),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving profile locally:', error);
      showCustomAlert('Error', 'No se pudo guardar el perfil localmente.');
    }
  };

  // --------------------------------------------------------------------
  // Abrir modal #2 => validación con "login_second"
  // --------------------------------------------------------------------
  const handleOpenValidationModal = () => {
    setTempEmail('');
    setTempPhone('');
    setTempSelectedCountry({ flag: '🇵🇪', dial_code: '51' });
    setShowValidationModal(true);
  };

  // --------------------------------------------------------------------
  // fetchExistingData => "login_second"
  // --------------------------------------------------------------------
  const fetchExistingData = async () => {
    try {
      const body = {
        a: 'login_second',
        correo: tempEmail.toLowerCase(),
        prefijo: tempSelectedCountry.dial_code,
        telefono: tempPhone,
      };

      const response = await fetch(
        'https://biblioteca1.info/docsafe/api/registrar_users.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        const { cliente_data } = data;

        // Autocompletar en el perfil
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

        // Actualizar el picker principal si cambió prefijo
        const foundCountry = countryDataList.find(
          (c) => c.dial_code === String(cliente_data.prefijo)
        );
        if (foundCountry) {
          setSelectedCountry({
            flag: foundCountry.flag,
            dial_code: foundCountry.dial_code,
          });
        }

        // Marcamos que es un usuario existente
        setIsExistingUser(true);

        // Cerrar modal
        setShowValidationModal(false);

        showCustomAlert(
          'Datos cargados',
          'Se han autocompletado los datos. Ahora puedes modificarlos y Guardar de nuevo.'
        );
      } else {
        showCustomAlert('Error', data.message || 'No se pudo obtener datos del usuario.');
      }
    } catch (error) {
      showCustomAlert('Error', error.message);
    }
  };

  // --------------------------------------------------------------------
  // Validaciones
  // --------------------------------------------------------------------
  const validateEmail = (email) => {
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);
  };
  const validateTelefono = (telefono) => {
    return /^[0-9]{9}$/.test(telefono);
  };
  const validateLoginCode = (loginCode) => {
    return loginCode.length === 4 && !isNaN(loginCode);
  };

  // --------------------------------------------------------------------
  // onAcceptAlert => cierra alert y, opcionalmente, navega
  // --------------------------------------------------------------------
  const onAcceptAlert = () => {
    setAlertVisible(false);
    if (alertData.title === 'Éxito' && alertData.token) {
      // Por ejemplo: navega al Login si así lo quieres
      
    }
  };

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
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

        {/* Nombre */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={profile.name}
            onChangeText={(text) => handleChange('name', text)}
          />
        </View>

        {/* Correo */}
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

        {/* Teléfono + Picker de prefijo */}
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

        {/* Código de acceso */}
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

        {/* Ciudad */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ciudad"
            value={profile.ciudad}
            onChangeText={(text) => handleChange('ciudad', text)}
          />
        </View>

        {/* Switch biometría */}
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

        {/* Términos */}
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
          <Text style={styles.buttonText}>
            {fromWelcome ? 'Guardar y Registrar' : 'Guardar Localmente'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Picker principal de prefijos */}
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
                {countryDataList.map((country, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry({ flag: country.flag, dial_code: country.dial_code });
                      handleChange('prefijo', country.dial_code);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryText}>
                      {country.flag} {country.name} (+{country.dial_code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Alert personalizado */}
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        token={alertData.token}
        onClose={() => setAlertVisible(false)}
        onAccept={onAcceptAlert}
      />

      {/* Modal #1: Seleccionar si actualizar o nueva cuenta (sólo si fromWelcome) */}
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
            Elige si deseas actualizar los datos de tu cuenta existente o crear una nueva cuenta con un correo distinto.
            </Text>

            <View style={{ flexDirection: 'colum', justifyContent: 'space-around', margin: 10 }}>
              {/* Actualizar datos => modal #2 */}
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#165bbd' }]}
                onPress={() => {
                  setShowFirstModal(false);
                  handleOpenValidationModal();
                }}
              >
                <Text style={styles.optionButtonText}>Actualizar Datos</Text>
              </TouchableOpacity>

              {/* Nueva cuenta => cerramos modal y usuario llena el form */}
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#165bbd', marginTop: 20, }]}
                onPress={() => setShowFirstModal(false)}
              >
                <Text style={styles.optionButtonText}>Crear Cuenta Nueva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal #2: Validación => login_second (correo + prefijo + teléfono) */}
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

            {/* Correo */}
            <TextInput
              style={styles.input}
              placeholder="Correo existente"
              value={tempEmail}
              onChangeText={setTempEmail}
              autoCapitalize="none"
            />

            {/* Picker del prefijo en el modal #2 */}
            <TouchableOpacity
              style={[styles.countryCodeButton, { marginBottom: 10, width: '100%' }]}
              onPress={() => setShowCountryPickerValidation(true)}
            >
              <Text style={styles.countryCodeText}>
                {tempSelectedCountry.flag} +{tempSelectedCountry.dial_code}
              </Text>
            </TouchableOpacity>

            {/* Teléfono */}
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

      {/* Modal para el picker del prefijo en el modal #2 */}
      <Modal
        transparent={true}
        visible={showCountryPickerValidation}
        animationType="slide"
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
                {countryDataList.map((country, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.countryItem}
                    onPress={() => {
                      setTempSelectedCountry({
                        flag: country.flag,
                        dial_code: country.dial_code,
                      });
                      setShowCountryPickerValidation(false);
                    }}
                  >
                    <Text style={styles.countryText}>
                      {country.flag} {country.name} (+{country.dial_code})
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

// --------------------------------------------------------------------
// Validaciones
// --------------------------------------------------------------------
const validateEmail = (email) => {
  return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);
};

const validateTelefono = (telefono) => {
  return /^[0-9]{9}$/.test(telefono);
};

const validateLoginCode = (loginCode) => {
  return loginCode.length === 4 && !isNaN(loginCode);
};

// --------------------------------------------------------------------
// Estilos
// --------------------------------------------------------------------
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
  // Modal #1
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOptionContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 10,
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  // Modal #2
  modalContentSecond: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
});

export default ProfileScreen;