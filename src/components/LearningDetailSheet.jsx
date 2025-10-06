import React from 'react';
import { Text, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

export default function LearningDetailSheet({ themeColors, snapPoints = ['45%', '90%'] }, ref) {
  const bottomSheetModalRef = React.useRef(null);

  React.useImperativeHandle(ref, () => ({
    present: (payload) => {
      setSelectedItem(payload || null);
      bottomSheetModalRef.current?.present();
    },
    dismiss: () => bottomSheetModalRef.current?.dismiss(),
  }));

  const [selectedItem, setSelectedItem] = React.useState(null);

  const renderBackdrop = React.useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.35}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      onDismiss={() => setSelectedItem(null)}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: themeColors.card }}
      handleIndicatorStyle={{ backgroundColor: '#C8D1DA' }}
    >
      <BottomSheetView style={{ padding: 16 }}>
        {!!selectedItem && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 8, color: themeColors.text }}>
              {selectedItem.title}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: '#3F5161', opacity: 0.95 }}>
              {selectedItem.summary}
            </Text>
          </>
        )}
        <Pressable onPress={() => bottomSheetModalRef.current?.dismiss()} style={{ alignSelf: 'flex-end', marginTop: 16, backgroundColor: Colors.brand.darkPink, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Close</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export const LearningDetailSheetForwarded = React.forwardRef(LearningDetailSheet);


