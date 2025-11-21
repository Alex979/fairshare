'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Camera, Upload, Users, Calculator, PieChart, DollarSign, RefreshCw, ChevronDown, ChevronUp, AlertCircle, List, Receipt, ExternalLink, Moon, Sun, Plus, Pencil, Trash2, X } from 'lucide-react';
import { BillData, CalculatedTotals, CalculatedUserTotal, LineItem } from '../types';
import { processReceiptAction } from '../actions';

const MOCK_DATA: BillData = {
  meta: { currency: "USD", notes: "Generated example" },
  participants: [
    { id: "p1", name: "Alex" },
    { id: "p2", name: "Sam" },
    { id: "p3", name: "Jordan" }
  ],
  line_items: [
    { id: "i1", description: "Shared Appetizer Platter", quantity: 1, unit_price: 18.00, total_price: 18.00, category: "food" },
    { id: "i2", description: "Alex's Burger", quantity: 1, unit_price: 16.50, total_price: 16.50, category: "food" },
    { id: "i3", description: "Pitcher of Beer", quantity: 1, unit_price: 24.00, total_price: 24.00, category: "alcohol" }
  ],
  split_logic: [
    { item_id: "i1", method: "equal", allocations: [{ participant_id: "p1", weight: 1 }, { participant_id: "p2", weight: 1 }, { participant_id: "p3", weight: 1 }] },
    { item_id: "i2", method: "explicit", allocations: [{ participant_id: "p1", weight: 1 }] },
    { item_id: "i3", method: "ratio", allocations: [{ participant_id: "p2", weight: 2 }, { participant_id: "p3", weight: 1 }] } 
  ],
  modifiers: {
    tax: { source: "receipt", type: "fixed", value: 5.85 },
    tip: { source: "user_prompt", type: "percentage", value: 20 },
    fees: []
  }
};

