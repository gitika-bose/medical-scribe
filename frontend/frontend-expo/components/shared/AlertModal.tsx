import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

interface AlertModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A reusable alert / confirmation modal that mirrors the AlertDialog
 * pattern used in the web app.
 */
export function AlertModal({
  visible,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: AlertModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.container} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelText: {
    fontSize: 15,
    color: '#555',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  confirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
