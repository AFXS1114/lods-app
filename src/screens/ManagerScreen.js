import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function ManagerScreen() {
  const [stats, setStats] = useState({ activeOrders: 0, totalEarnings: 0, totalRiders: 0 });
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    // 1. Listen for ALL Active Orders (to show business pulse)
    const qOrders = query(collection(db, "orders"), where("status", "!=", "completed"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setStats(prev => ({ ...prev, activeOrders: snapshot.size }));
    });

    // 2. Listen for Completed Orders (to calculate total business revenue)
    const qEarnings = query(collection(db, "orders"), where("status", "==", "completed"));
    const unsubEarnings = onSnapshot(qEarnings, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => total += (doc.data().deliveryFee || 0));
      setStats(prev => ({ ...prev, totalEarnings: total }));
    });

    // 3. Listen for all registered Riders
    const qRiders = query(collection(db, "users"), where("role", "==", "rider"));
    const unsubRiders = onSnapshot(qRiders, (snapshot) => {
      const riderList = [];
      snapshot.forEach(doc => riderList.push({ id: doc.id, ...doc.data() }));
      setRiders(riderList);
      setStats(prev => ({ ...prev, totalRiders: riderList.length }));
    });

    return () => { unsubOrders(); unsubEarnings(); unsubRiders(); };
  }, []);

  return (
    <View style={globalStyles.container}>
      <Text style={styles.mainTitle}>Bulan Operations</Text>
      
      {/* 📊 STATS ROW */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.statValue}>₱{stats.totalEarnings}</Text>
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

      <Text style={styles.sectionTitle}>Active Riders</Text>
      <FlatList
        data={riders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.riderItem}>
            <View style={styles.riderAvatar}>
              <Text style={styles.avatarText}>{item.fullName?.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.riderName}>{item.fullName}</Text>
              <Text style={styles.riderEmail}>{item.email}</Text>
            </View>
            <View style={styles.statusDot} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: COLORS.text },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { flex: 1, marginHorizontal: 4, padding: 15, borderRadius: 12, alignItems: 'center', elevation: 3 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#fff', fontSize: 10, opacity: 0.9, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  riderItem: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 
  },
  riderAvatar: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  riderName: { fontSize: 16, fontWeight: '600' },
  riderEmail: { fontSize: 12, color: '#666' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', marginLeft: 'auto' }
});