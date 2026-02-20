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

// Import from root folder
import bulanRates from "../../bulan_rates.json";

export default function CreateOrderScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Form States
  const [items, setItems] = useState([{ name: "", qty: "1" }]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [instructions, setInstructions] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [userPhone, setUserPhone] = useState(""); // 👈 Added state for phone

  // 1. Fetch Profile on load
  useEffect(() => {
    const initScreen = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserPhone(userDoc.data().phone || ""); // 👈 Store phone for the order
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setFetchingProfile(false);
      }
    };
    initScreen();
  }, []);

  // 2. Search Logic
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 1) {
      const results = bulanRates.filter(loc => 
        loc.LOCATION.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredLocations(results.slice(0, 5));
    } else {
      setFilteredLocations([]);
    }
  };

  const selectLocation = (loc) => {
    setSelectedLocation(loc.LOCATION);
    setSearchQuery(loc.LOCATION);
    setDeliveryFee(parseInt(loc["DELIVERY FEE"]));
    setFilteredLocations([]);
  };

  // 3. Item List Logic
  const addMoreItem = () => setItems([...items, { name: "", qty: "1" }]);
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // 4. Submit Order & Redirect
  const handlePlaceOrder = async () => {
    if (items.some(i => !i.name.trim()) || !selectedLocation) {
      Alert.alert("Missing Info", "Please add at least one item and select a delivery location.");
      return;
    }

    setLoading(true);
    try {
      // Create the order document
      await addDoc(collection(db, "orders"), {
        customerId: auth.currentUser.uid,
        customerName: auth.currentUser.displayName || "LODS Customer",
        customerPhone: userPhone, // 👈 Critical for Rider Call feature
        items,
        deliveryAddress: selectedLocation,
        instructions,
        deliveryFee,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // SUCCESS ACTION
      Alert.alert(
        "Order Placed! 🛵", 
        "LODS Bulan is now notified.", 
        [
          { 
            text: "View My Orders", 
            onPress: () => navigation.navigate("MyOrders") // 👈 Redirects to CustomerHomeScreen
          }
        ],
        { cancelable: false }
      );

    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center' }]}>
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
        <Text style={styles.title}>New Delivery Request</Text>

        <Text style={styles.label}>What do you need? (Items & Qty)</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TextInput
              style={[styles.input, { flex: 3 }]}
              placeholder="e.g. Fried Chicken"
              placeholderTextColor="#999"
              value={item.name}
              onChangeText={(val) => updateItem(index, "name", val)}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 10, textAlign: 'center' }]}
              placeholder="Qty"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={item.qty}
              onChangeText={(val) => updateItem(index, "qty", val)}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addMoreItem}>
          <Text style={styles.addBtnText}>+ Add Another Item</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.label}>Delivery Area in Bulan</Text>
        <TextInput
          style={styles.input}
          placeholder="Search Barangay or Sitio..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {filteredLocations.length > 0 && (
          <View style={styles.suggestionBox}>
            {filteredLocations.map((loc, index) => (
              <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectLocation(loc)}>
                <Text style={styles.suggestionText}>{loc.LOCATION}</Text>
                <Text style={styles.suggestionRate}>₱{loc["DELIVERY FEE"]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Delivery Fee:</Text>
          <Text style={styles.feeValue}>₱{deliveryFee}</Text>
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Specific Instructions (e.g. House color, landmarks)"
          placeholderTextColor="#999"
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />

        <TouchableOpacity 
          style={[styles.orderButton, loading && { opacity: 0.7 }]} 
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderButtonText}>Confirm Order</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary, marginVertical: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  itemRow: { flexDirection: 'row', marginBottom: 10 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16, color: '#000' },
  textArea: { height: 80, textAlignVertical: 'top', marginTop: 15 },
  addBtn: { padding: 12, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, marginTop: 5 },
  addBtnText: { color: COLORS.primary, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  suggestionBox: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginTop: 2 },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  suggestionText: { fontSize: 14 },
  suggestionRate: { fontWeight: 'bold', color: COLORS.primary },
  feeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8 },
  feeLabel: { fontSize: 16, color: '#666' },
  feeValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  orderButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 25, marginBottom: 20 },
  orderButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});