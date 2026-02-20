import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function CustomerHomeScreen({ navigation }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() }));
      setActiveOrders(orders);
      
      // Update the modal in real-time if it's open
      if (selectedOrder) {
        const updated = orders.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    });

    return () => unsubscribe();
  }, [selectedOrder]);

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // Helper to determine status badge color
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { bg: '#FFF3E0', text: '#E65100' }; // Orange
      case 'accepted': return { bg: '#E3F2FD', text: COLORS.primary }; // Blue
      case 'shopping': return { bg: '#F3E5F5', text: '#7B1FA2' }; // Purple
      case 'delivery': return { bg: '#E8F5E9', text: '#2E7D32' }; // Green
      default: return { bg: '#EEEEEE', text: '#757575' };
    }
  };

  const renderOrderItem = ({ item }) => {
    const itemNames = item.itemsList?.map(i => i.name) || [];
    const summary = itemNames.slice(0, 3).join(", ");
    const finalDisplay = itemNames.length > 3 ? `${summary}...` : summary;
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity 
        style={globalStyles.card} 
        onPress={() => handleOrderPress(item)}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.serviceType}>
            {item.serviceType === "BuyMe" ? "🛍️ Buy Me" : "📦 Pick Up"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.itemSummaryText}>{finalDisplay || "No items listed"}</Text>
        <Text style={styles.locationText}>📍 {item.deliveryLocation}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.totalText}>Total: ₱{item.totalDue?.toFixed(2)}</Text>
          {item.status !== 'pending' && (
            <Text style={styles.riderNameSmall}>Rider: {item.riderName || 'Assigned'}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const OrderTimeline = ({ status }) => {
    const steps = [
      { id: 'pending', label: 'Order Placed', desc: 'Waiting for a rider' },
      { id: 'accepted', label: 'Rider Found', desc: 'Heading to the store' },
      { id: 'shopping', label: 'Shopping', desc: 'Rider is picking up items' },
      { id: 'delivery', label: 'In Transit', desc: 'Rider is on the way to you' },
      { id: 'completed', label: 'Delivered', desc: 'Enjoy your items!' },
    ];

    const currentIdx = steps.findIndex(s => s.id === status);

    return (
      <View style={styles.timelineContainer}>
        {steps.map((step, index) => {
          const isPast = currentIdx >= index;
          const isCurrent = step.id === status;

          return (
            <View key={step.id} style={styles.timelineItem}>
              <View style={styles.lineColumn}>
                <View style={[styles.dot, isPast && styles.activeDot]} />
                {index !== steps.length - 1 && (
                  <View style={[styles.line, isPast && steps.findIndex(s => s.id === status) > index && styles.activeLine]} />
                )}
              </View>
              <View style={styles.textColumn}>
                <Text style={[styles.stepLabel, isPast && styles.activeText]}>{step.label}</Text>
                {isCurrent && <Text style={styles.stepDesc}>{step.desc}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <Text style={styles.welcomeText}>LODS Services</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.serviceButton} 
          onPress={() => navigation.navigate("CreateOrder", { type: "BuyMe" })}
        >
          <Text style={styles.buttonEmoji}>🛍️</Text>
          <Text style={styles.buttonLabel}>Buy Me</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.serviceButton} 
          onPress={() => navigation.navigate("CreateOrder", { type: "PickUp" })}
        >
          <Text style={styles.buttonEmoji}>📦</Text>
          <Text style={styles.buttonLabel}>Pick Up</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Active Orders</Text>
      
      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem} 
        ListEmptyComponent={<Text style={styles.emptyText}>You have no current orders.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Order Receipt</Text>
            
            {selectedOrder && (
              <ScrollView style={styles.receiptScroll} showsVerticalScrollIndicator={false}>
                
                <OrderTimeline status={selectedOrder.status} />
                
                <View style={styles.divider} />
                
                <Text style={styles.receiptHeader}>Items Breakdown:</Text>
                {selectedOrder.itemsList?.map((item, index) => (
                  <View key={index} style={styles.receiptRow}>
                    <Text style={styles.receiptItemName}>{item.qty}x {item.name}</Text>
                    <Text style={styles.receiptItemPrice}>
                      ₱{((item.unitPrice || 0) * (item.qty || 1)).toFixed(2)}
                    </Text>
                  </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text>Items Subtotal:</Text>
                  <Text>₱{selectedOrder.itemPrice?.toFixed(2)}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text>Delivery Fee:</Text>
                  <Text>₱{selectedOrder.deliveryFee?.toFixed(2)}</Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Grand Total:</Text>
                  <Text style={styles.totalValue}>₱{selectedOrder.totalDue?.toFixed(2)}</Text>
                </View>

                {/* FIXED RIDER LOGIC: If status isn't pending, show rider info */}
                {selectedOrder.status !== 'pending' && (
                  <View style={styles.riderInfoBox}>
                    <Text style={styles.riderTitle}>Assigned Rider</Text>
                    <Text style={styles.riderNameMain}>{selectedOrder.riderName || "LODS Rider"}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity 
              style={[globalStyles.primaryButton, { marginTop: 10 }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={globalStyles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeText: { fontSize: 22, fontWeight: 'bold', marginVertical: 20, color: COLORS.text },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  serviceButton: { 
    backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 15, alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
  },
  buttonEmoji: { fontSize: 40, marginBottom: 5 },
  buttonLabel: { fontWeight: 'bold', color: COLORS.primary },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  serviceType: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  itemSummaryText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  locationText: { fontSize: 13, color: '#666', marginVertical: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 5 },
  totalText: { fontWeight: 'bold', fontSize: 15 },
  riderNameSmall: { fontSize: 12, color: COLORS.primary, fontStyle: 'italic' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  receiptScroll: { marginBottom: 15 },
  receiptHeader: { fontWeight: 'bold', marginBottom: 10, color: '#555' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptItemName: { fontSize: 16, color: '#333' },
  receiptItemPrice: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#eee' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  riderInfoBox: { marginTop: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 12 },
  riderTitle: { fontSize: 11, color: '#666', textTransform: 'uppercase' },
  riderNameMain: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  timelineContainer: { marginVertical: 10, paddingHorizontal: 5 },
  timelineItem: { flexDirection: 'row', minHeight: 45 },
  lineColumn: { alignItems: 'center', marginRight: 15 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd' },
  activeDot: { backgroundColor: COLORS.primary },
  line: { width: 2, flex: 1, backgroundColor: '#ddd' },
  activeLine: { backgroundColor: COLORS.primary },
  textColumn: { paddingBottom: 10 },
  stepLabel: { fontSize: 13, color: '#999', fontWeight: '600' },
  activeText: { color: '#333', fontWeight: 'bold' },
  stepDesc: { fontSize: 11, color: COLORS.primary, marginTop: 1 },
});