import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuthStore } from '../../lib/store/auth.store';
import { authApi } from '../../lib/api/auth.api';

export default function SettingsScreen() {
  const router = useRouter();
  const { designer, signOut, updateDesigner } = useAuthStore();

  const [businessName, setBusinessName] = useState(designer?.businessName || 'Bhagyashri Tailoring');
  const [phone, setPhone] = useState(designer?.phone || '');
  const [address, setAddress] = useState(designer?.address || '');
  const [messageSignature, setMessageSignature] = useState(
    designer?.messageSignature || designer?.businessName || 'Bhagyashri',
  );

  // WhatsApp Cloud API Settings
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState(
    designer?.whatsappPhoneNumberId || '',
  );
  const [whatsappAccessToken, setWhatsappAccessToken] = useState(
    designer?.whatsappAccessToken || '',
  );
  const [whatsappSandboxMode, setWhatsappSandboxMode] = useState<boolean>(
    designer?.whatsappSandboxMode ?? true,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        businessName: businessName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        messageSignature: messageSignature.trim() || undefined,
        whatsappPhoneNumberId: whatsappPhoneNumberId.trim() || undefined,
        whatsappAccessToken: whatsappAccessToken.trim() || undefined,
        whatsappSandboxMode,
      });

      updateDesigner(updated);
      Alert.alert('Saved', 'Boutique settings updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLogoutConfirmOpen(false);
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Boutique Settings</Text>
        </View>

        {/* Section 1: Business Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Business Profile</Text>
          </View>

          <Input
            label="Boutique / Business Name *"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Input
            label="Designer Name"
            value={designer?.name || ''}
            editable={false}
            hint="Account owner name"
          />

          <Input
            label="Registered Email"
            value={designer?.email || ''}
            editable={false}
          />

          <Input
            label="Contact Phone Number"
            placeholder="e.g. +91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Input
            label="Shop / Studio Address"
            placeholder="e.g. Shop #4, Gold Crest Plaza, MG Road"
            multiline
            numberOfLines={2}
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.currencyRow}>
            <Text style={styles.currencyLabel}>Base Currency</Text>
            <View style={styles.currencyPill}>
              <Text style={styles.currencyValue}>INR (₹ Indian Rupee)</Text>
            </View>
          </View>
        </View>

        {/* Section 2: WhatsApp Cloud API Integration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.cardTitle}>WhatsApp Business Platform</Text>
          </View>

          {/* Sandbox Mode Switch */}
          <View style={styles.sandboxBox}>
            <View style={styles.sandboxInfo}>
              <Text style={styles.sandboxTitle}>Sandbox Mode (Local / Demo)</Text>
              <Text style={styles.sandboxDesc}>
                When ON, notifications are recorded and logged safely in your database without sending real Meta API requests.
              </Text>
            </View>
            <Switch
              value={whatsappSandboxMode}
              onValueChange={setWhatsappSandboxMode}
              trackColor={{ false: Colors.border, true: Colors.gold }}
              thumbColor={Colors.white}
            />
          </View>

          {!whatsappSandboxMode && (
            <View style={styles.liveMetaFields}>
              <Input
                label="WhatsApp Phone Number ID"
                placeholder="From Meta Developer App Dashboard"
                value={whatsappPhoneNumberId}
                onChangeText={setWhatsappPhoneNumberId}
              />

              <Input
                label="Permanent System User Access Token"
                placeholder="EAAB..."
                secureTextEntry
                value={whatsappAccessToken}
                onChangeText={setWhatsappAccessToken}
                hint="Never shared with mobile client; stored securely on backend"
              />
            </View>
          )}

          <Input
            label="Message Signature"
            placeholder="e.g. — Bhagyashri Creation"
            value={messageSignature}
            onChangeText={setMessageSignature}
            hint="Appended to all order receipts and delivery summaries"
          />
        </View>

        {/* Save Settings Button */}
        <Button
          label="Save Settings"
          variant="primary"
          onPress={handleSaveProfile}
          loading={isSaving}
          style={styles.saveBtn}
        />

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>StitchFlow Mobile v1.0.0</Text>
          <Text style={styles.versionSubtext}>Crafted for boutique fashion designers & tailors</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setIsLogoutConfirmOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out from Boutique</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={isLogoutConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to sign out of StitchFlow on this device?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 30,
  },
  header: {
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  title: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    marginTop: Spacing.xs,
  },
  currencyLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  currencyPill: {
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyValue: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.text,
  },
  sandboxBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDF8ED',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE2C6',
    marginBottom: Spacing.md,
  },
  sandboxInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  sandboxTitle: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
  sandboxDesc: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  liveMetaFields: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  saveBtn: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  versionText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  versionSubtext: {
    ...Typography.caption2,
    color: Colors.placeholder,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FFF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: Spacing.xl,
  },
  logoutText: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.error,
  },
});
