import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    contactNo: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { fullName, address, contactNo, email, password, confirmPassword } = formData;

    // 1. Basic Validation
    if (!fullName || !address || !contactNo || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // 2. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Save Profile Info in Firestore 'users' collection
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        address,
        contactNo,
        email,
        role: "customer", // Defaulting to customer
        createdAt: new Date(),
      });

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
          
      ]);
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  }; 

  const updateInput = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={globalStyles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the LODS delivery community</Text>
        </View>

        <View style={globalStyles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={globalStyles.input} 
            placeholder="Juan Dela Cruz" 
            onChangeText={(v) => updateInput("fullName", v)} 
          />

          <Text style={styles.label}>Home Address</Text>
          <TextInput 
            style={globalStyles.input} 
            placeholder="Street, Barangay, Bulan" 
            onChangeText={(v) => updateInput("address", v)} 
          />

          <Text style={styles.label}>Contact Number</Text>
          <TextInput 
            style={globalStyles.input} 
            placeholder="09123456789" 
            keyboardType="phone-pad"
            onChangeText={(v) => updateInput("contactNo", v)} 
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput 
            style={globalStyles.input} 
            placeholder="juan@email.com" 
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(v) => updateInput("email", v)} 
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 5 }}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={globalStyles.input} 
                placeholder="******" 
                secureTextEntry 
                onChangeText={(v) => updateInput("password", v)} 
              />
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
              <Text style={styles.label}>Re-type</Text>
              <TextInput 
                style={globalStyles.input} 
                placeholder="******" 
                secureTextEntry 
                onChangeText={(v) => updateInput("confirmPassword", v)} 
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[globalStyles.primaryButton, { marginTop: 10 }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={globalStyles.buttonText}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.footerLink} 
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.footerText}>Already have an account? <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { marginVertical: 30 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 5, color: COLORS.text, marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLink: { padding: 20, alignItems: 'center' },
  footerText: { color: COLORS.textLight, fontSize: 14 },
});