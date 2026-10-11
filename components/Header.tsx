
'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from './SearchBar';
import AnnouncementBar from './AnnouncementBar';

const navLinks = [
  { name: 'All Products', href: '/products' },
  { name: 'New Arrivals', href: '/collections/new-arrivals' },
  { name: 'Sarees', href: '/collections/sarees' },
  { name: 'Suits', href: '/collections/suits' },
  { name: 'Kurtis', href: '/collections/kurtis' },
  { name: 'Lehengas', href: '/collections/lehengas' },
];

// Preserve the existing multicolour Rangrez wordmark.
const WORDMARK: Array<[string, string]> = [
  ['R', '#8F00FF'],
  ['A', '#4B0082'],
  ['N', '#0057E7'],
  ['G', '#00A550'],
  ['R', '#E8B400'],
  ['E', '#FF7F00'],
  ['Z', '#E01B24'],
];

function Wordmark() {
  return (
    <span aria-label="Rangrez">
      {WORDMARK.map(([letter, colour], index) => (
        <span key={index} style={{ color: colour }} aria-hidden="true">
          {letter}
        </span>
      ))}
    </span>
  );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { getItemCount } = useCart();
  const { user, logout, isLoading } = useAuth();

  const cartCount = getItemCount();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close the desktop user menu when clicking outside it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((open) => !open);
    setMobileSearchOpen(false);
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen((open) => !open);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-50 border-b border-[#BFC8D5] bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center md:h-20">
            {/* Left: mobile menu and desktop logo */}
            <div className="flex flex-1 items-center md:flex-none">
              <button
                type="button"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                onClick={toggleMobileMenu}
                className="md:hidden -ml-2 p-2 text-[#52627A] transition-colors hover:text-[#244FC4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244FC4]"
              >
                {mobileMenuOpen ? (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>

              <Link
                href="/"
                className="hidden items-center gap-2 text-3xl font-bold tracking-tight transition-opacity hover:opacity-80 md:flex"
              >
                <Wordmark />
              </Link>
            </div>

            {/* Centered logo on mobile */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight transition-opacity hover:opacity-80 md:hidden"
            >
              <Wordmark />
            </Link>

            {/* Desktop navigation */}
            <nav
              aria-label="Main navigation"
              className="mx-auto hidden items-center space-x-6 md:flex lg:space-x-8"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#202C46] transition-colors hover:text-[#244FC4]"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right-side actions */}
            <div className="flex flex-1 items-center justify-end space-x-1 md:flex-none md:space-x-4">
              {/* Desktop search */}
              <div className="hidden md:block">
                <SearchBar />
              </div>

              {/* Mobile search toggle */}
              <button
                type="button"
                aria-label="Search"
                aria-expanded={mobileSearchOpen}
                onClick={toggleMobileSearch}
                className="p-2 text-[#52627A] transition-colors hover:text-[#244FC4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244FC4] md:hidden"
              >
                {mobileSearchOpen ? (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </button>

              {/* Desktop user menu */}
              {!isLoading && (
                <>
                  {user ? (
                    <div
                      className="relative hidden md:block"
                      ref={userMenuRef}
                    >
                      <button
                        type="button"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 p-2 text-[#52627A] transition-colors hover:text-[#244FC4]"
                        aria-label="User menu"
                        aria-expanded={userMenuOpen}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>

                        <span className="hidden text-sm font-medium text-[#202C46] lg:inline">
                          {user.name.split(' ')[0]}
                        </span>
                      </button>

                      <AnimatePresence>
                        {userMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-[#BFC8D5] bg-white shadow-lg"
                          >
                            <div className="border-b border-[#BFC8D5] p-2">
                              <p className="text-sm font-medium text-[#202C46]">
                                {user.name}
                              </p>
                              <p className="truncate text-xs text-[#52627A]">
                                {user.email}
                              </p>
                            </div>

                            <Link
                              href="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-[#202C46] transition-colors hover:bg-[#F7F9FC] hover:text-[#244FC4]"
                            >
                              My Profile
                            </Link>

                            <Link
                              href="/orders"
                              onClick={() => setUserMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-[#202C46] transition-colors hover:bg-[#F7F9FC] hover:text-[#244FC4]"
                            >
                              My Orders
                            </Link>

                            {user.role === 'admin' && (
                              <>
                                <Link
                                  href="/admin/dashboard"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="mt-1 block border-t border-[#BFC8D5] px-4 pt-2 pb-2 text-sm text-[#202C46] transition-colors hover:bg-[#F7F9FC] hover:text-[#244FC4]"
                                >
                                  Dashboard
                                </Link>

                                <Link
                                  href="/admin/homepage-settings"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="block px-4 py-2 text-sm text-[#202C46] transition-colors hover:bg-[#F7F9FC] hover:text-[#244FC4]"
                                >
                                  Homepage Settings
                                </Link>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                logout();
                                setUserMenuOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-[#244FC4] transition-colors hover:bg-[#E7EDF9]"
                            >
                              Logout
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="hidden px-4 py-2 text-sm font-medium text-[#202C46] transition-colors hover:text-[#244FC4] md:block"
                    >
                      Login
                    </Link>
                  )}
                </>
              )}

              {/* Shopping cart */}
              <Link
                href="/cart"
                aria-label="Shopping cart"
                className="relative p-2 text-[#52627A] transition-colors hover:text-[#244FC4]"
              >
                <svg
                  className="h-5 w-5 md:h-6 md:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>

                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#244FC4] text-xs font-bold text-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile search panel */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[#BFC8D5] bg-white md:hidden"
            >
              <div className="container mx-auto px-4 py-3">
                <SearchBar
                  mobile
                  onClose={() => setMobileSearchOpen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile navigation panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              aria-label="Mobile navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[#BFC8D5] bg-white md:hidden"
            >
              <div className="container mx-auto space-y-3 px-4 py-4">
                {/* Mobile account links */}
                {!isLoading && (
                  <>
                    {user ? (
                      <>
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 text-base font-medium text-[#202C46] transition-colors hover:text-[#244FC4]"
                        >
                          My Profile
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 text-base font-medium text-[#202C46] transition-colors hover:text-[#244FC4]"
                        >
                          My Orders
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 text-base font-medium text-[#202C46] transition-colors hover:text-[#244FC4]"
                          >
                            Dashboard
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }}
                          className="block w-full py-2 text-left text-base font-medium text-[#244FC4] transition-colors hover:text-[#202C46]"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-base font-medium text-[#202C46] transition-colors hover:text-[#244FC4]"
                      >
                        Login
                      </Link>
                    )}

                    <div className="border-t border-[#BFC8D5] pt-3" />
                  </>
                )}

                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base font-medium text-[#202C46] transition-colors hover:text-[#244FC4]"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
