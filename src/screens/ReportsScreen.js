import { collection, getDocs, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { db } from "../firebase/firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    riderPerformance: {}
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const q = query(collection(db, "orders"));
      const querySnapshot = await getDocs(q);
      
      let completed = 0;
      let revenue = 0;
      let performance = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Count Completed and Revenue
        if (data.status === "completed") {
          completed++;
          revenue += (data.deliveryFee || 0);
          
          // Track which rider did the work
          if (data.riderName) {
            performance[data.riderName] = (performance[data.riderName] || 0) + 1;
          }
        }
      });

      setReportData({
        totalOrders: querySnapshot.size,
        completedOrders: completed,
        totalRevenue: revenue,
        riderPerformance: performance
      });
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Performance Report</Text>

        {/* 📈 SUMMARY SECTION */}
        <View style={styles.reportCard}>
          <Text style={styles.cardHeader}>Overall Success</Text>
          <View style={styles.row}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{reportData.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {reportData.totalOrders > 0 
                  ? ((reportData.completedOrders / reportData.totalOrders) * 100).toFixed(0) 
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        {/* 💰 FINANCIAL SECTION */}
        <View style={[styles.reportCard, { backgroundColor: COLORS.primary }]}>
          <Text style={[styles.cardHeader, { color: '#fff' }]}>Total Gross Revenue</Text>
          <Text style={styles.revenueText}>₱{reportData.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.revenueSubtext}>Based on completed deliveries</Text>
        </View>

        {/* 🏆 RIDER RANKINGS */}
        <Text style={styles.sectionTitle}>Rider Leaderboard</Text>
        {Object.entries(reportData.riderPerformance).length > 0 ? (
          Object.entries(reportData.riderPerformance)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count], index) => (
              <View key={index} style={styles.leaderboardItem}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <Text style={styles.riderName}>{name}</Text>
                <Text style={styles.orderCount}>{count} Jobs</Text>
              </View>
            ))
        ) : (
          <Text style={styles.emptyText}>No rider data available yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: COLORS.text },
  reportCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 15, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 12, color: '#888', marginTop: 5 },
  divider: { width: 1, height: 40, backgroundColor: '#eee' },
  revenueText: { fontSize: 42, fontWeight: '900', color: '#fff', textAlign: 'center', marginVertical: 10 },
  revenueSubtext: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, marginTop: 10 },
  leaderboardItem: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  rank: { fontSize: 16, fontWeight: '900', color: COLORS.primary, width: 40 },
  riderName: { flex: 1, fontSize: 16, fontWeight: '600' },
  orderCount: { fontWeight: 'bold', color: '#666' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});