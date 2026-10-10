import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguageStore, Language } from '../../store/languageStore';

interface LanguageSwitchModalProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGE_OPTIONS: { code: Language; label: string; sublabel: string; badge: string }[] = [
  { code: 'en', label: 'English', sublabel: 'Standard English', badge: 'EN' },
  { code: 'hi', label: 'हिंदी', sublabel: 'शुद्ध हिंदी', badge: 'HI' },
  { code: 'hinglish', label: 'Hinglish', sublabel: 'दुकान की भाषा', badge: 'HGL' },
];

export const LanguageSwitchModal: React.FC<LanguageSwitchModalProps> = ({ visible, onClose }) => {
  const { language, setLanguage } = useLanguageStore();

  const handleSelect = (code: Language) => {
    setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Feather name="globe" size={20} color="#7367F0" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Choose Language / भाषा चुनें</Text>
          </View>
          <Text style={styles.subtitle}>All text updates instantly across the app</Text>

          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <TouchableOpacity
                key={opt.code}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(opt.code)}
                activeOpacity={0.75}
              >
                <View style={[styles.langBadge, isSelected && styles.langBadgeSelected]}>
                  <Text style={[styles.langBadgeText, isSelected && styles.langBadgeTextSelected]}>
                    {opt.badge}
                  </Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
                </View>
                {isSelected && <Feather name="check" size={18} color="#7367F0" />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeBtnText}>Close / बंद करें</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

// ─── Quick Language Toggle Pill (inline header button) ─────────────────────
export const LanguageTogglePill: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { language } = useLanguageStore();

  const label = language === 'en' ? 'EN' : language === 'hi' ? 'हिंदी' : 'HGL';

  return (
    <>
      <TouchableOpacity
        style={styles.pill}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Feather name="globe" size={12} color="#7367F0" style={{ marginRight: 4 }} />
        <Text style={styles.pillText}>{label}</Text>
      </TouchableOpacity>
      <LanguageSwitchModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(47, 43, 61, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DBDADE',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4B465C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#82808B',
    textAlign: 'center',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F8F7FA',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  optionSelected: {
    borderColor: '#7367F0',
    backgroundColor: '#EDEBFD',
  },
  langBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBDADE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  langBadgeSelected: {
    backgroundColor: '#7367F0',
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B465C',
  },
  langBadgeTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B465C',
  },
  optionLabelSelected: {
    color: '#7367F0',
  },
  optionSublabel: {
    fontSize: 12,
    color: '#82808B',
    marginTop: 2,
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8F7FA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D596C',
  },
  // Pill
  pill: {
    backgroundColor: '#EDEBFD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.2)',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7367F0',
  },
});

