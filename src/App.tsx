// src/App.tsx
import { CesiumViewer } from './components/CesiumViewer';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>✈️ Cesium 飞机飞行可视化</h1>
      </header>
      <main>
        <CesiumViewer />
      </main>
    </div>
  );
}
