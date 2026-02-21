import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS, SPACING } from "../styles/theme";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Basic validation
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      /**
       * 🚀 THE LOGIC:
       * We simply sign in. We do NOT use navigation.replace here.
       * Your updated App.js is watching 'onAuthStateChanged'. 
       * As soon as this line succeeds, App.js will:
       * 1. Detect the user.
       * 2. Fetch the role from Firestore.
       * 3. Send you to the correct Dashboard (Manager, Rider, or Customer).
       */
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
    } catch (error) {
      console.error(error);
      let errorMessage = "An error occurred during login.";
      
      // Professional error handling
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: '#fff' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.brandLogo}>L</Text>
            </View>
            <Text style={styles.brandName}>LODS</Text>
            <Text style={styles.tagline}>Lean On Us for All Your Delivery Needs!</Text>
          </View>

          {/* Login Card */}
          <View style={styles.loginCard}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                style={globalStyles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={globalStyles.input}
              />
            </View>

            <TouchableOpacity 
              style={[globalStyles.primaryButton, styles.loginBtn, loading && { opacity: 0.8 }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={globalStyles.buttonText}>Login to Dashboard</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Navigation */}
          <TouchableOpacity 
            onPress={() => navigation.navigate("Register")}
            style={styles.registerLink}
          >
            <Text style={styles.footerText}>
              New to LODS? <Text style={styles.highlightText}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: SPACING.m },
  headerSection: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    elevation: 4, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10,
  },
  brandLogo: { fontSize: 42, fontWeight: '900', color: '#fff' },
  brandName: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: 2 },
  tagline: { fontSize: 14, color: COLORS.textLight, marginTop: 5 },
  loginCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 25,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 25, textAlign: 'center' },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginLeft: 4 },
  loginBtn: { marginTop: 10, height: 55 },
  registerLink: { marginTop: 30, alignItems: 'center' },
  footerText: { color: COLORS.textLight, fontSize: 15 },
  highlightText: { color: COLORS.primary, fontWeight: 'bold' },
});