// src/components/Layout.tsx
// 顶部导航 + 路由切换
import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/flight', label: '✈️ 飞行可视化', title: '飞机飞行可视化' },
  { to: '/routes', label: '🗺️ 多航线管理', title: '路由管理' },
  { to: '/planning', label: '🚗 路径规划', title: '道路级路径规划' },
  { to: '/decision', label: '🤖 自动驾驶决策', title: '自动驾驶决策仿真' },
];

export function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🌍 Cesium 多场景可视化平台</h1>
        <nav className="app-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
              title={item.title}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
