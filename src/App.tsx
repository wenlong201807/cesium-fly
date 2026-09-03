// src/App.tsx
// HashRouter 多页面入口
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import FlightPage from './pages/FlightPage';
import RoutesPage from './pages/RoutesPage';
import PlanningPage from './pages/PlanningPage';
import DecisionPage from './pages/DecisionPage';
import './App.css';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<FlightPage />} />
          <Route path="flight" element={<FlightPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="decision" element={<DecisionPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
