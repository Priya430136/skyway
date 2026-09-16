import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, MoreHorizontal, UserPlus, Shield, Mail, Key, Edit2, Trash2, Ban, CheckCircle, X, Check } from "lucide-react";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { users as initialUsers, type AdminUser, type AdminRole, type UserStatus } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

const roleBadge: Record<AdminRole, string> = {
  admin: "bg-purple-500/15 text-purple-500 border border-purple-500/30",
  ops: "bg-sky-accent/15 text-sky-accent border border-sky-500/30",
  support: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
  passenger: "bg-muted text-muted-foreground border border-border",
};

const statusBadge: Record<UserStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
  suspended: "bg-red-500/15 text-red-500 border border-red-500/30",
  pending: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
};

function UsersPage() {
  const [userList, setUserList] = useState<AdminUser[]>(initialUsers);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");

  // Modal states
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Form states for New User
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState<AdminRole>("passenger");
  const [userStatus, setUserStatus] = useState<UserStatus>("active");
  const [tempPassword, setTempPassword] = useState("SkyWay2026!");

  const rows = useMemo(() => userList.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (q && !u.name.toLowerCase().includes(q.toLowerCase()) && !u.email.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [userList, q, roleFilter, statusFilter]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please provide both name and email address.");
      return;
    }

    const newUser: AdminUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: userRole,
      status: userStatus,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setUserList((prev) => [newUser, ...prev]);
    setIsNewUserOpen(false);
    setName("");
    setEmail("");
    toast.success(`Account for ${newUser.name} created!`, {
      description: `Assigned role: ${newUser.role.toUpperCase()} · Status: ${newUser.status}`,
    });
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUserList((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...editingUser } : u))
    );
    toast.success(`User ${editingUser.name} updated successfully!`);
    setEditingUser(null);
  };

  const handleToggleStatus = (targetUser: AdminUser) => {
    const nextStatus: UserStatus = targetUser.status === "active" ? "suspended" : "active";
    setUserList((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u))
    );
    setActiveMenuUserId(null);
    if (nextStatus === "suspended") {
      toast.warning(`Account for ${targetUser.name} suspended.`, {
        description: "User cannot authenticate until re-activated.",
      });
    } else {
      toast.success(`Account for ${targetUser.name} activated.`);
    }
  };

  const handleDeleteUser = (id: string, userName: string) => {
    setUserList((prev) => prev.filter((u) => u.id !== id));
    setActiveMenuUserId(null);
    toast.info(`Account ${userName} deleted from the directory.`);
  };

  const handleResetPassword = (userName: string) => {
    setActiveMenuUserId(null);
    toast.success(`Password reset token dispatched to ${userName}.`);
  };

  return (
    <>
      <AdminTopbar
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Users" }]}
        action={{
          label: "Add User",
          onClick: () => setIsNewUserOpen(true),
        }}
      />
      <main className="flex-1 space-y-5 p-6" onClick={() => setActiveMenuUserId(null)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">User management</h1>
            <p className="text-sm text-muted-foreground">Create, edit, suspend, and assign roles across the platform.</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsNewUserOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" /> New user
          </button>
        </div>

        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-accent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AdminRole | "all")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-sky-accent"
          >
            <option value="all">All roles ({userList.length})</option>
            <option value="admin">Administrator</option>
            <option value="ops">Operations</option>
            <option value="support">Support</option>
            <option value="passenger">Passenger</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-sky-accent"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last login</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-border/60 hover:bg-muted/30 transition">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-dark text-[11px] font-semibold text-sky-gold shrink-0">
                        {u.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${roleBadge[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusBadge[u.status]}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(u.lastLogin).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5 text-right relative">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUser({ ...u });
                        }}
                        className="rounded border border-border px-2 py-1 text-xs hover:bg-muted font-medium transition"
                      >
                        Edit
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id);
                          }}
                          className="rounded-md p-1.5 hover:bg-muted"
                          aria-label="Row actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {activeMenuUserId === u.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-border bg-card shadow-xl p-1.5 text-xs text-left animate-in fade-in"
                          >
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-muted transition"
                            >
                              {u.status === "active" ? (
                                <>
                                  <Ban className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Suspend User</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Activate User</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleResetPassword(u.name)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-muted transition"
                            >
                              <Key className="h-3.5 w-3.5 text-sky-500" />
                              <span>Reset Password</span>
                            </button>
                            <div className="my-1 border-t border-border" />
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-600 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete User</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No users match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* New User Modal */}
      {isNewUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Create New User</h2>
                  <p className="text-xs text-muted-foreground">Add user credentials and access permissions</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewUserOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Full Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Captain Liam Gallagher"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. liam.gallagher@skyway.io"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Portal Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as AdminRole)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="passenger">Passenger</option>
                    <option value="ops">Operations (OCC)</option>
                    <option value="support">Support Agent</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Account Status</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as UserStatus)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending Invite</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Temporary Access Password</label>
                <input
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono outline-none focus:border-sky-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewUserOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Edit User Profile</h2>
                  <p className="text-xs text-muted-foreground">{editingUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Full Name *</label>
                <input
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as AdminRole })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="passenger">Passenger</option>
                    <option value="ops">Operations (OCC)</option>
                    <option value="support">Support Agent</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

