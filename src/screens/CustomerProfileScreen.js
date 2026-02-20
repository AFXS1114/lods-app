import { updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { auth, db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function CustomerProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // State for user details
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 1. Fetch user data from Firestore on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || "");
          setAddress(data.address || "");
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 2. The function to handle all updates
  const handleUpdate = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert("Validation Error", "Name and Address are required for deliveries.");
      return;
    }

    setUpdating(true);
    try {
      // Update Firestore profile details
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        name: name,
        address: address,
      });

      // Update Password if provided
      if (newPassword.length > 0) {
        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        await updatePassword(auth.currentUser, newPassword);
      }

      Alert.alert("Success! 🛵", "Profile updated successfully.");
      setNewPassword(""); // Reset password field
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert("Security Check", "Please log out and log back in to change your password.");
      } else {
        Alert.alert("Update Failed", error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={globalStyles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Account Settings</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Juan Dela Cruz"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Default Delivery Address (Bulan Area)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Zone 4, near the Parish Church"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <Text style={styles.hint}>Leave blank if you don't want to change it</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Minimum 6 characters"
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, updating && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.secondary, marginTop: 10 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 5 },
  hint: { fontSize: 12, color: '#999', marginBottom: 5 },
  input: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd',
    fontSize: 16
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  button: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10 
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});