import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function CreateOrderScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Form States
  const [items, setItems] = useState([{ name: "", qty: "1" }]); // Array of items
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    const autoFill = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().address) {
          setDeliveryAddress(userDoc.data().address);
        }
      } catch (error) { console.error(error); }
      finally { setFetchingProfile(false); }
    };
    autoFill();
  }, []);

  // Function to add a new empty item row
  const addMoreItem = () => {
    setItems([...items, { name: "", qty: "1" }]);
  };

  // Function to update a specific item in the list
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handlePlaceOrder = async () => {
    if (items.some(i => !i.name.trim()) || !deliveryAddress.trim()) {
      Alert.alert("Error", "Please fill in all item names and delivery address.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        customerId: auth.currentUser.uid,
        customerName: auth.currentUser.displayName || "LODS Customer",
        items: items, // Sending the full list of items
        deliveryAddress,
        instructions,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success! 🛵", "Order sent!", [{ text: "OK", onPress: () => navigation.navigate("CustomerHome") }]);
    } catch (error) { Alert.alert("Error", error.message); }
    finally { setLoading(false); }
  };

  if (fetchingProfile) return <ActivityIndicator size="large" color={COLORS.primary} style={{flex:1}} />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={globalStyles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Place New Order</Text>

        <Text style={styles.label}>Items to Buy</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TextInput
              style={[styles.input, { flex: 3 }]}
              placeholder="Item name (e.g. Burger)"
              value={item.name}
              onChangeText={(val) => updateItem(index, "name", val)}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 10 }]}
              placeholder="Qty"
              keyboardType="numeric"
              value={item.qty}
              onChangeText={(val) => updateItem(index, "qty", val)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addMoreItem}>
          <Text style={styles.addBtnText}>+ Add More Item</Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Delivery Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderButtonText}>Confirm Order</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.secondary, marginVertical: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 5 },
  itemRow: { flexDirection: 'row', marginBottom: 10 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 60, textAlignVertical: 'top' },
  inputGroup: { marginTop: 20 },
  addBtn: { padding: 10, alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 8, marginTop: 5 },
  addBtnText: { color: '#2e7d32', fontWeight: 'bold' },
  orderButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  orderButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});