"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  LayoutDashboard,
  Bell,
  CheckSquare,
  Calendar,
  LayoutGrid,
  Package,
  Mail,
  Puzzle,
  Users,
  Settings,
  HelpCircle,
  Archive,
  Forward,
  MoreHorizontal,
  Trash2,
  Paperclip,
  Smile,
  FileText,
  Send,
  ChevronDown,
  Maximize2,
  X,
  File,
  Download,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Email = {
  id: number;
  sender_name: string;
  sender_email: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  body: string;
  preview: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  attachment_name: string | null;
  attachment_size: string | null;
};

export default function EmailClient() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [tab, setTab] = useState<"all" | "unread" | "archive">("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(true);
  const [newMessageMode, setNewMessageMode] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emails?tab=${tab}`);
      const data = await res.json();
      setEmails(data.emails || []);
      if (selectedEmail && !data.emails?.find((e: Email) => e.id === selectedEmail.id)) {
        setSelectedEmail(data.emails?.[0] || null);
      }
      if (!selectedEmail && data.emails?.length) {
        setSelectedEmail(data.emails[0]);
      }
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [tab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_URL}/emails/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      fetchEmails();
      if (selectedEmail?.id === id) {
        setSelectedEmail({ ...selectedEmail, is_read: true });
      }
    } catch {}
  };

  const archiveEmail = async (id: number) => {
    try {
      await fetch(`${API_URL}/emails/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });
      fetchEmails();
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
      }
    } catch {}
  };

  const deleteEmail = async (id: number) => {
    try {
      await fetch(`${API_URL}/emails/${id}`, { method: "DELETE" });
      fetchEmails();
      if (selectedEmail?.id === id) {
        setSelectedEmail(emails.find((e) => e.id !== id) || null);
      }
    } catch {}
  };

  const [newTo, setNewTo] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [emailError, setEmailError] = useState("");

  const isValidEmail = (email: string) => {
    if (!email.trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTo(val);
    if (val.trim() && !isValidEmail(val)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const sendReply = async () => {
    if (sending) return;
    
    if (newMessageMode) {
      if (!newTo.trim() || !replyBody.trim()) {
        alert("Please enter recipient and message");
        return;
      }
      if (!isValidEmail(newTo)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      setSending(true);
      const [recipientName, recipientEmail] = newTo.includes("@")
        ? [newTo.split("@")[0], newTo]
        : [newTo, `${newTo.toLowerCase().replace(/\s/g, ".")}@email.com`];
      try {
        const response = await fetch(`${API_URL}/emails`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender_name: "Richard Brown",
            sender_email: "richard.brown@company.com",
            recipient_name: recipientName,
            recipient_email: recipientEmail,
            subject: newSubject || "(No subject)",
            body: replyBody,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to send email");
        }
        setReplyBody("");
        setNewTo("");
        setNewSubject("");
        setEmailError("");
        setNewMessageMode(false);
        await fetchEmails();
      } catch (error) {
        console.error("Error sending email:", error);
        alert("Failed to send email");
      } finally {
        setSending(false);
      }
    } else {
      if (!selectedEmail || !replyBody.trim()) {
        alert("Please enter a reply message");
        return;
      }
      setSending(true);
      try {
        const response = await fetch(`${API_URL}/emails`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender_name: "Richard Brown",
            sender_email: "richard.brown@company.com",
            recipient_name: selectedEmail.sender_name,
            recipient_email: selectedEmail.sender_email,
            subject: `Re: ${selectedEmail.subject}`,
            body: replyBody,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to send reply");
        }
        const newEmail = await response.json();
        setReplyBody("");
        await fetchEmails();
        if (newEmail?.id) {
          setSelectedEmail(newEmail);
        }
      } catch (error) {
        console.error("Error sending reply:", error);
        alert("Failed to send reply");
      } finally {
        setSending(false);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 86400000;
    const week = 604800000;
    if (diff < day) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diff < week) return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const filteredEmails = searchQuery
    ? emails.filter((e) =>
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emails;

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Left Sidebar */}
      <aside
        className={`flex flex-col bg-gray-100 border-r border-gray-200 transition-all overflow-hidden ${
          sidebarCollapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Fixed top section */}
        <div className="p-4 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded bg-amber-400 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-800 fill-amber-800" />
              </div>
              {!sidebarCollapsed && <span className="font-semibold text-gray-800">Cusana</span>}
            </div>
            {sidebarCollapsed ? (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="ml-auto p-1.5 rounded-lg hover:bg-gray-200"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-gray-600" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="ml-auto p-1.5 rounded-lg hover:bg-gray-200"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="w-full">
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent outline-none text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                  />
                  <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 text-gray-500 text-sm px-3 py-2 rounded-lg hover:bg-gray-200 w-full justify-start"
                >
                  <Search className="w-4 h-4" />
                  <span>Search...</span>
                  <kbd className="text-xs bg-gray-200 px-1.5 py-0.5 rounded ml-auto">⌘K</kbd>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable middle section */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto min-h-0">
            <nav className="px-3 space-y-0.5 py-2">
              {[
                { icon: LayoutDashboard, label: "Dashboard" },
                { icon: Bell, label: "Notifications" },
                { icon: CheckSquare, label: "Tasks" },
                { icon: Calendar, label: "Calendar" },
                { icon: LayoutGrid, label: "Widgets" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-200">
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="px-3 mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Marketing</p>
              {[
                { icon: Package, label: "Product" },
                { icon: Mail, label: "Emails", active: true },
                { icon: Puzzle, label: "Integration" },
                { icon: Users, label: "Contacts" },
              ].map(({ icon: Icon, label, active }) => (
                <button
                  key={label}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg ${
                    active ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="px-3 mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">^ Favorite</p>
              {[
                { label: "Opportunity Stages", color: "bg-red-500" },
                { label: "Key Metrics", color: "bg-green-500" },
                { label: "Product Plan", color: "bg-amber-500" },
              ].map(({ label, color }) => (
                <button key={label} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-200">
                  <span className={`w-2 h-2 rounded-sm ${color}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="px-3 mt-4 pb-4 space-y-0.5">
              <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-200">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-200">
                <HelpCircle className="w-5 h-5" />
                <span>Help & Center</span>
              </button>
            </div>
          </div>
        )}

        {/* Fixed bottom section */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                RB
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">Richard Brown</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
          <h1 className="text-lg font-semibold text-gray-800">Emails</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Email"
                className="bg-transparent outline-none text-sm w-36"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setNewMessageMode(true);
                setSelectedEmail(null);
                setReplyBody("");
                setNewTo("");
                setNewSubject("");
                setEmailError("");
              }}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
            >
              <span className="text-lg">+</span>
              New Message
            </button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Email list */}
          <div className="w-96 border-r border-gray-200 flex flex-col bg-gray-50/50 overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200 shrink-0">
              {(["all", "unread", "archive"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    tab === t ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t === "all" ? "All Mails" : t === "unread" ? "Unread" : "Archive"}
                </button>
              ))}
              <button className="ml-auto p-2 rounded hover:bg-gray-200">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No emails</div>
              ) : (
                filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      if (!email.is_read) markAsRead(email.id);
                    }}
                    className={`group flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-white ${
                      selectedEmail?.id === email.id ? "bg-white" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                      {getInitials(email.sender_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium truncate ${!email.is_read ? "text-gray-900" : "text-gray-600"}`}>
                          {email.sender_name}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">{formatDate(email.created_at)}</span>
                      </div>
                      <p className={`text-sm truncate ${!email.is_read ? "font-medium" : "text-gray-600"}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{email.preview}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!email.is_read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      <button onClick={(e) => { e.stopPropagation(); archiveEmail(email.id); }} className="p-1.5 rounded hover:bg-gray-200">
                        <Archive className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-gray-200">
                        <Forward className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteEmail(email.id); }} className="p-1.5 rounded hover:bg-gray-200">
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 space-y-2 shrink-0">
              <div className="text-xs text-gray-500">
                1-{Math.min(20, filteredEmails.length)} of {filteredEmails.length}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">6.2GB of 10GB</p>
                  <div className="h-1.5 mt-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-[62%] bg-green-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email detail & composer */}
          <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
            {newMessageMode ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 shrink-0">
                  <h2 className="text-lg font-semibold text-gray-800">New Message</h2>
                </div>
                <div className="flex flex-col shrink-0">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 flex-1">
                      <span>To:</span>
                      <input
                        value={newTo}
                        onChange={handleEmailChange}
                        placeholder="recipient@email.com"
                        className={`flex-1 outline-none ${emailError ? "text-red-600" : ""}`}
                      />
                      <ChevronDown className="w-4 h-4" />
                    </div>
                    <button onClick={() => setNewMessageMode(false)} className="p-2 rounded hover:bg-gray-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {emailError && (
                    <div className="px-4 py-1 text-sm text-red-600 bg-red-50">
                      {emailError}
                    </div>
                  )}
                </div>
                <input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Subject"
                  className="px-4 py-2 border-b border-gray-200 outline-none w-full shrink-0"
                />
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !sending) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Write your message..."
                  className="flex-1 p-4 outline-none resize-none text-gray-800 min-h-0"
                />
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 shrink-0 bg-white">
                  <button
                    onClick={sendReply}
                    disabled={sending}
                    className={`flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 ${
                      sending ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {sending ? "Sending..." : "Send Now"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded hover:bg-gray-100">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 rounded hover:bg-gray-100">
                      <Smile className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedEmail ? (
              <>
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                  <div className="border-b border-gray-200 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-base font-medium text-gray-600">
                          {getInitials(selectedEmail.sender_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedEmail.sender_name}</p>
                          <p className="text-sm text-gray-500">{selectedEmail.sender_email}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            To: {selectedEmail.recipient_name}
                            <ChevronDown className="inline w-4 h-4 ml-1" />
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(selectedEmail.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => markAsRead(selectedEmail.id)} className="p-2 rounded hover:bg-gray-100" title="Mark as read">
                          <Mail className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => archiveEmail(selectedEmail.id)} className="p-2 rounded hover:bg-gray-100">
                          <Archive className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 rounded hover:bg-gray-100">
                          <Forward className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 rounded hover:bg-gray-100">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mt-4">{selectedEmail.subject}</h2>
                    <div className="mt-4 text-gray-600 whitespace-pre-wrap">{selectedEmail.body}</div>
                    {selectedEmail.attachment_name && (
                      <div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <File className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedEmail.attachment_name}</p>
                          <p className="text-sm text-gray-500">{selectedEmail.attachment_size}</p>
                        </div>
                        <a href="#" className="text-blue-600 hover:underline flex items-center gap-1 ml-auto">
                          <Download className="w-4 h-4" /> Download
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {composeOpen && (
                  <div className="flex flex-col border-t border-gray-200 shrink-0 bg-white">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>To: {selectedEmail.sender_name}</span>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 rounded hover:bg-gray-100">
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setComposeOpen(false)} className="p-2 rounded hover:bg-gray-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !sending) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                        placeholder="Write your reply..."
                      className="p-4 outline-none resize-none text-gray-800 min-h-[120px] shrink-0"
                    />
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 shrink-0">
                      <button
                        onClick={sendReply}
                        disabled={sending}
                        className={`flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 ${
                          sending ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        {sending ? "Sending..." : "Send Now"}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded hover:bg-gray-100">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 rounded hover:bg-gray-100">
                          <Smile className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 rounded hover:bg-gray-100">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 rounded hover:bg-gray-100">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">Select an email</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
