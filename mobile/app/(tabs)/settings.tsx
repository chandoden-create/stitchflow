import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { useAuthStore } from '../../lib/store/auth.context';
import { authApi } from '../../lib/api/auth.api';
import { whatsappApi } from '../../lib/api/whatsapp.api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { storage } from '../../lib/utils/storage';
import { DEFAULT_API_URL } from '../../lib/api/client';
import { localDb } from '../../lib/store/local-db';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { designer, updateDesigner, signOut, syncWithCloud, cloudSynced } = useAuthStore();
  const [syncingCloud, setSyncingCloud] = useState(false);

  const [designerName, setDesignerName] = useState(
    designer?.name || designer?.designerName || 'Bhagyashri'
  );
  const [email, setEmail] = useState(designer?.email || 'admin@stitchflow.app');
  const [businessName, setBusinessName] = useState(
    designer?.businessName || 'Bhagyashri Tailoring'
  );
  const [phone, setPhone] = useState(designer?.phone || '+919876543210');
  const [address, setAddress] = useState(
    designer?.address || 'Shop 4, Royal Arcade, MG Road, Pune'
  );
  const [messageSignature, setMessageSignature] = useState(
    designer?.messageSignature || 'Thank you for choosing Bhagyashri Tailoring! 🪡✨'
  );

  // WhatsApp Cloud API config
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState(
    designer?.whatsappPhoneNumberId || ''
  );
  const [whatsappAccessToken, setWhatsappAccessToken] = useState(
    designer?.whatsappAccessToken || ''
  );
  const [whatsappSandboxMode, setWhatsappSandboxMode] = useState(
    designer?.whatsappSandboxMode ?? true
  );

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Cloud API & Multi-Device Sync state
  const [customApiUrl, setCustomApiUrl] = useState(DEFAULT_API_URL);
  const [testingServer, setTestingServer] = useState(false);
  const [serverStatusText, setServerStatusText] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportSection, setShowImportSection] = useState(false);

  useEffect(() => {
    storage.getItem('custom_api_url').then((saved) => {
      if (saved && saved.trim()) {
        setCustomApiUrl(saved.trim());
      }
    });
  }, []);

  useEffect(() => {
    if (designer) {
      setDesignerName(designer.name || designer.designerName || 'Bhagyashri');
      setEmail(designer.email || 'admin@stitchflow.app');
      setBusinessName(designer.businessName || 'Bhagyashri Tailoring');
      setPhone(designer.phone || '');
      setAddress(designer.address || '');
      setMessageSignature(designer.messageSignature || '');
      setWhatsappPhoneNumberId(designer.whatsappPhoneNumberId || '');
      setWhatsappAccessToken(designer.whatsappAccessToken || '');
      setWhatsappSandboxMode(designer.whatsappSandboxMode ?? true);
    }
  }, [
    designer?.name,
    designer?.designerName,
    designer?.businessName,
    designer?.email,
    designer?.phone,
    designer?.address,
    designer?.messageSignature,
    designer?.whatsappPhoneNumberId,
    designer?.whatsappAccessToken,
    designer?.whatsappSandboxMode,
  ]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: any) => authApi.updateProfile(payload),
    onSuccess: (updated) => {
      updateDesigner(updated);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setFeedbackBanner({
        type: 'success',
        message: 'Owner & Boutique settings saved successfully!',
      });
      setTimeout(() => {
        setFeedbackBanner((prev) =>
          prev?.message === 'Owner & Boutique settings saved successfully!' ? null : prev
        );
      }, 4500);
    },
    onError: (err: any) => {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to update settings',
      });
    },
  });

  const handleSaveProfile = () => {
    setFeedbackBanner(null);
    if (!designerName.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: 'Please enter the Owner / Designer Name.',
      });
      return;
    }
    if (!businessName.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: 'Please enter the Business / Boutique Name.',
      });
      return;
    }

    updateProfileMutation.mutate({
      name: designerName.trim(),
      designerName: designerName.trim(),
      email: email.trim() || 'admin@stitchflow.app',
      businessName: businessName.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      messageSignature: messageSignature.trim() || undefined,
      whatsappPhoneNumberId: whatsappPhoneNumberId.trim() || undefined,
      whatsappAccessToken: whatsappAccessToken.trim() || undefined,
      whatsappSandboxMode,
    });
  };

  const handleTestWhatsApp = async () => {
    setTestingWa(true);
    setFeedbackBanner(null);
    try {
      // Save current WA settings first so test uses latest state
      await authApi.updateProfile({
        whatsappPhoneNumberId: whatsappPhoneNumberId.trim() || undefined,
        whatsappAccessToken: whatsappAccessToken.trim() || undefined,
        whatsappSandboxMode,
      });
      const res = await whatsappApi.testConnection();
      setFeedbackBanner({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Could not test WhatsApp connection.',
      });
    } finally {
      setTestingWa(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleManualSync = async () => {
    setSyncingCloud(true);
    try {
      await syncWithCloud();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setFeedbackBanner({
        type: 'success',
        message: 'Cloud Database synced! All customers and orders are permanently saved to PostgreSQL.',
      });
      setTimeout(() => {
        setFeedbackBanner(null);
      }, 5000);
    } catch {
      setFeedbackBanner({
        type: 'error',
        message: 'Cloud sync encountered an issue. Local records are intact and will retry automatically.',
      });
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleTestServer = async () => {
    setTestingServer(true);
    setServerStatusText(null);
    try {
      const url = (customApiUrl || DEFAULT_API_URL).trim().replace(/\/$/, '');
      const resp = await axios.get(`${url}/health`, { timeout: 4000 });
      if (resp.status === 200) {
        setServerStatusText('🟢 Connected! PostgreSQL backend is active and responding.');
      } else {
        setServerStatusText(`🟡 Server status code: HTTP ${resp.status}`);
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setServerStatusText('🔴 Service Suspended: Your service is suspended in Render. Log in to dashboard.render.com and click Resume on stitchflow-backend.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setServerStatusText('🟡 Server is waking up (Render free tier takes ~30-45s to spin up on first request). Please test again in a moment.');
      } else {
        setServerStatusText('🔴 Could not reach backend: ' + (err.message || 'Network error'));
      }
    } finally {
      setTestingServer(false);
    }
  };

  const handleSaveCustomUrl = async () => {
    const trimmed = (customApiUrl || '').trim().replace(/\/$/, '');
    await storage.setItem('custom_api_url', trimmed);
    setFeedbackBanner({
      type: 'success',
      message: 'Server URL saved: ' + trimmed,
    });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleExportBackup = async () => {
    try {
      const json = await localDb.exportAllData();
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(json);
        setFeedbackBanner({
          type: 'success',
          message: 'Boutique data copied to clipboard! You can paste & send to your partner via WhatsApp.',
        });
      } else {
        await Share.share({ message: json, title: 'StitchFlow Boutique Backup' });
      }
      setTimeout(() => setFeedbackBanner(null), 5000);
    } catch {
      setFeedbackBanner({ type: 'error', message: 'Could not export data.' });
    }
  };

  const handleImportBackup = async () => {
    if (!importJsonText.trim()) {
      setFeedbackBanner({ type: 'error', message: 'Please paste the backup JSON text first.' });
      return;
    }
    try {
      const result = await localDb.importAndMergeData(importJsonText.trim());
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowImportSection(false);
      setImportJsonText('');
      setFeedbackBanner({
        type: 'success',
        message: `Merged successfully! Added ${result.customersAdded} new customers and ${result.ordersAdded} orders from partner.`,
      });
      setTimeout(() => setFeedbackBanner(null), 6000);
    } catch (e: any) {
      setFeedbackBanner({ type: 'error', message: e.message || 'Failed to import data.' });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Boutique Settings</Text>

        {/* Cloud Database & Permanent Storage Card */}
        <Card style={[styles.sectionCard, { borderColor: Colors.gold, borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-done-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Cloud Database & Server</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: cloudSynced ? Colors.success : '#FF9500',
                marginRight: Spacing.xs,
              }}
            />
            <Text style={[Typography.bodyMedium, { fontWeight: '600', color: Colors.text }]}>
              {cloudSynced ? 'Cloud Database Connected (PostgreSQL)' : 'Cloud Sync Ready (PostgreSQL)'}
            </Text>
          </View>

          <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 18 }]}>
            All your customer records and orders are synchronized permanently to the managed cloud database so both you and your spouse see all updates across devices.
          </Text>

          <Input
            label="Backend API Server URL"
            value={customApiUrl}
            onChangeText={setCustomApiUrl}
            placeholder="e.g. https://stitchflow-backend.onrender.com"
            autoCapitalize="none"
            leftIcon="globe-outline"
          />

          {serverStatusText ? (
            <View
              style={{
                padding: Spacing.sm,
                backgroundColor: serverStatusText.includes('🟢')
                  ? '#E8F5E9'
                  : serverStatusText.includes('🟡')
                  ? '#FFF9C4'
                  : '#FFEBEE',
                borderRadius: 8,
                marginBottom: Spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: serverStatusText.includes('🟢')
                    ? '#1B5E20'
                    : serverStatusText.includes('🟡')
                    ? '#F57F17'
                    : '#C62828',
                  lineHeight: 18,
                }}
              >
                {serverStatusText}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                title={testingServer ? 'Checking...' : 'Test Connection'}
                variant="outline"
                size="sm"
                leftIcon="pulse-outline"
                loading={testingServer}
                onPress={handleTestServer}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Save URL"
                variant="primary"
                size="sm"
                leftIcon="save-outline"
                onPress={handleSaveCustomUrl}
              />
            </View>
          </View>

          <Button
            title={syncingCloud ? 'Syncing with Cloud...' : 'Sync with Cloud Database Now'}
            variant="gold"
            size="sm"
            leftIcon="sync-outline"
            loading={syncingCloud}
            onPress={handleManualSync}
          />
        </Card>

        {/* Multi-Device Direct Backup & Share with Spouse */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="share-social-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Multi-Device Instant Sync & Backup</Text>
          </View>

          <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 18 }]}>
            Share all your customers and orders directly between devices or send a full backup to your partner via WhatsApp.
          </Text>

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: showImportSection ? Spacing.md : 0 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Export & Share Data"
                variant="outline"
                size="sm"
                leftIcon="copy-outline"
                onPress={handleExportBackup}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={showImportSection ? 'Cancel Import' : 'Import from Partner'}
                variant="outline"
                size="sm"
                leftIcon="download-outline"
                onPress={() => setShowImportSection(!showImportSection)}
              />
            </View>
          </View>

          {showImportSection ? (
            <View style={{ marginTop: Spacing.md }}>
              <Input
                label="Paste Partner's Backup Text"
                value={importJsonText}
                onChangeText={setImportJsonText}
                placeholder="Paste the exported JSON text here..."
                multiline
                numberOfLines={4}
              />
              <Button
                title="Merge into My App Now"
                variant="primary"
                size="sm"
                leftIcon="checkmark-done-outline"
                onPress={handleImportBackup}
              />
            </View>
          ) : null}
        </Card>

        {feedbackBanner ? (
          <View
            style={[
              styles.feedbackBanner,
              feedbackBanner.type === 'success'
                ? styles.feedbackSuccess
                : styles.feedbackError,
            ]}
          >
            <Ionicons
              name={
                feedbackBanner.type === 'success'
                  ? 'checkmark-circle'
                  : 'alert-circle'
              }
              size={20}
              color={
                feedbackBanner.type === 'success' ? Colors.success : Colors.error
              }
            />
            <Text
              style={[
                styles.feedbackText,
                {
                  color:
                    feedbackBanner.type === 'success'
                      ? '#1E7E34'
                      : Colors.error,
                },
              ]}
            >
              {feedbackBanner.message}
            </Text>
          </View>
        ) : null}

        {/* Owner / Designer Details */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Owner Details</Text>
          </View>

          <Input
            label="Owner / Designer Name *"
            placeholder="e.g. Bhagyashri"
            value={designerName}
            onChangeText={setDesignerName}
            leftIcon="person-outline"
          />

          <Input
            label="Owner Email"
            placeholder="e.g. admin@stitchflow.app"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail-outline"
          />
        </Card>

        {/* Boutique / Business Profile */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Business Profile</Text>
          </View>

          <Input
            label="Business / Boutique Name *"
            placeholder="e.g. Bhagyashri Tailoring"
            value={businessName}
            onChangeText={setBusinessName}
            leftIcon="business-outline"
          />

          <Input
            label="Boutique Contact Phone"
            placeholder="e.g. +91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            leftIcon="call-outline"
          />

          <Input
            label="Shop Address"
            placeholder="Shop address included in customer receipts"
            multiline
            numberOfLines={2}
            value={address}
            onChangeText={setAddress}
            leftIcon="location-outline"
          />

          <View style={styles.currencyRow}>
            <Text style={styles.currencyLabel}>Default Currency</Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>
                INR (₹) - Indian Rupee
              </Text>
            </View>
          </View>
        </Card>

        {/* WhatsApp Cloud API Integration */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.sectionTitle}>WhatsApp Notifications</Text>
          </View>

          {/* Sandbox Mode Toggle */}
          <View style={styles.sandboxRow}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={styles.sandboxTitle}>Sandbox / Demo Mode</Text>
              <Text style={styles.sandboxDesc}>
                When enabled, messages are logged without calling live Meta Cloud API. You can also send messages directly via the WhatsApp app on your phone.
              </Text>
            </View>
            <Switch
              value={whatsappSandboxMode}
              onValueChange={setWhatsappSandboxMode}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <Input
            label="WhatsApp Phone Number ID"
            placeholder="e.g. 105928374651928"
            value={whatsappPhoneNumberId}
            onChangeText={setWhatsappPhoneNumberId}
            keyboardType="numeric"
          />

          <Input
            label="Meta Permanent Access Token"
            placeholder="EAAGm0PX4ZCps..."
            value={whatsappAccessToken}
            onChangeText={setWhatsappAccessToken}
            isPassword
          />

          <Input
            label="Custom Message Signature"
            placeholder="e.g. Thank you for choosing Bhagyashri Tailoring!"
            value={messageSignature}
            onChangeText={setMessageSignature}
          />

          <Button
            label={testingWa ? 'Testing...' : 'Verify WhatsApp Configuration'}
            variant="outline"
            onPress={handleTestWhatsApp}
            loading={testingWa}
            style={styles.testBtn}
          />
        </Card>

        <Button
          label="Save All Settings"
          variant="primary"
          size="lg"
          onPress={handleSaveProfile}
          loading={updateProfileMutation.isPending}
          style={styles.saveBtn}
        />

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out of StitchFlow</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log Out?"
        message="Are you sure you want to log out of your StitchFlow account on this device?"
        confirmLabel="Log Out"
        cancelLabel="Stay Logged In"
        confirmVariant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
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
  screenTitle: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#E8F8EE',
    borderColor: '#A3E4B7',
  },
  feedbackError: {
    backgroundColor: '#FFF2F2',
    borderColor: '#F5B7B1',
  },
  feedbackText: {
    ...Typography.subhead,
    fontWeight: '600',
    flex: 1,
  },
  sectionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  currencyLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  currencyBadge: {
    backgroundColor: '#FAF7F2',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyBadgeText: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.primary,
  },
  sandboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  },
  testBtn: {
    marginTop: Spacing.xs,
  },
  saveBtn: {
    marginBottom: Spacing.lg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: 14,
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  logoutText: {
    ...Typography.callout,
    fontWeight: '700',
    color: Colors.error,
  },
});
