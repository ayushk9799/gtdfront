import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import { fetchDepartmentProgress } from '../store/slices/progressSlice';
import { styles } from '../screens/styles';

export default function DepartmentProgressList({ userId, themeColors, onStartCase }) {
  const dispatch = useDispatch();
  const { status, items, error } = useSelector((s) => s.progress);

  useEffect(() => {
    if (userId) dispatch(fetchDepartmentProgress(userId));
  }, [dispatch, userId]);

  if (status === 'loading') {
    return (
      <View style={[styles.rowCenter, { marginTop: 8 }]}> 
        <ActivityIndicator color={Colors.brand.darkPink} />
        <Text style={[styles.cardDesc, { marginLeft: 8 }]}>Loading progress…</Text>
      </View>
    );
  }

  if (error) {
    return <Text style={[styles.cardDesc, { color: '#C62828', marginTop: 8 }]}>{error}</Text>;
  }

  return (
    <View style={{ marginTop: 8 }}>
      {items.map((dept) => {
        const title = (dept.name || '').charAt(0).toUpperCase() + (dept.name || '').slice(1);
        const firstCase = (Array.isArray(dept.unsolvedCases) ? dept.unsolvedCases : [])[0];
        const subtitle = firstCase?.chiefComplaint || 'No pending cases – great job!';
        const nextCaseId = firstCase?.caseId;
        const total = Number(dept.totalCount || 0);
        const done = Number(dept.completedCount || 0);
        const progress = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;

        return (
          <TouchableOpacity
            key={String(dept.categoryId)}
            activeOpacity={0.9}
            onPress={() => nextCaseId && onStartCase && onStartCase(nextCaseId)}
            disabled={!nextCaseId}
            style={{ opacity: nextCaseId ? 1 : 0.7 }}
          >
            <View
              style={[
                styles.card,
                { backgroundColor: themeColors.card, borderColor: themeColors.border, marginBottom: 12 },
              ]}
            >
            <View style={[styles.cardContent, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>{title}</Text>
                <Text style={[styles.cardDesc, { marginTop: 6 }]} numberOfLines={2}>
                  {subtitle}
                </Text>

                <View style={{ marginTop: 10 }}>
                  <View
                    style={{
                      height: 10,
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: 10,
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor: Colors.brand.darkPink,
                        borderRadius: 999,
                      }}
                    />
                  </View>
                  <View style={[styles.rowCenterBetween, { marginTop: 4 }]}>
                    <Text style={[styles.cardDesc, { color: themeColors.text }]}>{`${done}/${total}`}</Text>
                  </View>
                </View>
              </View>
            </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


