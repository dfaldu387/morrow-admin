'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DuckLogo, IconDashboard, IconUsers, IconHabits, IconBell, IconTag, IconLogOut } from './Icons';

const navItems = [
  { href: '/', label: 'Dashboard', icon: <IconDashboard /> },
  { href: '/users', label: 'Users', icon: <IconUsers /> },
  { href: '/habits', label: 'Habits', icon: <IconHabits /> },
  { href: '/categories', label: 'Categories', icon: <IconTag /> },
  { href: '/notifications', label: 'Notifications', icon: <IconBell /> },
];

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <DuckLogo size={36} />
        <h1>morrow</h1>
        <span>ADMIN</span>
      </div>
      <nav>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : ''}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">A</div>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Admin</div>
            <div style={{ fontSize: 11 }}>admin@yopmail.com</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <IconLogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
