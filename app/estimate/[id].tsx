import { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Chip, Button, DataTable, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useEstimate,
  useUpdateEstimateStatus,
  useSendEstimate,
  useSubmitEstimate,
  useApproveEstimate,
  useRejectEstimate,
  useEstimateComments,
  usePostComment,
} from '../../hooks/useEstimates';
import { EmptyState } from '../../components/ui/EmptyState';
import { getStatusStyles } from '../../utils/statusColors';
import { formatDate, formatDateTime, formatINR } from '../../utils/format';
import { openExternal } from '../../utils/linking';
import { theme } from '../../constants/theme';

export default function EstimateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: estimate, isLoading } = useEstimate(Number(id));
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateEstimateStatus();
  const { mutate: sendEstimate, isPending: isSending } = useSendEstimate();
  const { mutate: submitEstimate, isPending: isSubmitting } = useSubmitEstimate();
  const { mutate: approveEstimate, isPending: isApproving } = useApproveEstimate();
  const { mutate: rejectEstimate, isPending: isRejecting } = useRejectEstimate();
  const { data: comments } = useEstimateComments(Number(id));
  const { mutate: postComment, isPending: isPosting } = usePostComment();

  const [commentText, setCommentText] = useState('');
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!estimate) {
    return (
      <EmptyState
        icon="file-alert-outline"
        title="Estimate not found"
        subtitle="Estimate details could not be loaded or estimate does not exist"
      />
    );
  }

  // Status comes from the query cache — the mutation hooks apply optimistic
  // updates and roll back on error, so no local mirror state is needed.
  const status = estimate.status ?? '';
  const statusStyles = getStatusStyles(status);
  const norm = status.toLowerCase().replace(/\s+/g, '_');
  const anyActionPending = isUpdating || isSending || isSubmitting || isApproving || isRejecting;

  const onMutationError = () =>
    Alert.alert('Action failed', 'Could not update the estimate. Please try again.');

  const handleAccept = () =>
    updateStatus({ id: estimate.id, status: 'accepted' }, { onError: onMutationError });

  const handleDecline = () => {
    Alert.alert('Mark as Declined?', 'Are you sure you want to mark this estimate as declined?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () =>
          updateStatus({ id: estimate.id, status: 'declined' }, { onError: onMutationError }),
      },
    ]);
  };

  const handleSend = () => sendEstimate(estimate.id, { onError: onMutationError });
  const handleSubmit = () => submitEstimate(estimate.id, { onError: onMutationError });
  const handleApprove = () => approveEstimate(estimate.id, { onError: onMutationError });

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) return;
    setRejectDialogVisible(false);
    rejectEstimate(
      { id: estimate.id, reason: rejectReason.trim() },
      { onError: onMutationError }
    );
    setRejectReason('');
  };

  const handlePostComment = () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText('');
    postComment(
      { estimateId: estimate.id, payload: { content: text } },
      {
        onError: () => {
          setCommentText(text); // restore the user's text instead of losing it
          Alert.alert('Comment not posted', 'Check your connection and try again.');
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Estimate Details',
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary },
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header Block */}
        <View style={styles.header}>
          <Text style={styles.title}>{estimate.estimate_number}</Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: statusStyles.backgroundColor }]}
            textStyle={{ color: statusStyles.color, fontWeight: '700' }}
            showSelectedOverlay={false}
          >
            {status.toUpperCase().replace(/_/g, ' ')}
          </Chip>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Details</Text>
          <TouchableOpacity
            style={styles.infoRow}
            activeOpacity={0.7}
            onPress={() => estimate.lead_id && router.push(`/lead/${estimate.lead_id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open lead ${estimate.lead_name ?? ''}`}
          >
            <MaterialCommunityIcons name="account-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.infoTextLink}>{estimate.lead_name}</Text>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-outline" size={22} color={theme.colors.textMuted} />
            <Text style={styles.infoText}>Valid until {formatDate(estimate.valid_until)}</Text>
          </View>
        </View>

        {/* Line Items Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabelBold}>Line Items</Text>
          <DataTable style={styles.table}>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={styles.colDesc}><Text style={styles.headerText}>Description</Text></DataTable.Title>
              <DataTable.Title numeric style={styles.colQty}><Text style={styles.headerText}>Qty</Text></DataTable.Title>
              <DataTable.Title numeric style={styles.colRate}><Text style={styles.headerText}>Rate</Text></DataTable.Title>
              <DataTable.Title numeric style={styles.colAmt}><Text style={styles.headerText}>Amount</Text></DataTable.Title>
            </DataTable.Header>

            {estimate.items?.map((item) => (
              <DataTable.Row key={item.id} style={styles.tableRow}>
                <DataTable.Cell style={styles.colDesc}>
                  <Text style={styles.cellText}>{item.description}</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric style={styles.colQty}>
                  <Text style={styles.cellText}>{item.qty}</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric style={styles.colRate}>
                  <Text style={styles.cellText}>{formatINR(item.rate)}</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric style={styles.colAmt}>
                  <Text style={styles.cellText}>{formatINR(item.amount)}</Text>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            <DataTable.Row style={styles.summaryRow}>
              <DataTable.Cell style={{ flex: 4 }}>
                <Text style={styles.subtotalLabel}>Subtotal</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={{ flex: 1.5 }}>
                <Text style={styles.subtotalValue}>{formatINR(estimate.subtotal)}</Text>
              </DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row style={styles.totalRow}>
              <DataTable.Cell style={{ flex: 4 }}>
                <Text style={styles.totalLabel}>Total</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={{ flex: 1.5 }}>
                <Text style={styles.totalValue}>{formatINR(estimate.total)}</Text>
              </DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Actions</Text>
          <View style={styles.buttonsRow}>
            {/* Draft → Send or Submit for Approval */}
            {norm === 'draft' && (
              <>
                <Button
                  mode="contained"
                  onPress={handleSend}
                  loading={isSending}
                  disabled={anyActionPending}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                >
                  Send
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={anyActionPending}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  textColor={theme.colors.primary}
                >
                  Submit for Approval
                </Button>
              </>
            )}

            {/* Sent → Mark Accepted / Declined */}
            {norm === 'sent' && (
              <>
                <Button
                  mode="contained"
                  onPress={handleAccept}
                  loading={isUpdating}
                  disabled={anyActionPending}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                >
                  Mark Accepted
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleDecline}
                  loading={isUpdating}
                  disabled={anyActionPending}
                  textColor={theme.colors.error}
                  style={[styles.actionButton, styles.declineButton]}
                  contentStyle={styles.buttonContent}
                >
                  Mark Declined
                </Button>
              </>
            )}

            {/* Waiting / Pending Approval → Approve or Reject */}
            {(norm === 'waiting_approval' || norm === 'pending_approval') && (
              <>
                <Button
                  mode="contained"
                  onPress={handleApprove}
                  loading={isApproving}
                  disabled={anyActionPending}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                >
                  Approve
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setRejectDialogVisible(true)}
                  loading={isRejecting}
                  disabled={anyActionPending}
                  textColor={theme.colors.error}
                  style={[styles.actionButton, styles.declineButton]}
                  contentStyle={styles.buttonContent}
                >
                  Reject
                </Button>
              </>
            )}

            {estimate.pdf_url && (
              <Button
                mode="outlined"
                icon="file-pdf-box"
                onPress={() => openExternal(estimate.pdf_url!)}
                style={styles.actionButton}
                contentStyle={styles.buttonContent}
                textColor={theme.colors.primary}
              >
                View PDF
              </Button>
            )}
          </View>

          {/* Reject reason input */}
          {rejectDialogVisible && (
            <View style={styles.rejectBox}>
              <Text style={styles.rejectLabel}>Rejection reason</Text>
              <TextInput
                style={styles.rejectInput}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Enter reason…"
                multiline
                maxLength={1000}
                placeholderTextColor={theme.colors.textMuted}
              />
              <View style={styles.rejectActions}>
                <Button mode="text" onPress={() => { setRejectDialogVisible(false); setRejectReason(''); }} textColor={theme.colors.primary}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleRejectConfirm}
                  disabled={!rejectReason.trim() || isRejecting}
                  loading={isRejecting}
                  buttonColor={theme.colors.error}
                  textColor={theme.colors.onError}
                  style={styles.rejectConfirmBtn}
                >
                  Confirm Reject
                </Button>
              </View>
            </View>
          )}
        </View>

        {/* Comments Card */}
        <View style={[styles.card, styles.commentsCard]}>
          <Text style={styles.cardSectionLabelBold}>Comments</Text>

          {!comments || comments.length === 0 ? (
            <Text style={styles.emptyText}>No comments yet</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{c.user?.name ?? 'Unknown'}</Text>
                  <Text style={styles.commentDate}>{formatDateTime(c.created_at)}</Text>
                </View>
                <Text style={styles.commentBody}>{c.content}</Text>
              </View>
            ))
          )}

          {/* Add comment */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              onPress={handlePostComment}
              disabled={!commentText.trim() || isPosting}
              style={[styles.sendBtn, (!commentText.trim() || isPosting) && { opacity: 0.4 }]}
              accessibilityRole="button"
              accessibilityLabel="Post comment"
            >
              {isPosting ? (
                <ActivityIndicator size={20} color={theme.colors.primary} />
              ) : (
                <MaterialCommunityIcons name="send" size={22} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.gapLg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: theme.spacing.gapMd,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statusChip: {
    alignSelf: 'center',
    height: 32,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.xl,
    padding: theme.spacing.paddingX,
    marginHorizontal: theme.spacing.margin,
    marginVertical: theme.spacing.gapSm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  commentsCard: {
    marginBottom: theme.spacing.gapLg,
  },
  cardSectionLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginBottom: 12,
    fontWeight: '700',
  },
  cardSectionLabelBold: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
    marginBottom: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  infoTextLink: {
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.md,
    overflow: 'hidden',
    marginTop: 4,
  },
  tableHeader: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  headerText: {
    ...theme.typography.labelSm,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  colDesc: { flex: 2 },
  colQty: { flex: 0.8 },
  colRate: { flex: 1.2 },
  colAmt: { flex: 1.5 },
  cellText: {
    ...theme.typography.bodyMd,
    fontSize: 12,
  },
  summaryRow: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  totalRow: {
    backgroundColor: theme.colors.surfaceContainer,
  },
  subtotalLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
  },
  subtotalValue: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  totalLabel: {
    ...theme.typography.labelLg,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  totalValue: {
    ...theme.typography.headlineMd,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  actionButton: {
    borderRadius: theme.roundness.xl,
    minWidth: 130,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  buttonContent: {
    height: 48,
  },
  declineButton: {
    borderColor: theme.colors.error,
  },
  rejectBox: {
    marginTop: 16,
    backgroundColor: '#ffdad6',
    borderRadius: theme.roundness.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  rejectLabel: {
    ...theme.typography.labelMd,
    fontWeight: '700',
    color: theme.colors.error,
    marginBottom: 8,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.md,
    padding: 10,
    ...theme.typography.bodyMd,
    minHeight: 72,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
    textAlignVertical: 'top',
  },
  rejectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  rejectConfirmBtn: {
    borderRadius: theme.roundness.xl,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  commentCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.roundness.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    ...theme.typography.labelSm,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  commentDate: {
    ...theme.typography.labelSm,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  commentBody: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    maxHeight: 100,
    backgroundColor: theme.colors.surfaceContainerLow,
    textAlignVertical: 'top',
  },
  sendBtn: {
    padding: 8,
    marginBottom: 2,
  },
});
