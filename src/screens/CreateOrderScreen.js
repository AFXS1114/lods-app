import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator // ⬅️ 1. Added ActivityIndicator
  ,
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
import { auth, db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function CreateOrderScreen({ route, navigation }) {
  const type = route.params?.type || "BuyMe"; 
  
  const [customerName, setCustomerName] = useState("");
  const [location, setLocation] = useState("");
  const [items, setItems] = useState([{ name: "", qty: "1" }]);
  const [loading, setLoading] = useState(false); // ⬅️ 2. Added loading state
  const deliveryFee = 49;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setCustomerName(userDoc.data().fullName);
        }
      } catch (err) {
        console.log("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const addItemRow = () => setItems([...items, { name: "", qty: "1" }]);

  const removeItemRow = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    const isItemsValid = items.every(item => item.name.trim() !== "" && item.qty.trim() !== "");
    
    if (!isItemsValid || !location) {
      Alert.alert("Missing Info", "Please provide item names, quantities, and a delivery address.");
      return;
    }

    setLoading(true); // ⬅️ 3. Start Animation
    try {
      await addDoc(collection(db, "orders"), {
        serviceType: type,
        customerName: customerName,
        customerId: auth.currentUser.uid,
        itemsList: items, 
        itemPrice: 0, 
        deliveryFee: deliveryFee,
        totalDue: deliveryFee,
        deliveryLocation: location,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      
      Alert.alert("Order Placed!", "Your rider will update the price upon purchase.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false); // ⬅️ 4. Stop Animation (even if it fails)
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView style={globalStyles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>
            {type === "BuyMe" ? "🛍️ Buy Me List" : "📦 Pick Up Details"}
          </Text>

          <View style={globalStyles.card}>
            <Text style={styles.label}>Items to Purchase</Text>
            
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <TextInput
                  style={[globalStyles.input, styles.itemInput]}
                  placeholder="e.g. Rice"
                  value={item.name}
                  onChangeText={(val) => updateItem(index, "name", val)}
                  editable={!loading} // Disable inputs while loading
                />
                <TextInput
                  style={[globalStyles.input, styles.qtyInput]}
                  placeholder="Qty"
                  keyboardType="numeric"
                  value={item.qty}
                  onChangeText={(val) => updateItem(index, "qty", val)}
                  editable={!loading}
                />
                {items.length > 1 && !loading && (
                  <TouchableOpacity onPress={() => removeItemRow(index)} style={styles.removeBtn}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addButton} 
              onPress={addItemRow}
              disabled={loading}
            >
              <Text style={[styles.addButtonText, loading && { color: '#ccc' }]}>+ Add More Item</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.label}>Deliver To:</Text>
            <TextInput 
              style={globalStyles.input} 
              placeholder="Landmark or Address in Bulan" 
              value={location} 
              onChangeText={setLocation} 
              editable={!loading}
            />

            <View style={styles.feeContainer}>
              <Text style={styles.feeText}>Base Delivery Fee:</Text>
              <Text style={styles.feeAmount}>₱{deliveryFee.toFixed(2)}</Text>
            </View>

            {/* 🟢 UPDATED BUTTON WITH ANIMATION */}
            <TouchableOpacity 
              style={[globalStyles.primaryButton, loading && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={globalStyles.buttonText}>Confirm Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20, color: COLORS.text, paddingHorizontal: 5 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10, color: '#555' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemInput: { flex: 3, marginBottom: 0, marginRight: 8 },
  qtyInput: { flex: 1, marginBottom: 0, marginRight: 8, textAlign: 'center' },
  removeBtn: { padding: 5 },
  removeText: { color: '#FF6B6B', fontSize: 20, fontWeight: 'bold' },
  addButton: { alignSelf: 'flex-start', paddingVertical: 10 },
  addButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  feeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#f8f9fa', 
    padding: 15, 
    borderRadius: 10, 
    marginVertical: 20 
  },
  feeText: { fontWeight: '600', color: '#666' },
  feeAmount: { fontWeight: 'bold', color: COLORS.primary, fontSize: 16 }
});