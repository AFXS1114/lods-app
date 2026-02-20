import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function OrderMasterScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Listen to ALL orders, sorted by newest first
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = [];
      snapshot.forEach((doc) => {
        allOrders.push({ id: doc.id, ...doc.data() });
      });
      setOrders(allOrders);
    });

    return () => unsubscribe();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return { color: '#4CAF50', bg: '#E8F5E9' };
      case 'pending': return { color: '#FF9800', bg: '#FFF3E0' };
      case 'accepted': return { color: '#2196F3', bg: '#E3F2FD' };
      default: return { color: '#757575', bg: '#F5F5F5' };
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={styles.headerTitle}>Order Master List</Text>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusStyle = getStatusStyle(item.status);
          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>ID: ...{item.id.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.customerName}>👤 {item.customerName || "Anonymous"}</Text>
              <Text style={styles.details}>📦 {item.items || "General Items"}</Text>
              
              <View style={styles.footer}>
                <Text style={styles.rider}>🏍️ Rider: {item.riderName || "Not Assigned"}</Text>
                <Text style={styles.price}>₱{item.deliveryFee || 0}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No orders found in the database.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, color: COLORS.text },
  orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 12, color: '#999', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  customerName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  details: { fontSize: 14, color: '#666', marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  rider: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});