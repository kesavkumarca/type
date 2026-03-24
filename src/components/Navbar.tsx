'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 🛠️ Importing your UI kit (Ensuring correct pathing)
import { Navbar as CustomNavbar, NavbarItem, NavbarSection } from '@/components/navbar';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/dropdown';

// 🎨 Heroicons integration
import { ChevronDownIcon } from '@heroicons/react/16/solid';

export default function Navbar() {
  const { user, profile, isAdmin, logOut } = useAuth();
  const router = useRouter();

  const handleLogOut = async () => {
    try {
      await logOut();
      router.push('/login');
    } catch (err) {
      console.error('Log out failed:', err);
    }
  };

  return (
    <nav className="bg-[#0b0f19] text-white border-b border-white/5 relative z-50">
      <div className="max-w-6xl mx-auto px-4">
        <CustomNavbar>
          
          {/* 🏷️ Left Side: Logo */}
          <Link href="/dashboard" aria-label="Lakshmi Tech Institute" className="text-xl font-bold tracking-tight text-white hover:text-indigo-300 transition-colors">
            Lakshmi Tech
          </Link>

          {/* 🛰️ Middle: Navigation Core */}
          <NavbarSection>
            
            <Dropdown>
              <DropdownButton outline className="text-white hover:bg-white/10 transition-colors rounded-lg flex items-center gap-1">
                Typing Tests
                <ChevronDownIcon className="size-4 text-slate-400" />
              </DropdownButton>
              <DropdownMenu className="bg-[#111827] border border-white/10 shadow-2xl rounded-xl mt-2 w-64">
                <div className="px-4 py-2 border-b border-white/5">
                  <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">English</span>
                </div>
                <DropdownItem href="/typing-test/english/junior" className="text-white hover:bg-white/5 text-sm">
                  Junior (30 WPM / 1500)
                </DropdownItem>
                <DropdownItem href="/typing-test/english/senior" className="text-white hover:bg-white/5 text-sm">
                  Senior (45 WPM / 2250)
                </DropdownItem>
                
                <div className="px-4 py-2 border-t border-b border-white/5 mt-1">
                  <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">Tamil</span>
                </div>
                <DropdownItem href="/typing-test/tamil/junior" className="text-white hover:bg-white/5 text-sm">
                  Junior (30 WPM / 1500)
                </DropdownItem>
                <DropdownItem href="/typing-test/tamil/senior" className="text-white hover:bg-white/5 text-sm">
                  Senior (45 WPM / 2250)
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <NavbarItem href="/leaderboard" className="text-white hover:bg-white/10 rounded-lg transition-colors">
              Leaderboard
            </NavbarItem>

            <NavbarItem href="/contact" className="text-white hover:bg-white/10 rounded-lg transition-colors">
              Contact
            </NavbarItem>

            {isAdmin && (
              <NavbarItem href="/admin" className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg px-3 py-1.5 transition-colors">
                Admin Panel
              </NavbarItem>
            )}
          </NavbarSection>

          {/* 👤 Right Side: Profile */}
          <NavbarSection>
            <Dropdown>
              <DropdownButton outline className="text-white hover:bg-white/10 transition-colors rounded-lg flex items-center gap-1">
                {profile?.full_name || 'Account'}
                <ChevronDownIcon className="size-4 text-slate-400" />
              </DropdownButton>
              <DropdownMenu className="bg-[#111827] border border-white/10 shadow-2xl rounded-xl mt-2 w-56">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="font-semibold text-sm text-white truncate">{profile?.full_name || 'Typist'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <DropdownItem href="/profile" className="text-white hover:bg-white/5 text-sm flex items-center mt-1">
                  My Profile
                </DropdownItem>
                <DropdownItem onClick={handleLogOut} className="text-red-400 hover:bg-red-500/10 font-semibold text-sm cursor-pointer mt-1">
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarSection>

        </CustomNavbar>
      </div>
    </nav>
  );
}