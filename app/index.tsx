import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TITLE_DEFAULT = "Door Bob";
const TITLE_OPENING = "Door Opening";
const COLOR_DEFAULT = "#6C63FF"; // blue-purple
const COLOR_OPENING = "#FF9800"; // orange

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
];

const SECURESTORE_URL_KEY = "doorbob_url";
const SECURESTORE_LANG_KEY = "doorbob_lang";

// Translations
const TRANSLATIONS: Record<
  string,
  {
    title: string;
    opening: string;
    holdToOpen: string;
    settings: string;
    settingsTitle: string;
    language: string;
    apiUrl: string;
    cancel: string;
    save: string;
    error: string;
    fail: string;
    failReason: string;
    funnySuccess: string;
    unknown: string;
  }
> = {
  en: {
    title: "Door Bob",
    opening: "Door Opening...",
    holdToOpen: "Hold to Open",
    settings: "⚙️ Settings",
    settingsTitle: "Settings",
    language: "Language",
    apiUrl: "API URL",
    cancel: "Cancel",
    save: "Save",
    error: "Error",
    fail: "Sorry, try again later...",
    failReason: "The door didn't respond. Maybe it's napping?",
    funnySuccess: "Door opened! 🥳 Don't let the cat out!",
    unknown: "Hmm, something unexpected happened.",
  },
  de: {
    title: "Tür Bob",
    opening: "Tür öffnet...",
    holdToOpen: "Halten zum Öffnen",
    settings: "⚙️ Einstellungen",
    settingsTitle: "Einstellungen",
    language: "Sprache",
    apiUrl: "API-URL",
    cancel: "Abbrechen",
    save: "Speichern",
    error: "Fehler",
    fail: "Sorry, versuch es später nochmal...",
    failReason: "Die Tür hat nicht geantwortet. Vielleicht schläft sie?",
    funnySuccess: "Tür geöffnet! 🥳 Lass die Katze nicht raus!",
    unknown: "Hmm, etwas Unerwartetes ist passiert.",
  },
  fr: {
    title: "Porte Bob",
    opening: "Ouverture de la porte...",
    holdToOpen: "Maintenir pour ouvrir",
    settings: "⚙️ Paramètres",
    settingsTitle: "Paramètres",
    language: "Langue",
    apiUrl: "URL de l'API",
    cancel: "Annuler",
    save: "Enregistrer",
    error: "Erreur",
    fail: "Désolé, réessayez plus tard...",
    failReason: "La porte n'a pas répondu. Elle fait peut-être la sieste ?",
    funnySuccess: "Porte ouverte ! 🥳 Ne laisse pas sortir le chat !",
    unknown: "Hmm, quelque chose d'inattendu s'est produit.",
  },
};

