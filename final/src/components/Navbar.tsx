import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/context/AuthContext";

const authedLinks = [
  { to: "/", label: "Home" },
  { to: "/new-scan", label: "Check a Spot" },
  { to: "/skin-map", label: "My Skin Map" },
  { to: "/history", label: "History" },
  { to: "/learn", label: "Learn" },
  { to: "/reminders", label: "Reminders" },
];

const publicLinks = [
  { to: "/learn", label: "Learn" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut();
    navigate("/login");
  };

  const links = isAuthenticated ? authedLinks : publicLinks;

  return (
    <header className="sticky top-0 z-40 h-16 bg-card border-b border-border">
      <div className="container-narrow h-full flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary-dark"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-primary-light text-primary-dark font-semibold px-3 py-1.5"
                aria-label="Open user menu"
                aria-expanded={menuOpen}
              >
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  {initials}
                </span>
                <ChevronDown size={14} aria-hidden />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 card-soft p-2 shadow-lg z-50">
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md hover:bg-primary-light text-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-3 py-2 rounded-md hover:bg-primary-light text-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left block px-3 py-2 rounded-md hover:bg-primary-light text-sm text-destructive"
                    >
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !py-2 !px-4 text-sm">Log In</Link>
              <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">Sign Up</Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-md hover:bg-primary-light"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-card flex flex-col">
          <div className="h-16 px-4 flex items-center justify-between border-b border-border">
            <Logo />
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 rounded-md hover:bg-primary-light">
              <X size={22} />
            </button>
          </div>
          <nav className="flex-1 p-6 flex flex-col gap-2" aria-label="Mobile">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-base font-medium ${
                    isActive ? "bg-primary-light text-primary-dark" : "text-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <>
                <NavLink to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-base font-medium text-foreground">My Profile</NavLink>
                <NavLink to="/settings" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-base font-medium text-foreground">Settings</NavLink>
              </>
            )}
          </nav>
          <div className="p-6 border-t border-border">
            {isAuthenticated ? (
              <button onClick={handleSignOut} className="btn-ghost w-full">Log Out</button>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="btn-ghost flex-1" onClick={() => setMobileOpen(false)}>Log In</Link>
                <Link to="/register" className="btn-primary flex-1" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
