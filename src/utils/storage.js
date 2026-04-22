import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'skana_history';

export async function getHistory() {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addScan(scan) {
  try {
    const history = await getHistory();
    const newScan = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      }),
      timestamp: Date.now(),
      ...scan,
    };
    const updated = [newScan, ...history];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
    return [];
  } catch {
    return [];
  }
}
