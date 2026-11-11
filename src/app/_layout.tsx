import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';

async function initializeDatabase(database: SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS item_records (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      reason TEXT NOT NULL,
      frequency TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="taste-journal.db" onInit={initializeDatabase}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#F5F4EE' },
          headerShadowVisible: false,
          headerTintColor: '#25382F',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#F5F4EE' },
        }}
      >
        <Stack.Screen name="index" options={{ title: '취향 기록' }} />
      </Stack>
    </SQLiteProvider>
  );
}
