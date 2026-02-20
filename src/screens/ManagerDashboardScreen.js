import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";
import { db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function ManagerDashboardScreen() {
  const [stats, setStats] = useState({ activeOrders: 0, totalEarnings: 0, totalRiders: 0 });
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    // 1. Monitor ALL Active Orders (Pending, Accepted, Picked Up)
    const qOrders = query(collection(db, "orders"), where("status", "!=", "completed"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setStats(prev => ({ ...prev, activeOrders: snapshot.size }));
    });

    // 2. Calculate Total Business Revenue from Completed Jobs
    const qEarnings = query(collection(db, "orders"), where("status", "==", "completed"));
    const unsubEarnings = onSnapshot(qEarnings, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        const fee = doc.data().deliveryFee || 0;
        total += fee;
      });
      setStats(prev => ({ ...prev, totalEarnings: total }));
    });

    // 3. Monitor Rider Registry
    const qRiders = query(collection(db, "users"), where("role", "==", "rider"));
    const unsubRiders = onSnapshot(qRiders, (snapshot) => {
      const riderList = [];
      snapshot.forEach(doc => riderList.push({ id: doc.id, ...doc.data() }));
      setRiders(riderList);
      setStats(prev => ({ ...prev, totalRiders: riderList.length }));
    });

    return () => {
      unsubOrders();
      unsubEarnings();
      unsubRiders();
    };
  }, []);

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: '#f8f9fa' }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Bulan Operations</Text>
        <Text style={styles.subtitle}>Real-time Business Overview</Text>
      </View>
      
      {/* 📊 STATS ROW */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.statValue}>₱{stats.totalEarnings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.statValue}>{stats.activeOrders}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
          <Text style={styles.statValue}>{stats.totalRiders}</Text>
          <Text style={styles.statLabel}>Riders</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Registered Riders</Text>
        <FlatList
          data={riders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.riderItem}>
              <View style={styles.riderAvatar}>
                <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{item.fullName}</Text>
                <Text style={styles.riderEmail}>{item.email}</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No riders registered yet.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20, paddingHorizontal: 5 },
  mainTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { 
    flex: 1, 
    marginHorizontal: 4, 
    paddingVertical: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#fff', fontSize: 10, opacity: 0.9, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  listContainer: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: COLORS.text, paddingHorizontal: 5 },
  riderItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  riderAvatar: { 
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.primary, 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  riderEmail: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 5 },
  statusText: { fontSize: 10, color: '#4CAF50', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 }
});