export default function BillSplitter() {
  const [step, setStep] = useState<'input' | 'processing' | 'editor'>('input'); 
  const [mobileTab, setMobileTab] = useState<'editor' | 'results'>('editor');
  const [image, setImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [data, setData] = useState<BillData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingItem, setEditingItem] = useState<Partial<import('../types').LineItem> | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // --- DARK MODE INIT ---
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // --- CALCULATOR LOGIC ---
  const calculatedTotals = useMemo<CalculatedTotals | null>(() => {
    if (!data) return null;

    const totals: Record<string, CalculatedUserTotal> = {};
    let subtotal = 0;
    
    data.participants.forEach(p => {
      totals[p.id] = { name: p.name, base_amount: 0, tax_share: 0, tip_share: 0, total: 0, items: [] };
    });
    totals['unassigned'] = { name: 'Unassigned', base_amount: 0, tax_share: 0, tip_share: 0, total: 0, items: [] };

    data.line_items.forEach(item => {
      subtotal += item.total_price;
      const logic = data.split_logic.find(l => l.item_id === item.id);
      const allocs = logic ? logic.allocations : [];
      
      if (!allocs || allocs.length === 0) {
        totals['unassigned'].base_amount += item.total_price;
        totals['unassigned'].items.push({ description: item.description, total_price: item.total_price, share: 1 });
        return;
      }

      const totalWeight = allocs.reduce((sum, a) => sum + a.weight, 0);
      
      allocs.forEach(alloc => {
        if (totals[alloc.participant_id]) {
          const shareFraction = alloc.weight / totalWeight;
          const costShare = item.total_price * shareFraction;
          totals[alloc.participant_id].base_amount += costShare;
          totals[alloc.participant_id].items.push({ description: item.description, total_price: item.total_price, share: shareFraction });
        }
      });
    });

    const getModValue = (mod: any, basis: number) => {
      if (!mod) return 0;
      return mod.type === 'percentage' ? (basis * (mod.value / 100)) : mod.value;
    };

    const totalTax = getModValue(data.modifiers.tax, subtotal);
    const totalTip = getModValue(data.modifiers.tip, subtotal);

    Object.keys(totals).forEach(pid => {
      const userShareOfSubtotal = subtotal > 0 ? (totals[pid].base_amount / subtotal) : 0;
      totals[pid].tax_share = totalTax * userShareOfSubtotal;
      totals[pid].tip_share = totalTip * userShareOfSubtotal;
      totals[pid].total = totals[pid].base_amount + totals[pid].tax_share + totals[pid].tip_share;
    });

    return {
      subtotal,
      totalTax,
      totalTip,
      grandTotal: subtotal + totalTax + totalTip,
      byUser: totals
    };
  }, [data]);

  // --- HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingItem({ description: "", total_price: 0, quantity: 1, category: "custom" });
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: LineItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem({ ...item });
    setIsItemModalOpen(true);
  };

  const saveItem = () => {
    if (!editingItem || !editingItem.description) return;

    setData(prev => {
      if (!prev) return null;
      const newItem: LineItem = {
        id: editingItem.id || `item-${Date.now()}`,
        description: editingItem.description || "Item",
        quantity: editingItem.quantity || 1,
        unit_price: editingItem.total_price || 0,
        total_price: editingItem.total_price || 0,
        category: editingItem.category || "custom"
      };

      if (editingItem.id) {
        return {
          ...prev,
          line_items: prev.line_items.map(i => i.id === editingItem.id ? newItem : i)
        };
      } else {
        return {
          ...prev,
          line_items: [...prev.line_items, newItem]
        };
      }
    });
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const deleteItem = () => {
    if (!editingItem?.id) return;
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        line_items: prev.line_items.filter(i => i.id !== editingItem.id),
        split_logic: prev.split_logic.filter(l => l.item_id !== editingItem.id)
      };
    });
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const processReceipt = async () => {
    if (!image && !promptText) return;
    setStep('processing');
    setError(null);

    try {
        const base64Data = image ? image.split(',')[1] : ""; // Handle case if image is missing but prompt exists (though logic prevents this mostly)
        
        // Call Server Action
        const parsedData = await processReceiptAction(base64Data, promptText);
        
        // Ensure IDs exist
        parsedData.participants = parsedData.participants.map((p: any, i: number) => ({...p, id: p.id || `p${i}`}));
        parsedData.line_items = parsedData.line_items.map((item: any, i: number) => ({...item, id: item.id || `item${i}`}));
        
        setData(parsedData);
        setStep('editor');
    } catch (err: any) {
        console.error(err);
        setError("Failed to process. " + err.message);
        setStep('input');
    }
  };

  const handleLoadMock = () => {
    setData(MOCK_DATA);
    setStep('editor');
  };

  const updateItemSplit = (itemId: string, participantId: string, newWeight: number) => {
    setData(prev => {
      if (!prev) return null;
      const newData = { ...prev };
      // Clone split_logic to avoid mutation
      newData.split_logic = [...prev.split_logic];
      
      const logicIndex = newData.split_logic.findIndex(l => l.item_id === itemId);
      
      if (logicIndex === -1) {
        newData.split_logic.push({ item_id: itemId, method: 'ratio', allocations: [{ participant_id: participantId, weight: newWeight }] });
      } else {
        const logic = { ...newData.split_logic[logicIndex], allocations: [...newData.split_logic[logicIndex].allocations] };
        const allocIndex = logic.allocations.findIndex(a => a.participant_id === participantId);
        
        if (allocIndex > -1) {
            if (newWeight <= 0) logic.allocations.splice(allocIndex, 1);
            else logic.allocations[allocIndex] = { ...logic.allocations[allocIndex], weight: newWeight };
        } else if (newWeight > 0) {
            logic.allocations.push({ participant_id: participantId, weight: newWeight });
        }
        newData.split_logic[logicIndex] = logic;
      }
      return newData;
    });
  };

  const updateModifier = (key: 'tax' | 'tip', field: string, value: any) => {
    setData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            modifiers: { ...prev.modifiers, [key]: { ...prev.modifiers[key], [field]: value } }
        };
    });
  };

  const updateParticipantName = (id: string, name: string) => {
    setData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            participants: prev.participants.map(p => p.id === id ? { ...p, name } : p)
        };
    });
  };

  const addParticipant = () => {
    setData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            participants: [...prev.participants, { id: `p${Date.now()}`, name: "New Person" }]
        };
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: data?.meta?.currency || 'USD' }).format(amount);
  };

  const generateVenmoLink = (user: CalculatedUserTotal) => {
    const amount = user.total.toFixed(2);
    let note = `FairShare: ${user.items.map(i => i.description).join(', ')}`;
    if (note.length > 150) note = note.substring(0, 147) + "..."; 
    return `venmo://paycharge?txn=charge&amount=${amount}&note=${encodeURIComponent(note)}`;
  };

  // --- RENDERERS ---

  if (step === 'processing') {
    return (
      <div className={isDarkMode ? "dark" : ""}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 transition-colors duration-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Reading receipt...</h2>
        </div>
      </div>
    );
  }

  if (step === 'editor' && data) {
    return (
      <div className={isDarkMode ? "dark" : ""}>
        <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-200">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex justify-between items-center shadow-sm z-20 shrink-0">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                <Calculator className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-800 dark:text-white">FairShare</h1>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={toggleDarkMode} className="text-gray-500 dark:text-gray-400 hover:text-blue-600">
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={() => setStep('input')} className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Start Over
                </button>
            </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
            
            {/* LEFT PANEL: EDITOR */}
            <div className={`flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 h-full overflow-hidden ${mobileTab === 'results' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 lg:pb-4">
                
                {/* Participants */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 transition-colors duration-200">
                    <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Participants
                    </h2>
                    <button onClick={addParticipant} className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded">
                        + Add Person
                    </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                    {data.participants.map(p => (
                        <div key={p.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 border dark:border-gray-600 rounded-lg px-2 py-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            {p.name.charAt(0)}
                        </div>
                        {/* Fixed to 16px to prevent zoom */}
                        <input 
                            value={p.name}
                            onChange={(e) => updateParticipantName(p.id, e.target.value)}
                            className="bg-transparent border-none text-base font-medium text-gray-700 dark:text-gray-200 focus:ring-0 w-20 p-0 placeholder-gray-400 outline-none"
                        />
                        </div>
                    ))}
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Line Items</h2>
                        <button onClick={openAddModal} className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                    </div>
                    {data.line_items.map(item => {
                    const logic = data.split_logic.find(l => l.item_id === item.id);
                    const isExpanded = activeItemId === item.id;
                    return (
                        <div key={item.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all ${isExpanded ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="p-4 cursor-pointer flex justify-between items-center" onClick={() => setActiveItemId(isExpanded ? null : item.id)}>
                            <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{item.description}</span>
                                <span className="font-bold text-gray-900 dark:text-white text-sm">{formatMoney(item.total_price)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {logic && logic.allocations.length > 0 ? (
                                <div className="flex -space-x-1.5">
                                    {logic.allocations.map(a => {
                                    const person = data.participants.find(p => p.id === a.participant_id);
                                    return person ? (
                                        <div key={a.participant_id} className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-600 border border-white dark:border-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-200">
                                        {person.name.charAt(0)}
                                        </div>
                                    ) : null;
                                    })}
                                </div>
                                ) : (
                                <span className="text-[10px] text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">Unassigned</span>
                                )}
                            </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => openEditModal(item, e)} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Pencil className="w-3 h-3" />
                                </button>
                                {isExpanded ? <ChevronUp className="text-gray-400 w-4 h-4" /> : <ChevronDown className="text-gray-400 w-4 h-4" />}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-b-xl">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-3">Assign Shares</p>
                            <div className="grid grid-cols-1 gap-2">
                                {data.participants.map(p => {
                                const alloc = logic?.allocations.find(a => a.participant_id === p.id);
                                const weight = alloc ? alloc.weight : 0;

                                return (
                                    <div key={p.id} className={`flex items-center justify-between p-2 rounded border ${weight > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-200">{p.name.charAt(0)}</div>
                                        <span className={`text-sm ${weight > 0 ? 'text-blue-800 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700" onClick={() => updateItemSplit(item.id, p.id, Math.max(0, weight - 0.5))}>-</button>
                                        <span className="w-6 text-center font-mono text-sm font-bold dark:text-gray-200">{weight}</span>
                                        <button className="w-6 h-6 rounded hover:bg-blue-200 dark:hover:bg-blue-800 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center" onClick={() => updateItemSplit(item.id, p.id, weight + (weight === 0 ? 1 : 0.5))}>+</button>
                                    </div>
                                    </div>
                                );
                                })}
                            </div>
                            </div>
                        )}
                        </div>
                    );
                    })}
                </div>

                {/* Modifiers */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-4 mb-8">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4" /> Tax & Tip
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Tax ($)</label>
                        {/* Fixed to 16px */}
                        <input 
                        type="number"
                        value={data.modifiers.tax.value}
                        onChange={(e) => updateModifier('tax', 'value', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border dark:border-gray-600 rounded text-right font-mono text-base dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Tip</label>
                        <div className="flex">
                        <select 
                            value={data.modifiers.tip.type}
                            onChange={(e) => updateModifier('tip', 'type', e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border-y border-l dark:border-gray-600 rounded-l text-xs px-1 dark:text-white"
                        >
                            <option value="percentage">%</option>
                            <option value="fixed">$</option>
                        </select>
                        {/* Fixed to 16px */}
                        <input 
                            type="number"
                            value={data.modifiers.tip.value}
                            onChange={(e) => updateModifier('tip', 'value', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border dark:border-gray-600 rounded-r text-right font-mono text-base dark:bg-gray-700 dark:text-white"
                        />
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>

            {/* RIGHT PANEL: RESULTS */}
            <div className={`lg:w-96 bg-white dark:bg-gray-800 shadow-xl flex-col h-full z-20 ${mobileTab === 'results' ? 'flex w-full' : 'hidden lg:flex'}`}>
                <div className="p-4 bg-gray-900 dark:bg-black text-white shrink-0">
                <h2 className="text-lg font-bold mb-1">Final Breakdown</h2>
                <p className="text-gray-400 text-xs">Request money via Venmo</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 lg:pb-4">
                {Object.values(calculatedTotals?.byUser || {})
                    .filter(u => u.name !== 'Unassigned' || u.total > 0)
                    .map((user, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${user.name === 'Unassigned' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className={`font-bold text-base truncate max-w-[120px] ${user.name === 'Unassigned' ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>{user.name}</h3>
                        <span className="font-bold text-xl text-gray-900 dark:text-white">{formatMoney(user.total)}</span>
                    </div>
                    
                    {/* Venmo Button */}
                    {user.name !== 'Unassigned' && (
                        <a 
                        href={generateVenmoLink(user)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-4 w-full bg-[#008CFF] hover:bg-[#0077D9] text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-sm"
                        >
                        <span className="uppercase tracking-wide">Request</span>
                        <ExternalLink className="w-4 h-4" />
                        </a>
                    )}

                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex justify-between"><span>Base</span><span>{formatMoney(user.base_amount)}</span></div>
                        <div className="flex justify-between"><span>Tax</span><span>{formatMoney(user.tax_share)}</span></div>
                        <div className="flex justify-between"><span>Tip</span><span>{formatMoney(user.tip_share)}</span></div>
                    </div>

                    {user.items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <button 
                            className="text-[10px] text-gray-400 font-bold uppercase mb-1 w-full text-left flex justify-between items-center hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={(e) => {
                            const list = (e.currentTarget.nextSibling as HTMLElement);
                            if (list) list.classList.toggle('hidden');
                            }}
                        >
                            <span>{user.items.length} Items</span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        <ul className="space-y-1 hidden">
                            {user.items.map((item, i) => (
                            <li key={i} className="text-[10px] flex justify-between text-gray-600 dark:text-gray-400">
                                <span className="truncate pr-2">{item.description}</span>
                                <span className="whitespace-nowrap">{formatMoney(item.total_price * item.share)}</span>
                            </li>
                            ))}
                        </ul>
                        </div>
                    )}
                    </div>
                ))}
                </div>

                {/* Grand Total Footer */}
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 mb-16 lg:mb-0">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Subtotal</span>
                    <span>{formatMoney(calculatedTotals?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Tax + Tip</span>
                    <span>{formatMoney((calculatedTotals?.totalTax || 0) + (calculatedTotals?.totalTip || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white mt-2">
                    <span>Total</span>
                    <span>{formatMoney(calculatedTotals?.grandTotal || 0)}</span>
                </div>
                </div>
            </div>

            {/* MOBILE BOTTOM TAB NAVIGATION */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
                <button 
                onClick={() => setMobileTab('editor')}
                className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${mobileTab === 'editor' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-400'}`}
                >
                <List className="w-5 h-5" />
                Edit Split
                </button>
                <button 
                onClick={() => setMobileTab('results')}
                className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${mobileTab === 'results' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-400'}`}
                >
                <div className="relative">
                    <Receipt className="w-5 h-5" />
                    {(calculatedTotals?.byUser?.unassigned?.total ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                    )}
                </div>
                Final Bill
                </button>
            </div>
            </div>
        </div>

        {/* ITEM MODAL */}
        {isItemModalOpen && editingItem && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4 border dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{editingItem.id ? 'Edit Item' : 'Add Item'}</h3>
                        <button onClick={() => setIsItemModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                        <input 
                            value={editingItem.description}
                            onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                            className="w-full border dark:border-gray-600 rounded-lg p-2 text-base dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Item name"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Price ($)</label>
                        <input 
                            type="number"
                            value={editingItem.total_price}
                            onChange={(e) => setEditingItem({...editingItem, total_price: parseFloat(e.target.value) || 0})}
                            className="w-full border dark:border-gray-600 rounded-lg p-2 text-base dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        {editingItem.id && (
                            <button 
                                onClick={deleteItem}
                                className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        )}
                        <button 
                            onClick={saveItem}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- INPUT STEP RENDER ---
  return (
    <div className={isDarkMode ? "dark" : ""}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-200">
        
        <button onClick={toggleDarkMode} className="hidden sm:block absolute top-6 right-6 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-gray-700 dark:text-white">
             {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
            <div className="relative bg-blue-600 dark:bg-blue-700 p-6 text-center transition-colors duration-200">
            <button onClick={toggleDarkMode} className="sm:hidden absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white">
                 {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <PieChart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">FairShare</h1>
            <p className="text-blue-100 text-sm">Snap a receipt, explain the split, done.</p>
            </div>

            <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Upload Receipt</label>
                <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl h-40 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-colors cursor-pointer overflow-hidden relative"
                onClick={() => fileInputRef.current?.click()}
                >
                {image ? (
                    <img src={image} alt="Receipt" className="w-full h-full object-cover" />
                ) : (
                    <>
                    <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tap to upload photo</p>
                    </>
                )}
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. How are we splitting?</label>
                {/* Fixed to 16px to prevent zoom */}
                <textarea 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                rows={3}
                placeholder="e.g. 'Alice and Bob shared the apps. Alice had the burger. Add a 20% tip.'"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                ></textarea>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
                </div>
            )}

            <button 
                onClick={processReceipt}
                disabled={!image && !promptText}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                Process Receipt <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </button>

            <button 
                onClick={handleLoadMock}
                className="w-full text-gray-400 dark:text-gray-500 text-xs font-medium hover:text-blue-600 dark:hover:text-blue-400 mt-2"
            >
                Use Example Data (No API Key needed)
            </button>
            </div>
        </div>
        </div>
    </div>
  );
}

