# Field Log App

Offline-first React Native app for field agents to submit customer logs in areas with unreliable internet.

## Setup

1. Clone the repo
2. Run `npm install`
3. Run `npx expo start`
4. Scan the QR code with Expo Go

## Features

- Submit logs with Customer Name, Notes, Timestamp, optional photo
- Entries saved locally and shown as PENDING instantly (optimistic UI)
- Auto-syncs in FIFO order when connectivity restores
- Force Offline toggle for testing without turning off Wi-Fi
- PENDING / SYNCED / FAILED status badges with manual Retry
- FlatList optimized with getItemLayout and memo() for 100+ items

## Project Structure

- `App.tsx` — main screen
- `src/types.ts` — shared TypeScript types
- `src/storage.ts` — AsyncStorage persistence layer
- `src/mockApi.ts` — simulated backend (replace with real fetch in production)
- `src/seedData.ts` — sample data for first launch
- `src/components/LogItem.tsx` — memoized list row component

## Tech Stack

React Native (Expo), TypeScript, AsyncStorage, NetInfo