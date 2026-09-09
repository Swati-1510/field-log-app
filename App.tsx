import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  Image,
  TouchableOpacity,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import NetInfo from "@react-native-community/netinfo";

import { LogEntry, SyncStatus } from "./src/types";
import { loadLogs, saveLogs } from "./src/storage";
import { uploadLog } from "./src/mockApi";
import { generateSeedLogs } from "./src/seedData";
import LogItem, { ROW_HEIGHT } from "./src/components/LogItem";

export default function App() {
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState<string>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealNetworkConnected, setIsRealNetworkConnected] = useState(true);
  const [forceOfflineMode, setForceOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref instead of state — avoids stale closure inside syncPendingLogs
  const logsRef = useRef<LogEntry[]>([]);
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Offline if real network is down OR manual override is on
  const isOffline = !isRealNetworkConnected || forceOfflineMode;

  function updateLogStatus(id: string, status: SyncStatus) {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, status } : log)),
    );
  }

  // Processes pending queue in FIFO order — sequential await preserves ordering
  async function syncPendingLogs() {
    if (isSyncing) return;
    setIsSyncing(true);
    const pending = logsRef.current
      .filter((l) => l.status === "pending")
      .reverse();
    for (const entry of pending) {
      try {
        await uploadLog(entry);
        updateLogStatus(entry.id, "synced");
      } catch {
        updateLogStatus(entry.id, "failed");
      }
    }
    setIsSyncing(false);
  }

  // Auto-flush queue when connectivity restores
  useEffect(() => {
    if (!isOffline) syncPendingLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  // Unsubscribe returned from addEventListener prevents memory leak
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsRealNetworkConnected(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  // Load persisted logs on mount; seed 100 items on first-ever launch
  useEffect(() => {
    async function init() {
      try {
        const saved = await loadLogs();
        setLogs(saved ?? generateSeedLogs(100));
      } catch (e) {
        console.error("Failed to load logs:", e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Persist to storage on every logs change; skip during initial load
  useEffect(() => {
    if (!isLoading) saveLogs(logs);
  }, [logs, isLoading]);

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission to access photos is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function retrySingleLog(entry: LogEntry) {
    updateLogStatus(entry.id, "pending");
    try {
      await uploadLog(entry);
      updateLogStatus(entry.id, "synced");
    } catch {
      updateLogStatus(entry.id, "failed");
    }
  }

  function handleSubmit() {
    if (!customerName.trim() || !notes.trim()) return;
    const newEntry: LogEntry = {
      id: Date.now().toString(),
      customerName,
      notes,
      timestamp: Date.now(),
      status: "pending",
      imageUri,
    };
    setLogs((prev) => [newEntry, ...prev]);
    setCustomerName("");
    setNotes("");
    setImageUri(undefined);
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading your logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            {forceOfflineMode
              ? "OFFLINE MODE (forced)"
              : "NO INTERNET CONNECTION"}
          </Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <Text style={styles.title}>Field Log</Text>
        {isSyncing && <Text style={styles.syncingText}>Syncing...</Text>}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Force Offline</Text>
          <Switch
            value={forceOfflineMode}
            onValueChange={setForceOfflineMode}
          />
        </View>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput
          style={styles.input}
          placeholder="Log Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
          <Text style={styles.imageButtonText}>
            {imageUri ? "Change Photo" : "Add Photo (optional)"}
          </Text>
        </TouchableOpacity>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}
        <Button title="Submit Log" onPress={handleSubmit} />
      </View>

      <FlatList
        style={styles.list}
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No logs yet. Add one above.</Text>
        }
        renderItem={({ item }) => (
          <LogItem item={item} onRetry={retrySingleLog} />
        )}
        getItemLayout={(_data, index) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  centered: { justifyContent: "center", alignItems: "center" },
  offlineBanner: {
    backgroundColor: "#e74c3c",
    paddingVertical: 6,
    marginHorizontal: -16,
    marginTop: -60,
    paddingTop: 66,
  },
  offlineBannerText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleLabel: { fontSize: 12, color: "#666" },
  syncingText: { fontSize: 12, color: "#3498db", fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "bold" },
  form: { gap: 8, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  imageButton: {
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  imageButtonText: { color: "#3498db", fontWeight: "600" },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  list: { flex: 1 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 40 },
});
