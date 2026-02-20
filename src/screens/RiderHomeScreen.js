import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function RiderHomeScreen() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myActiveOrder, setMyActiveOrder] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    // 1. Listen for AVAILABLE orders (Pending)
    const qAvailable = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() }));
      setAvailableOrders(orders);
    });

    // 2. Listen for THIS RIDER's active order (Accepted, Shopping, or Delivery)
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
        earnings += (doc.data().deliveryFee || 0); // Add up all fees
      });
      setTotalEarnings(earnings); // Update the state
    });

    return () => {
      unsubAvailable();
      unsubActive();
      unsubEarnings(); // DON'T FORGET THIS: It turns off the guard when you leave the screen
    };
  }, []);

  const handleAcceptOrder = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "accepted",
        riderId: auth.currentUser.uid,
        riderName: auth.currentUser.displayName || "LODS Rider",
      });
      Alert.alert("Success", "Order accepted! Go to the store now.");
    } catch (error) {
      Alert.alert("Error", "Could not accept order.");
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, "orders", myActiveOrder.id), {
        status: newStatus
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderActiveOrder = () => (
    <View style={styles.activeOrderContainer}>
      <Text style={styles.activeTitle}>🏃 Current Job</Text>
      <View style={[globalStyles.card, styles.activeCard]}>
        <Text style={styles.customerName}>Customer: {myActiveOrder.customerName || "User"}</Text>
        <Text style={styles.deliveryLoc}>📍 {myActiveOrder.deliveryLocation}</Text>
        <Text style={styles.currentStatus}>Status: {myActiveOrder.status.toUpperCase()}</Text>

        <View style={styles.actionButtons}>
          {myActiveOrder.status === 'accepted' && (
            <TouchableOpacity 
              style={[styles.statusBtn, {backgroundColor: '#7B1FA2'}]} 
              onPress={() => updateStatus('shopping')}
            >
              <Text style={styles.btnText}>Start Shopping</Text>
            </TouchableOpacity>
          )}

          {myActiveOrder.status === 'shopping' && (
            <TouchableOpacity 
              style={[styles.statusBtn, {backgroundColor: '#2E7D32'}]} 
              onPress={() => updateStatus('delivery')}
            >
              <Text style={styles.btnText}>Start Delivery</Text>
            </TouchableOpacity>
          )}

          {myActiveOrder.status === 'delivery' && (
            <TouchableOpacity 
              style={[styles.statusBtn, {backgroundColor: COLORS.primary}]} 
              onPress={() => {
                Alert.alert("Complete Delivery", "Did you receive the payment?", [
                  { text: "No" },
                  { text: "Yes, Delivered", onPress: () => updateStatus('completed') }
                ]);
              }}
            >
              <Text style={styles.btnText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      <Text style={styles.header}>Rider Dashboard</Text>

        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>Total LODS Earnings</Text>
            <Text style={styles.earningsAmount}>₱{totalEarnings.toFixed(2)}</Text>
          </View>
        </View>
      {/* SHOW ACTIVE JOB IF EXISTS */}
      {myActiveOrder ? (
        renderActiveOrder()
      ) : (
        <>
          <Text style={styles.sectionTitle}>Available Orders in Bulan</Text>
          <FlatList
            data={availableOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={globalStyles.card}>
                <Text style={styles.itemSummary}>🛍️ {item.itemsList?.length} Items</Text>
                <Text>To: {item.deliveryLocation}</Text>
                <TouchableOpacity 
                  style={styles.acceptBtn} 
                  onPress={() => handleAcceptOrder(item.id)}
                >
                  <Text style={styles.btnText}>Accept Order</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No pending orders right now.</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: 'bold', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  activeOrderContainer: { marginBottom: 30 },
  activeTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  activeCard: { borderLeftWidth: 5, borderLeftColor: COLORS.primary },
  customerName: { fontSize: 18, fontWeight: 'bold' },
  deliveryLoc: { fontSize: 14, color: '#666', marginVertical: 5 },
  currentStatus: { fontWeight: 'bold', color: COLORS.primary, marginTop: 5 },
  actionButtons: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between' },
  statusBtn: { padding: 12, borderRadius: 8, flex: 1, alignItems: 'center', marginHorizontal: 2 },
  acceptBtn: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  itemSummary: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});