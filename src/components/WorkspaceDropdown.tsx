import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useWorkspaceStore } from '../store/WorkspaceStore';

export const WorkspaceDropdown = () => {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentWorkspace) return null;

  return (
    <View>
      <TouchableOpacity 
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.triggerText}>{currentWorkspace.name}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdown}>
            <FlatList
              data={workspaces}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    item.id === currentWorkspace.id && styles.activeItem
                  ]}
                  onPress={() => {
                    switchWorkspace(item.id);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.itemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  triggerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    width: '80%',
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  activeItem: {
    backgroundColor: '#f0f8ff',
  },
  itemText: {
    fontSize: 16,
  }
});
