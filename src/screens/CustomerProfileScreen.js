import { updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
  const [modalVisible, setModalVisible] = useState(false);
  
  // State for user details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 1. Fetch user data on load
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setName(data.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Updates
  const handleUpdate = async () => {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      Alert.alert("Validation Error", "Name, Phone, and Address are required.");
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        name: name,
        phone: phone,
        address: address,
      });

      if (newPassword.length > 0) {
        if (newPassword.length < 6) throw new Error("Password must be 6+ characters.");
        await updatePassword(auth.currentUser, newPassword);
      }

      Alert.alert("Success! 🛵", "Profile updated successfully.");
      setNewPassword(""); 
      setModalVisible(false); // Close modal on success
    } catch (error) {
      const msg = error.code === 'auth/requires-recent-login' 
        ? "Security Check: Please re-login to change password." 
        : error.message;
      Alert.alert("Update Failed", msg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* PROFILE VIEW (READ ONLY) */}
      <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || "U"}</Text>
          </View>
          <Text style={styles.displayEmail}>{auth.currentUser.email}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoText}>{name || "Not set"}</Text>

          <Text style={styles.infoLabel}>Phone Number</Text>
          <Text style={styles.infoText}>{phone || "Not set"}</Text>

          <Text style={styles.infoLabel}>Delivery Address</Text>
          <Text style={styles.infoText}>{address || "Not set"}</Text>
        </View>

        <TouchableOpacity 
          style={styles.openModalBtn} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Edit Profile Information</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* UPDATE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Update Profile</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full Name" placeholderTextColor="#999" />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09123456789" placeholderTextColor="#999" />

              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} multiline numberOfLines={3} placeholderTextColor="#999" />

              <View style={styles.divider} />

              <Text style={styles.label}>New Password (Optional)</Text>
              <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="6+ characters" placeholderTextColor="#999" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={updating}>
                  {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  displayEmail: { marginTop: 10, color: '#666', fontSize: 16 },
  infoSection: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2 },
  infoLabel: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
  infoText: { fontSize: 16, color: '#333', marginBottom: 15 },
  openModalBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: COLORS.secondary },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 5 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontSize: 16, marginBottom: 15, color: '#000' },
  textArea: { height: 80, textAlignVertical: 'top' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingBottom: 20 },
  cancelBtn: { padding: 15, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, flex: 2, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' }
});