export default function Index() {
  // Force dark mode
  // const colorScheme = useColorScheme();
  // const isDark = colorScheme === "dark";
  const isDark = true;
  const [title, setTitle] = useState(TITLE_DEFAULT);
  const [titleColor, setTitleColor] = useState(COLOR_DEFAULT);
  const [subtitle, setSubtitle] = useState(""); // For fail/funny/extra messages
  const [holding, setHolding] = useState(false);
  const [loading, setLoading] = useState(false);
  const animation = useRef(new Animated.Value(1)).current;
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Settings state
  const [modalVisible, setModalVisible] = useState(false);
  const [apiUrl, setApiUrl] = useState("http://192.168.178.59/api/click");
  const [language, setLanguage] = useState("en");
  const [tempUrl, setTempUrl] = useState(apiUrl);
  const [tempLang, setTempLang] = useState(language);

  // Load settings from SecureStore
  useEffect(() => {
    (async () => {
      const storedUrl = await SecureStore.getItemAsync(SECURESTORE_URL_KEY);
      const storedLang = await SecureStore.getItemAsync(SECURESTORE_LANG_KEY);
      if (storedUrl) {
        setApiUrl(storedUrl);
        setTempUrl(storedUrl);
      }
      if (storedLang) {
        setLanguage(storedLang);
        setTempLang(storedLang);
      }
    })();
  }, []);

  // Stripe animation
  const stripeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(stripeAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [stripeAnim]);

  // Helper for translation
  const t = (key: keyof typeof TRANSLATIONS["en"]) =>
    TRANSLATIONS[language]?.[key] ?? TRANSLATIONS["en"][key];

  // Improved button animation: scale + color
  const colorAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: holding ? 1 : 0,
      duration: holding ? 300 : 200,
      useNativeDriver: false,
    }).start();
  }, [holding]);

  const interpolatedButtonColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#23263A" : "#6C63FF", "#FF9800"],
  });

  // Hold duration (ms)
  const HOLD_DURATION = 1500;

  const handlePressIn = () => {
    if (loading) return;
    setHolding(true);
    setSubtitle("");
    // Start progress bar animation
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    Animated.timing(animation, {
      toValue: 1.2,
      duration: 300,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
    holdTimeout.current = setTimeout(async () => {
      setLoading(true);
      setTitle(t("opening"));
      setTitleColor(COLOR_OPENING);
      setSubtitle("");
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
        });
        const data = await res.text();

        if (data === "Clicked!") {
          setTitle(t("funnySuccess"));
          setTitleColor("#4CAF50"); // green
          setSubtitle("");
          // Reset button scale immediately on success
          Animated.timing(animation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
          setTimeout(() => {
            setTitle(t("title"));
            setTitleColor(COLOR_DEFAULT);
            setHolding(false);
            setSubtitle("");
          }, 2000);
        } else if (data && data.length > 0) {
          setTitle(t("fail"));
          setTitleColor("#FF0000");
          setSubtitle(`${t("failReason")}\n(${data})`);
          // Reset button scale immediately on fail
          Animated.timing(animation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          setTitle(t("unknown"));
          setTitleColor("#FF9800");
          setSubtitle("");
          // Reset button scale immediately on unknown
          Animated.timing(animation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      } catch (e) {
        setTitle(t("error"));
        setTitleColor("#FF0000");
        setSubtitle(t("failReason"));
        // Reset button scale immediately on error
        Animated.timing(animation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
      setLoading(false);
      // Reset progress bar
      progressAnim.setValue(0);
    }, HOLD_DURATION) as any;
  };

  const handlePressOut = () => {
    if (loading) return;
    setHolding(false);
    Animated.timing(animation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    // Reset progress bar
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  // Modal handlers
  const openModal = () => {
    setTempUrl(apiUrl);
    setTempLang(language);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const saveSettings = async () => {
    setApiUrl(tempUrl);
    setLanguage(tempLang);
    await SecureStore.setItemAsync(SECURESTORE_URL_KEY, tempUrl);
    await SecureStore.setItemAsync(SECURESTORE_LANG_KEY, tempLang);
    setModalVisible(false);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: isDark ? "#181A20" : "#F5F6FA" }}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#181A20" : "#F5F6FA",
          },
        ]}
      >
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : null}
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                opacity: holding && !loading ? 1 : 0.3,
              },
            ]}
          />
        </View>
        <Animated.View
          style={{
            transform: [{ scale: animation }],
            opacity: loading ? 0.6 : 1,
            borderRadius: 32,
            elevation: 4,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            minWidth: 200,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: interpolatedButtonColor,
              borderRadius: 32,
            }}
          >
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={({ pressed }) => [
                styles.button,
                pressed || holding ? styles.buttonActive : null,
              ]}
              disabled={loading}
            >
              {/* No stripes overlay */}
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>{t("holdToOpen")}</Text>
              )}
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.settingsButton} onPress={openModal}>
          <Text style={styles.settingsButtonText}>{t("settings")}</Text>
        </TouchableOpacity>
      </View>
      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("settingsTitle")}</Text>
            <Text style={styles.modalLabel}>{t("language")}</Text>
            <View style={styles.languageRow}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    tempLang === lang.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => setTempLang(lang.code)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      tempLang === lang.code && styles.languageTextSelected,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>{t("apiUrl")}</Text>
            <TextInput
              style={styles.input}
              value={tempUrl}
              onChangeText={setTempUrl}
              placeholder={t("apiUrl")}
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveSettings}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  {t("save")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 60,
    letterSpacing: 2,
  },
  subtitle: {
    color: "#FF9800",
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 16,
    minHeight: 20,
  },
  progressBarContainer: {
    height: 8,
    width: 220,
    backgroundColor: "#35395C",
    borderRadius: 4,
    marginBottom: 24,
    overflow: "hidden",
    alignSelf: "center",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#FF9800",
    borderRadius: 4,
  },
  button: {
    paddingVertical: 24,
    paddingHorizontal: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  buttonActive: {},
  buttonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 1,
    zIndex: 2,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#23263A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 32,
  },
  settingsButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    elevation: 2,
  },
  settingsButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#23263A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    alignItems: "stretch",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    alignSelf: "center",
  },
  modalLabel: {
    color: "#bbb",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  languageOption: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "#35395C",
    marginRight: 8,
  },
  languageOptionSelected: {
    backgroundColor: "#6C63FF",
  },
  languageText: {
    color: "#bbb",
    fontSize: 16,
  },
  languageTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#35395C",
    color: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 18,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 18,
    backgroundColor: "#35395C",
    marginLeft: 10,
  },
  modalButtonSave: {
    backgroundColor: "#6C63FF",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  }
});