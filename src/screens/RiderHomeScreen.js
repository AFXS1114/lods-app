import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
// Added Linking to imports
import { Alert, FlatList, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function RiderHomeScreen() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myActiveOrder, setMyActiveOrder] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const qAvailable = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() }));
      setAvailableOrders(orders);
    });

    const qActive = query(
      collection(db, "orders"),
      where("riderId", "==", auth.currentUser.uid),
      where("status", "in", ["accepted", "shopping", "delivery"])
    );
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setMyActiveOrder({ id: doc.id, ...doc.data() });
      } else {
        setMyActiveOrder(null);
      }
    });

    const qCompleted = query(
      collection(db, "orders"),
      where("riderId", "==", auth.currentUser.uid),
      where("status", "==", "completed")
    );
    const unsubEarnings = onSnapshot(qCompleted, (snapshot) => {
      let earnings = 0;
      snapshot.forEach((doc) => {
        earnings += (doc.data().deliveryFee || 0);
      });
      setTotalEarnings(earnings);
    });

    return () => {
      unsubAvailable();
      unsubActive();
      unsubEarnings();
    };
  }, []);

  // --- NEW: CALL FUNCTION ---
  const makeCall = () => {
    const phoneNumber = myActiveOrder?.customerPhone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("No Number", "Customer phone number not found in this order.");
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "accepted",
        riderId: auth.currentUser.uid,
        riderName: auth.currentUser.displayName || "LODS Rider",
      });
      Alert.alert("Success", "Order accepted!");
    } catch (error) {
      Alert.alert("Error", "Could not accept order.");
    }
  };

  const handlePriceUpdate = (index, price) => {
    const updatedItems = [...myActiveOrder.items];
    const unitPrice = parseFloat(price) || 0;
    updatedItems[index].unitPrice = unitPrice;
    updatedItems[index].subtotal = unitPrice * (updatedItems[index].qty || 1);
    setMyActiveOrder({ ...myActiveOrder, items: updatedItems });
  };

  const updateStatus = async (newStatus) => {
    try {
      const orderRef = doc(db, "orders", myActiveOrder.id);
      let updateData = { status: newStatus };

      if (newStatus === 'delivery') {
        const itemsTotal = myActiveOrder.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        updateData.items = myActiveOrder.items;
        updateData.totalItemsBill = itemsTotal;
        updateData.finalTotal = itemsTotal + (myActiveOrder.deliveryFee || 0);
      }

      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const renderActiveOrder = () => {
    const itemsTotal = myActiveOrder.items?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
    const runningTotal = itemsTotal + (myActiveOrder.deliveryFee || 0);

    return (
      <ScrollView style={styles.activeOrderContainer}>
        <Text style={styles.activeTitle}>🏃 Current Job</Text>
        <View style={[globalStyles.card, styles.activeCard]}>
          
          {/* --- UPDATED: CUSTOMER HEADER WITH CALL BUTTON --- */}
          <View style={styles.customerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{myActiveOrder.customerName || "User"}</Text>
              <Text style={styles.deliveryLoc}>📍 {myActiveOrder.deliveryAddress}</Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={makeCall}>
              <Text style={styles.callButtonText}>📞 Call</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.currentStatus}>Status: {myActiveOrder.status.toUpperCase()}</Text>

          {myActiveOrder.status === 'shopping' && (
            <View style={styles.shoppingSection}>
              <Text style={styles.sectionHeader}>Enter Item Prices:</Text>
              {myActiveOrder.items?.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name} (x{item.qty})</Text>
                  <View style={styles.priceInputWrapper}>
                    <Text>₱</Text>
                    <TextInput
                      style={styles.priceInput}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#999"
                      value={item.unitPrice ? item.unitPrice.toString() : ""}
                      onChangeText={(val) => handlePriceUpdate(index, val)}
                    />
                  </View>
                </View>
              ))}
              <View style={styles.summaryBox}>
                <Text>Items: ₱{itemsTotal.toFixed(2)}</Text>
                <Text>Fee: ₱{myActiveOrder.deliveryFee?.toFixed(2)}</Text>
                <Text style={styles.totalText}>Total: ₱{runningTotal.toFixed(2)}</Text>
              </View>
            </View>
          )}

          <View style={styles.actionButtons}>
            {myActiveOrder.status === 'accepted' && (
              <TouchableOpacity style={[styles.statusBtn, {backgroundColor: '#7B1FA2'}]} onPress={() => updateStatus('shopping')}>
                <Text style={styles.btnText}>Start Shopping</Text>
              </TouchableOpacity>
            )}

            {myActiveOrder.status === 'shopping' && (
              <TouchableOpacity style={[styles.statusBtn, {backgroundColor: '#2E7D32'}]} onPress={() => updateStatus('delivery')}>
                <Text style={styles.btnText}>Confirm Prices & Deliver</Text>
              </TouchableOpacity>
            )}

            {myActiveOrder.status === 'delivery' && (
              <TouchableOpacity 
                style={[styles.statusBtn, {backgroundColor: COLORS.primary}]} 
                onPress={() => {
                  Alert.alert("Collect Payment", `Collect ₱${myActiveOrder.finalTotal?.toFixed(2)}`, [
                    { text: "Cancel" },
                    { text: "Paid & Delivered", onPress: () => updateStatus('completed') }
                  ]);
                }}
              >
                <Text style={styles.btnText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={globalStyles.container}>
      <Text style={styles.header}>Rider Dashboard</Text>
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total LODS Earnings</Text>
        <Text style={styles.earningsAmount}>₱{totalEarnings.toFixed(2)}</Text>
      </View>

      {myActiveOrder ? renderActiveOrder() : (
        <FlatList
          data={availableOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={globalStyles.card}>
              <Text style={styles.itemSummary}>🛍️ {item.items?.length || 0} Items</Text>
              <Text>To: {item.deliveryAddress}</Text>
              <Text>Fee: ₱{item.deliveryFee}</Text>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOrder(item.id)}>
                <Text style={styles.btnText}>Accept Order</Text>
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Available Orders in Bulan</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending orders right now.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  earningsCard: { backgroundColor: '#FFF9C4', padding: 15, borderRadius: 10, marginVertical: 15 },
  earningsLabel: { fontSize: 12, color: '#555' },
  earningsAmount: { fontSize: 22, fontWeight: 'bold', color: '#FBC02D' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  activeOrderContainer: { flex: 1 },
  activeTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  activeCard: { borderLeftWidth: 5, borderLeftColor: COLORS.primary, padding: 15 },
  
  // --- NEW STYLES ---
  customerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10 
  },
  callButton: { 
    backgroundColor: '#2E7D32', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 20 
  },
  callButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  customerName: { fontSize: 18, fontWeight: 'bold' },
  deliveryLoc: { fontSize: 14, color: '#666', marginVertical: 5 },
  currentStatus: { fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  shoppingSection: { marginTop: 10, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  sectionHeader: { fontWeight: 'bold', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { flex: 1, fontSize: 14 },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc' },
  priceInput: { width: 60, padding: 5, color: '#000' },
  summaryBox: { marginTop: 15, borderTopWidth: 1, borderColor: '#ddd', paddingTop: 10 },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginTop: 5 },
  actionButtons: { marginTop: 20, flexDirection: 'row' },
  statusBtn: { padding: 15, borderRadius: 8, flex: 1, alignItems: 'center' },
  acceptBtn: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  itemSummary: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});