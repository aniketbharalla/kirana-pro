import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useLanguageStore, Language } from '../../store/languageStore';
import { colors } from '../../theme';

interface LanguageSwitchModalProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGE_OPTIONS: { code: Language; label: string; sublabel: string; flag: string }[] = [
  { code: 'en', label: 'English', sublabel: 'Standard English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', sublabel: 'शुद्ध हिंदी', flag: '🇮🇳' },
  { code: 'hinglish', label: 'Hinglish', sublabel: 'दुकान की भाषा', flag: '🏪' },
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
          <Text style={styles.title}>🌐 Choose Language / भाषा चुनें</Text>
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
                <Text style={styles.flag}>{opt.flag}</Text>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
                </View>
                {isSelected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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

  const label = language === 'en' ? '🌐 EN' : language === 'hi' ? '🌐 हिंदी' : '🌐 HGL';

  return (
    <>
      <TouchableOpacity
        style={styles.pill}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.pillText}>{label}</Text>
      </TouchableOpacity>
      <LanguageSwitchModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}12`,
  },
  flag: {
    fontSize: 28,
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionSublabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  check: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '900',
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  // Pill
  pill: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
