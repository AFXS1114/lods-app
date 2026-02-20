import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { auth, db } from "./src/firebase/firebaseConfig"; // Ensure these paths match your folder structure
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  /**
   * 🛡️ AUTHENTICATION & ROLE MONITOR
   * This effect runs once when the app starts.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        // 1. User is logged in, now we fetch their 'role' from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", authenticatedUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role); // Sets "customer", "rider", or "manager"
          } else {
            console.log("No such user document!");
            setRole("customer"); // Fallback safety
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("customer");
        }
        setUser(authenticatedUser);
      } else {
        // 2. No user is logged in
        setUser(null);
        setRole(null);
      }

      // 3. Stop showing the loading splash screen
      if (initializing) setInitializing(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  /**
   * ⌛ LOADING STATE
   * Shows a spinner while checking Firebase for a session.
   */
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF3D00" />
      </View>
    );
  }

  /**
   * 🚀 THE RENDER
   * We pass 'user' and 'role' down to the AppNavigator.
   * The Navigator will use these to show the correct Stack.
   */
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator user={user} role={role} />
    </>
  );
}