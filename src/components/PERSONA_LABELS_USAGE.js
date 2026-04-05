// EXAMPLE USAGE: How to integrate persona labels into existing Stats.js screen

/*
================================================================================
INTEGRATION GUIDE: Identity-Mapped Labels in Stats Dashboard
================================================================================

STEP 1: Import the hook
------------------------
import { usePersonaLabels } from '../hooks/usePersonaLabels';

STEP 2: Use the hook in your component
---------------------------------------
export default function Stats({ navigation }) {
  const labels = usePersonaLabels();
  // labels = { metric1: '...', metric2: '...', metric3: '...' }
  // Automatically adapts based on userProfile.userPersona
  
STEP 3: Replace hardcoded labels with persona labels
-----------------------------------------------------
Before:
  <Text>Focus Time</Text>

After:
  <Text>{labels.metric1}</Text>  // "Study Hours Protected" for students
                                  // "Deep Work Achieved" for professionals
                                  // "Mindful Hours" for minimalists

EXAMPLE: Adding to existing Stats screen
-----------------------------------------
*/

// In src/screens/Stats.js (existing file):
import { usePersonaLabels } from '../hooks/usePersonaLabels';

export default function Stats({ navigation, route }) {
  const { colors } = useTheme();
  const { calmPoints, urges, streak } = useContext(AppContext);
  const labels = usePersonaLabels(); // ← ADD THIS
  
  return (
    <SafeAreaView>
      <View style={styles.metricsRow}>
        {/* Metric 1 */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{labels.metric1}</Text>
          <Text style={styles.metricValue}>4.2h</Text>
        </View>
        
        {/* Metric 2 */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{labels.metric2}</Text>
          <Text style={styles.metricValue}>87%</Text>
        </View>
        
        {/* Metric 3 */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{labels.metric3}</Text>
          <Text style={styles.metricValue}>23</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

/*
================================================================================
TESTING PERSONA CHANGES
================================================================================

Test by changing persona in PersonaSelectionScreen:
1. Student → Labels: "Study Hours Protected", "Exam Readiness", "Distractions Blocked"
2. Professional → Labels: "Deep Work Achieved", "Focus ROI", "Productivity Intact"
3. Minimalist → Labels: "Mindful Hours", "Scroll Urges Defeated", "Digital Clutter Blocked"

Labels update automatically when userProfile.userPersona changes.
No AsyncStorage, no manual cache clearing needed.

================================================================================
FILES CREATED
================================================================================
✅ src/constants/personaDictionary.ts    - Label mappings + type definitions
✅ src/hooks/usePersonaLabels.ts         - React hook to access labels
✅ src/components/DashboardStats.tsx     - Demo component with 3 metric cards

================================================================================
*/
