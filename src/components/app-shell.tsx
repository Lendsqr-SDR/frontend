import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/auth/use-auth";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/leads", label: "Leads", icon: Users, exact: false },
  { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock, exact: false },
] as const;

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-5 ${collapsed ? "justify-center px-3" : "px-5"}`}>
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
        L
      </span>
      {!collapsed ? (
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-semibold text-sidebar-foreground">Lendsqr</p>
          <p className="text-[11px] text-sidebar-foreground/60">SDR Tracker</p>
        </div>
      ) : null}
    </div>
  );
}

function NavLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className={`flex flex-col gap-1 ${collapsed ? "px-2" : "px-3"}`}>
      {NAV.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact }}
          title={collapsed ? label : undefined}
          className={`flex items-center rounded-md py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-sidebar-primary ${
            collapsed ? "justify-center px-2" : "gap-3 px-3"
          }`}
        >
          <Icon className="size-4" />
          {!collapsed ? label : null}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { logout } = useLogout();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    await navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex ${
          sidebarCollapsed ? "w-[4.5rem]" : "w-52 xl:w-56"
        }`}
      >
        <Brand collapsed={sidebarCollapsed} />
        <NavLinks collapsed={sidebarCollapsed} />
        <div className={`mt-auto space-y-3 py-4 ${sidebarCollapsed ? "px-2" : "px-5"}`}>
          {user ? (
            <div className={sidebarCollapsed ? "text-center" : undefined}>
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {sidebarCollapsed ? user.name.slice(0, 1).toUpperCase() : user.name}
              </p>
              {!sidebarCollapsed ? (
                <p className="truncate text-[11px] text-sidebar-foreground/50">{user.email}</p>
              ) : null}
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            title={sidebarCollapsed ? "Sign out" : undefined}
            className={`w-full gap-2 text-sidebar-foreground/75 hover:text-sidebar-accent-foreground ${
              sidebarCollapsed ? "justify-center px-0" : "justify-start px-0"
            }`}
            onClick={() => void onLogout()}
          >
            <LogOut className="size-4" />
            {!sidebarCollapsed ? "Sign out" : null}
          </Button>
          {!sidebarCollapsed ? (
            <p className="text-[11px] text-sidebar-foreground/50">Internal sales tool · v1.0</p>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-2 border-b border-border bg-card/95 px-3 py-3 backdrop-blur sm:gap-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 lg:inline-flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[min(18rem,85vw)] border-sidebar-border bg-sidebar p-0"
            >
              <Brand />
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-6 px-5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 px-0 text-sidebar-foreground/75"
                  onClick={() => {
                    setOpen(false);
                    void onLogout();
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">{actions}</div>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-3 sm:p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
