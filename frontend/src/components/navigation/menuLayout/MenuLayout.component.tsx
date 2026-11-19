// File: components/navigation/menuLayout/MenuLayout.tsx
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { SidebarAvatar } from '@/components/navigation/sidebar/avatar.component';
import { SidebarNav } from '@/components/navigation/sidebar/sidebarNav.component';
import { BranchSelector } from '@/components/navigation/branchSelector/BranchSelector.component';
import { MENU_LAYOUT } from '@/constants/routes';

export default function MenuLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="text-white bg-primary p-2 rounded-full focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 lg:w-[220px] xl:w-[320px] bg-secondary z-10 flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="relative w-full bg-primary flex items-center justify-center px-5 h-16">
          <Image
            src="/moto-candela-logo.svg"
            alt="Moto Candela Logo"
            className="object-contain w-150 logo-overlap-override"
            fill
          />
        </div>

        <div className="p-4">
          <BranchSelector />
        </div>

        <div className="flex-1 overflow-y-auto">
          <SidebarNav items={MENU_LAYOUT} />
        </div>

        <div className="p-4">
          <SidebarAvatar />
        </div>
      </aside>
    </>
  );
}
