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

export default function ManageRiderScreen() {
  const [formData, setFormData] = useState({
    fullName: "",
    contactNo: "",
    vehicle: "",
    plateNo: "",
    licenseNo: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleAddRider = async () => {
    const { fullName, contactNo, vehicle, plateNo, licenseNo, email, password } = formData;

    if (!fullName || !email || !password || !licenseNo) {
      Alert.alert("Error", "Please fill in all required fields including License No.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the Rider's Account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save detailed Rider Profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        contactNo,
        vehicle,
        plateNo,
        licenseNo,
        email,
        role: "rider", // Important: Set role as rider
        status: "active",
        createdAt: new Date(),
      });

      Alert.alert("Success", `Rider ${fullName} has been registered!`);
      // Reset form
      setFormData({ fullName: "", contactNo: "", vehicle: "", plateNo: "", licenseNo: "", email: "", password: "" });
      
    } catch (error) {
      Alert.alert("Failed to Add Rider", error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateInput = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={globalStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Register New Rider</Text>
          <Text style={styles.subtitle}>Enter vehicle and license details</Text>
        </View>

        <View style={globalStyles.card}>
          <Text style={styles.label}>Rider Full Name</Text>
          <TextInput style={globalStyles.input} placeholder="Juan Rider" onChangeText={(v) => updateInput("fullName", v)} value={formData.fullName} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 5 }}>
              <Text style={styles.label}>Vehicle Type</Text>
              <TextInput style={globalStyles.input} placeholder="e.g. Honda Click" onChangeText={(v) => updateInput("vehicle", v)} value={formData.vehicle} />
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
              <Text style={styles.label}>Plate No.</Text>
              <TextInput style={globalStyles.input} placeholder="123-ABC" onChangeText={(v) => updateInput("plateNo", v)} value={formData.plateNo} />
            </View>
          </View>

          <Text style={styles.label}>Driver's License No.</Text>
          <TextInput style={globalStyles.input} placeholder="E01-XX-XXXXXX" onChangeText={(v) => updateInput("licenseNo", v)} value={formData.licenseNo} />

          <Text style={styles.label}>Contact Number</Text>
          <TextInput style={globalStyles.input} placeholder="09XXXXXXXXX" keyboardType="phone-pad" onChangeText={(v) => updateInput("contactNo", v)} value={formData.contactNo} />

          <Text style={styles.label}>Email (Username)</Text>
          <TextInput style={globalStyles.input} placeholder="rider@lods.com" autoCapitalize="none" onChangeText={(v) => updateInput("email", v)} value={formData.email} />

          <Text style={styles.label}>Password</Text>
          <TextInput style={globalStyles.input} placeholder="******" secureTextEntry onChangeText={(v) => updateInput("password", v)} value={formData.password} />

          <TouchableOpacity style={[globalStyles.primaryButton, { marginTop: 15 }]} onPress={handleAddRider} disabled={loading}>
            <Text style={globalStyles.buttonText}>{loading ? "Saving..." : "Add Rider Account"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { marginVertical: 20 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 5, color: COLORS.text, marginTop: 10 },
  row: { flexDirection: 'row' },
});