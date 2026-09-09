import { memo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { LogEntry, SyncStatus } from "../types";

// Defined outside component — never changes, no point recreating on every render
const statusStyles: Record<SyncStatus, { color: string }> = {
  pending: { color: "#e67e22" },
  synced: { color: "#27ae60" },
  failed: { color: "#e74c3c" },
};

// Fixed height enables getItemLayout in the parent list — all text has
// explicit lineHeight so this value is identical on Android and iOS
export const ROW_HEIGHT = 104;

type Props = {
  item: LogEntry;
  onRetry: (entry: LogEntry) => void;
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Extracted + memoized so only the affected row re-renders on status change
const LogItem = memo(function LogItem({ item, onRetry }: Props) {
  return (
    <View style={[styles.logItem, { height: ROW_HEIGHT }]}>
      <View style={styles.logRow}>
        {item.imageUri && (
          <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.logName}>{item.customerName}</Text>
          <Text style={styles.logNotes} numberOfLines={1}>
            {item.notes}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusBadge, statusStyles[item.status]]}>
              {item.status.toUpperCase()}
            </Text>
            {item.status === "failed" && (
              <TouchableOpacity onPress={() => onRetry(item)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

export default LogItem;

const styles = StyleSheet.create({
  logItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    overflow: "hidden",
  },
  logRow: { flexDirection: "row", gap: 10 },
  thumbnail: { width: 50, height: 50, borderRadius: 6 },
  logName: { fontWeight: "600", fontSize: 16, lineHeight: 20 },
  logNotes: { color: "#444", marginTop: 2, fontSize: 14, lineHeight: 18 },
  timestamp: { color: "#999", fontSize: 12, lineHeight: 14, marginTop: 4 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    height: 16,
  },
  retryText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#3498db",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  statusBadge: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
});
