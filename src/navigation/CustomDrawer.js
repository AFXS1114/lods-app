import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { signOut } from "firebase/auth";
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from "../firebase/firebaseConfig";
import { COLORS, SPACING } from "../styles/theme";

export default function CustomDrawer(props) {
  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        {/* Top Branding Section */}
        <View style={styles.drawerHeader}>
          <Text style={styles.brandText}>LODS</Text>
          <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
        </View>

        {/* This renders the default menu links */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout Button at the very bottom */}
      <TouchableOpacity 
        style={styles.logoutSection} 
        onPress={() => signOut(auth)}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: SPACING.m,
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.s,
  },
  brandText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  userEmail: { color: '#fff', fontSize: 12, opacity: 0.8 },
  logoutSection: {
    padding: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f4',
    marginBottom: 20, // Pushes it away from the screen edge
  },
  logoutText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 16 }
});