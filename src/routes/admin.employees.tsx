import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, UserCheck, Check, X, UserPlus, Edit3, Briefcase, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { employees as initialEmployees, type Employee } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/employees")({ component: EmployeesPage });

function EmployeesPage() {
  const [employeeList, setEmployeeList] = useState<Employee[]>(initialEmployees);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dept, setDept] = useState("Flight Operations");
  const [shift, setShift] = useState("Morning (06:00–14:00)");
  const [cert, setCert] = useState("ATPL / Type A350");
  const [status, setStatus] = useState<"on-duty" | "off-duty" | "standby">("on-duty");
  const [hours, setHours] = useState(38);
  const [leave, setLeave] = useState(18);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Employee name is required.");
      return;
    }

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name: name.trim(),
      dept,
      shift,
      hours: Number(hours) || 40,
      status,
      cert,
      leave: Number(leave) || 20,
    };

    setEmployeeList((prev) => [newEmp, ...prev]);
    setIsAddOpen(false);
    setName("");
    toast.success(`Staff member ${newEmp.name} registered into active roster!`, {
      description: `${newEmp.dept} · Status: ${newEmp.status}`,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    setEmployeeList((prev) =>
      prev.map((emp) => (emp.id === editingEmp.id ? { ...editingEmp } : emp))
    );
    toast.success(`Updated roster record for ${editingEmp.name}.`);
    setEditingEmp(null);
  };

  const handleToggleStatus = (id: string, current: string) => {
    const next: "on-duty" | "off-duty" | "standby" =
      current === "on-duty" ? "off-duty" : current === "off-duty" ? "standby" : "on-duty";

    setEmployeeList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: next } : e))
    );
    toast.info(`Status shifted to ${next}.`);
  };

  return (
    <>
      <AdminTopbar
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Employees" }]}
        action={{
          label: "New Employee",
          onClick: () => setIsAddOpen(true),
        }}
      />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Employee management</h1>
            <p className="text-sm text-muted-foreground">Pilots, cabin crew, ground staff, ops controllers, and support specialists.</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" /> New employee
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Shift</th>
                <th className="px-4 py-2.5">Duty hours</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Certification</th>
                <th className="px-4 py-2.5">Leave balance</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeeList.map((e) => (
                <tr key={e.id} className="border-t border-border/60 hover:bg-muted/30 transition">
                  <td className="px-4 py-2.5 font-semibold text-sky-dark dark:text-sky-300">{e.name}</td>
                  <td className="px-4 py-2.5 text-xs">{e.dept}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{e.shift}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{e.hours}h / wk</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => handleToggleStatus(e.id, e.status)}
                      title="Click to rotate duty status"
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize border transition cursor-pointer hover:opacity-80 ${
                        e.status === "on-duty" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" :
                        e.status === "off-duty" ? "bg-muted text-muted-foreground border-border" :
                        "bg-amber-500/15 text-amber-500 border-amber-500/30"
                      }`}
                    >
                      {e.status}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{e.cert}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{e.leave} days</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setEditingEmp({ ...e })}
                      className="rounded border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* New Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Onboard Staff Member</h2>
                  <p className="text-xs text-muted-foreground">Assign department, shifts, and license</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Full Legal Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Capt. James Wilson"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Flight Operations">Flight Operations</option>
                    <option value="Cabin Services">Cabin Services</option>
                    <option value="Ground & Ramp Ops">Ground & Ramp Ops</option>
                    <option value="Avionics Maintenance">Avionics Maintenance</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Shift Pattern</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Morning (06:00–14:00)">Morning (06:00–14:00)</option>
                    <option value="Evening (14:00–22:00)">Evening (14:00–22:00)</option>
                    <option value="Night (22:00–06:00)">Night (22:00–06:00)</option>
                    <option value="Rotating Long-Haul">Rotating Long-Haul</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Cert / Rating</label>
                  <input
                    value={cert}
                    onChange={(e) => setCert(e.target.value)}
                    placeholder="e.g. ATPL / A350"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent capitalize"
                  >
                    <option value="on-duty">On-Duty</option>
                    <option value="standby">Standby</option>
                    <option value="off-duty">Off-Duty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Weekly Duty Hours</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Annual Leave Days</label>
                  <input
                    type="number"
                    value={leave}
                    onChange={(e) => setLeave(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Edit Staff Record</h2>
                  <p className="text-xs text-muted-foreground">{editingEmp.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Name</label>
                <input
                  value={editingEmp.name}
                  onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Department</label>
                  <input
                    value={editingEmp.dept}
                    onChange={(e) => setEditingEmp({ ...editingEmp, dept: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Shift</label>
                  <input
                    value={editingEmp.shift}
                    onChange={(e) => setEditingEmp({ ...editingEmp, shift: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Certification</label>
                  <input
                    value={editingEmp.cert}
                    onChange={(e) => setEditingEmp({ ...editingEmp, cert: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Status</label>
                  <select
                    value={editingEmp.status}
                    onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent capitalize"
                  >
                    <option value="on-duty">On-Duty</option>
                    <option value="standby">Standby</option>
                    <option value="off-duty">Off-Duty</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

