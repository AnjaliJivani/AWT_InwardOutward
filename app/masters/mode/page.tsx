"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    History,
    X,
    AlertTriangle
} from "lucide-react";

// Data fetching and states
const useModes = () => {
    const [modes, setModes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchModes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/masters/mode?t=${Date.now()}`, { cache: "no-store" });

            if (!res.ok) {
                console.error("Fetch failed:", res.status, res.statusText);
                setModes([]);
                return;
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setModes(data);
            } else {
                console.error("Invalid data format:", data);
                setModes([]);
            }
        } catch (err) {
            console.error(err);
            setModes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModes();
    }, []);

    return { modes, loading, fetchModes, setModes };
};

export default function ModeMaster() {
    const router = useRouter();
    const { modes, loading, fetchModes, setModes } = useModes();
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        InOutwardModeName: "",
        IsActive: true,
        Sequence: "1",
        Remarks: ""
    });

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ id: number | number[], name: string } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const role = globalThis.localStorage?.getItem("userRole");
        const storedId = globalThis.localStorage?.getItem("userId");
        if (storedId) setUserId(parseInt(storedId));

        const userRole = role?.toLowerCase().replace(/\s+/g, '');
        if (userRole !== "admin" && userRole !== "superadmin") {
            router.push("/dashboard");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = "/api/masters/mode";
            const method = editingId ? "PUT" : "POST";
            const payload = editingId ? { ...formData, id: editingId } : { ...formData, UserID: userId };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                setShowForm(false);
                setEditingId(null);

                // Immediate UI Update
                if (editingId) {
                    setModes(prev => prev.map(m => m.InOutwardModeID === data.InOutwardModeID ? data : m));
                } else {
                    setModes(prev => [data, ...prev]);
                }

                window.dispatchEvent(new Event("profile-updated"));
                setFormData({
                    InOutwardModeName: "",
                    IsActive: true,
                    Sequence: "1",
                    Remarks: ""
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (mode: any) => {
        setEditingId(mode.InOutwardModeID);
        setFormData({
            InOutwardModeName: mode.InOutwardModeName,
            IsActive: mode.IsActive,
            Sequence: mode.Sequence.toString(),
            Remarks: mode.Remarks || ""
        });
        setShowForm(true);
    };

    const handleReload = async () => {
        setIsRefreshing(true);
        await fetchModes();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleDelete = (id: number | number[], name: string) => {
        setDeletingItem({ id, name });
        setShowDeleteModal(true);
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingItem(null);
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;
        setSubmitting(true);
        try {
            const isBulk = Array.isArray(deletingItem.id);
            const url = isBulk
                ? `/api/masters/mode?ids=${(deletingItem.id as number[]).join(',')}`
                : `/api/masters/mode?id=${deletingItem.id}`;

            const res = await fetch(url, {
                method: "DELETE",
            });
            if (res.ok) {
                setShowDeleteModal(false);
                setDeletingItem(null);
                setSelectedIds([]);
                setIsSelectionMode(false);
                fetchModes();
                window.dispatchEvent(new Event("profile-updated"));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredModes.map(m => m.InOutwardModeID));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredModes = modes.filter(mode =>
        mode.InOutwardModeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-10 space-y-8 font-sans">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <ExternalLink size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Master Directory</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Mode Master</h1>
                    <p className="text-slate-400 mt-2 font-medium">Define transfer modes for your documents and parcels.</p>
                </div>
                <div className="flex gap-3">
                    {!isSelectionMode ? (
                        <>
                            <button
                                onClick={handleReload}
                                className={`p-3 border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-slate-300 ${isRefreshing ? 'text-cyan-400 border-cyan-500/30 text-cyan-100 bg-cyan-500/10' : ''}`}
                                disabled={loading || isRefreshing}
                                title="Refresh Data"
                            >
                                <History size={20} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="p-3 border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-slate-300 group"
                                title="Bulk Delete Mode"
                            >
                                <Trash2 size={20} className="group-hover:text-rose-500 transition-colors" />
                            </button>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({
                                        InOutwardModeName: "",
                                        IsActive: true,
                                        Sequence: "1",
                                        Remarks: ""
                                    });
                                    setShowForm(true);
                                }}
                                className="glow-button flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5"
                            >
                                <Plus size={20} />
                                Add Mode
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setIsSelectionMode(false);
                                    setSelectedIds([]);
                                }}
                                className="px-6 py-3.5 border border-white/10 rounded-2xl font-bold text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2"
                            >
                                <X size={20} />
                                Exit Selection
                            </button>
                            <button
                                onClick={() => handleDelete(selectedIds, `${selectedIds.length} selected modes`)}
                                disabled={selectedIds.length === 0}
                                className="flex items-center gap-2 px-6 py-3.5 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 disabled:opacity-50 disabled:shadow-none"
                            >
                                <Trash2 size={20} />
                                Delete ({selectedIds.length})
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search modes..."
                            className="neon-input py-2.5 pl-12 text-sm w-80 bg-slate-900/40 backdrop-blur-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5">
                                {isSelectionMode && (
                                    <th className="px-8 py-5 text-xs text-center w-12">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-cyan-400 focus:ring-blue-500"
                                            checked={filteredModes.length > 0 && selectedIds.length === filteredModes.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Mode Name</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Sequence</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Remarks</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center text-slate-400">Loading modes...</td>
                                </tr>
                            ) : modes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center text-slate-400">No modes found.</td>
                                </tr>
                            ) : filteredModes.map((mode) => (
                                <tr key={mode.InOutwardModeID} className={`hover:bg-white/[0.02] transition-colors group ${selectedIds.includes(mode.InOutwardModeID) ? 'bg-cyan-500/20/30' : ''}`}>
                                    {isSelectionMode && (
                                        <td className="px-8 py-6 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-cyan-400 focus:ring-blue-500"
                                                checked={selectedIds.includes(mode.InOutwardModeID)}
                                                onChange={() => handleSelectRow(mode.InOutwardModeID)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-slate-200">
                                                <ExternalLink size={20} />
                                            </div>
                                            <span className="font-bold text-white">{mode.InOutwardModeName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex justify-center">
                                            {mode.IsActive ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                                                    <CheckCircle2 size={12} />
                                                    Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                                                    <XCircle size={12} />
                                                    Inactive
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center text-sm font-bold text-slate-400">{mode.Sequence}</td>
                                    <td className="px-8 py-6 text-sm text-slate-400 font-medium max-w-xs truncate">{mode.Remarks}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(mode)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-900/40 backdrop-blur-sm rounded-lg transition-all border border-transparent hover:border-white/10 shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(mode.InOutwardModeID, mode.InOutwardModeName)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/20 rounded-lg transition-all border border-transparent hover:border-rose-500/30 shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/5/20 text-sm font-medium text-slate-400">
                    <p className="text-[10px] font-bold uppercase tracking-widest">Showing {filteredModes.length} of {modes.length} modes</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-white disabled:opacity-30" disabled>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white disabled:opacity-30" disabled>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900/40 backdrop-blur-sm w-full max-w-xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-bold text-white">{editingId ? "Edit Mode" : "Add New Mode"}</h2>
                                <p className="text-sm text-slate-400 mt-1">{editingId ? "Modify the existing mode details." : "Fill in the mode registration details below."}</p>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-900/40 backdrop-blur-sm hover:shadow-sm border border-transparent hover:border-white/10 text-slate-400 hover:text-white transition-all font-bold text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-200 mb-2">Mode Name</label>
                                    <input
                                        type="text"
                                        className="neon-input"
                                        placeholder="e.g. Courier"
                                        value={formData.InOutwardModeName}
                                        onChange={(e) => setFormData({ ...formData, InOutwardModeName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-200 mb-2">Sequence</label>
                                    <input
                                        type="number"
                                        className="neon-input"
                                        placeholder="1"
                                        value={formData.Sequence}
                                        onChange={(e) => setFormData({ ...formData, Sequence: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-200 mb-2">Status</label>
                                    <select
                                        className="neon-input"
                                        value={formData.IsActive ? "Active" : "Inactive"}
                                        onChange={(e) => setFormData({ ...formData, IsActive: e.target.value === "Active" })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-200 mb-2">Remarks</label>
                                    <textarea
                                        className="neon-input min-h-[100px]"
                                        placeholder="Add any details..."
                                        value={formData.Remarks}
                                        onChange={(e) => setFormData({ ...formData, Remarks: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3.5 rounded-2xl border border-white/10 font-bold text-slate-300 hover:bg-white/5">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50"
                                >
                                    {submitting ? "Saving..." : "Save Mode"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900/40 backdrop-blur-sm w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {Array.isArray(deletingItem?.id) ? "Delete Multiple Modes?" : "Delete Mode Master?"}
                            </h2>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                This action cannot be undone. Are you sure you want to remove <span className="font-bold text-white">"{deletingItem?.name}"</span> from your records?
                            </p>
                            <div className="flex w-full gap-4">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 py-4 rounded-2xl border border-white/10 font-bold text-slate-300 hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={submitting}
                                    className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all disabled:opacity-50"
                                >
                                    {submitting ? "Deleting..." : "Delete Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
