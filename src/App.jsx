import { useState, useMemo, useRef, useEffect } from "react";
import { useContacts } from "./hooks/useContacts";
import { useTasks } from "./hooks/useTasks";
import { useFieldDefs } from "./hooks/useFieldDefs";
import { logActivity } from "./hooks/useActivity";
import TaskList, { taskBadgeCount } from "./components/TaskList";
import FieldDefsManager from "./components/FieldDefsManager";
import ConfirmDialog from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";
import { BRAND, STAGES, EMAIL_TEMPLATES, DEFAULT_TEMPLATE, BUSINESS } from "./constants/business.config";
import { isConfigured } from "./lib/supabase";
import LogoMark from "./components/LogoMark";
import ContactList from "./components/ContactList";
import PipelineView from "./components/PipelineView";
import AnalyticsView from "./components/AnalyticsView";
import DetailPanel from "./components/DetailPanel";
import EmailModal from "./components/EmailModal";
import AddModal from "./components/AddModal";
import ImportModal from "./components/ImportModal";
import BulkEmailModal from "./components/BulkEmailModal";
import IntakeForm from "./components/IntakeForm";
import IntakeQueue from "./components/IntakeQueue";
import CampaignTracker from "./components/CampaignTracker";
import FollowUpQueue from "./components/FollowUpQueue";
import SettingsPanel from "./components/SettingsPanel";
import { getFollowUpQueue, daysSince } from "./utils/followups";

export default function CRM({ settingsVersion }) {
  const {
    contacts, loading, hasMore, loadMore,
    addContact: dbAdd,
    updateContact: dbUpdate,
    deleteContact: dbDelete,
    importContacts: dbImport,
  } = useContacts();
  const [view, setView]               = useState("contacts");
  const [search, setSearch]           = useState("");
  const [filterSeg, setFilterSeg]     = useState("All");
  const [filterTier, setFilterTier]   = useState("All");
  const [filterStage, setFilterStage] = useState("All");
  const [selected, setSelected]       = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [showImport, setShowImport]   = useState(false);
  const [showEmail, setShowEmail]     = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [checkedIds, setCheckedIds]   = useState(new Set());
  const [emailContact, setEmailContact] = useState(null);
  const [emailDraft, setEmailDraft]   = useState({ subject:"", body:"" });
  const [emailLoading, setEmailLoading] = useState(false);
  const [followUpEntry, setFollowUpEntry] = useState(null);
  const [emailSubView, setEmailSubView] = useState("campaigns");
  const [showFieldDefs, setShowFieldDefs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      // Escape — close modals/panels in priority order
      if (e.key === "Escape") {
        if (showSettings) { setShowSettings(false); return; }
        if (showEmail) { setShowEmail(false); return; }
        if (showBulkEmail) { setShowBulkEmail(false); return; }
        if (showFieldDefs) { setShowFieldDefs(false); return; }
        if (showAdd) { setShowAdd(false); return; }
        if (showImport) { setShowImport(false); return; }
        if (selected) { setSelected(null); return; }
      }
      // Don't fire shortcuts when typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) { setShowAdd(true); }
      if (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        document.querySelector(".crm-search-input")?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showEmail, showBulkEmail, showFieldDefs, showSettings, showAdd, showImport, selected]);

  const pendingCount  = useMemo(() => contacts.filter(c => c.pending).length, [contacts]);
  const followUpCount = useMemo(() => getFollowUpQueue(contacts.filter(c => !c.pending)).length, [contacts]);
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const dueTaskCount = useMemo(() => taskBadgeCount(tasks), [tasks]);
  const { fieldDefs, addFieldDef, updateFieldDef, deleteFieldDef } = useFieldDefs();
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const { addToast } = useToast();

  // Persists last-selected contact so content stays visible during slide-out animation
  const lastSelectedRef = useRef(null);
  if (selected) lastSelectedRef.current = selected;
  const panelContact = selected || lastSelectedRef.current;

  const filtered = useMemo(() => contacts.filter(c => {
    if (c.pending) return false;
    const q = search.toLowerCase();
    const name = (c.firstName + " " + c.lastName).toLowerCase();
    const matchQ = !q || name.includes(q) || c.org.toLowerCase().includes(q) || c.segment.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    return matchQ && (filterSeg === "All" || c.segment === filterSeg) && (filterTier === "All" || c.tier === filterTier) && (filterStage === "All" || c.stage === filterStage);
  }), [contacts, search, filterSeg, filterTier, filterStage]);

  const pipelineByStage = useMemo(() => {
    const m = {};
    STAGES.forEach(s => m[s] = []);
    contacts.filter(c => !c.pending).forEach(c => { if (m[c.stage]) m[c.stage].push(c); });
    return m;
  }, [contacts, settingsVersion]);

  async function updateContact(id, updates) {
    await dbUpdate(id, updates);
    if (selected?.id === id) setSelected(s => ({...s, ...updates}));
  }

  async function addContact(contact) {
    const created = await dbAdd(contact);
    setShowAdd(false);
    if (created) {
      logActivity(created.id, "created", "Contact created");
      addToast(`${contact.firstName} ${contact.lastName} added`, "success");
    }
  }

  async function importContacts(newContacts) {
    await dbImport(newContacts);
  }

  function requestDeleteContact(contact) {
    setConfirmDelete({ id: contact.id, name: `${contact.firstName} ${contact.lastName}` });
  }

  async function executeDeleteContact() {
    if (!confirmDelete) return;
    const { id, name } = confirmDelete;
    await dbDelete(id);
    setSelected(null);
    setConfirmDelete(null);
    addToast(`${name} deleted`, "info");
  }

  function toggleCheck(id) {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll(checked) {
    if (checked) {
      setCheckedIds(prev => new Set([...prev, ...filtered.map(c => c.id)]));
    } else {
      setCheckedIds(new Set());
    }
  }

  async function bulkEdit(field, value) {
    if (!value) return;
    await Promise.all([...checkedIds].map(id => updateContact(id, { [field]: value })));
  }

  function toggleJourneyType(jt) {
    const ofType = contacts.filter(c => c.journeyType === jt);
    if (!ofType.length) return;
    const allChecked = ofType.every(c => checkedIds.has(c.id));
    if (allChecked) {
      setCheckedIds(prev => { const n = new Set(prev); ofType.forEach(c => n.delete(c.id)); return n; });
    } else {
      setCheckedIds(prev => new Set([...prev, ...ofType.map(c => c.id)]));
    }
  }

  // Opens the contact's own email client with the draft pre-filled, then logs
  // the send in the contact's local history. No external email service
  // required — swap this out for a real provider later if you want
  // open/click tracking.
  async function handleMarkSent(subject, body) {
    try {
      const sentAt = new Date().toISOString();
      const localId = `local-${Date.now()}`;
      const record = { campaignId: localId, subject, sentAt, opened: null, clicked: null, journeyType: emailContact.journeyType || null };
      let history = [...(emailContact.emailHistory || []), record];
      if (followUpEntry) {
        history = history.map(e =>
          e.campaignId === followUpEntry.campaignId ? { ...e, followUpSentAt: sentAt } : e
        );
        setFollowUpEntry(null);
      }
      await updateContact(emailContact.id, { emailHistory: history });
      logActivity(emailContact.id, "email", `Sent: ${subject}`);
      const mailto = `mailto:${emailContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto, "_blank");
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  async function generateEmail(c) {
    // NOTE: this calls api.anthropic.com directly with no API key, which only
    // works inside Claude's Artifact preview environment. To use AI-drafted
    // emails in this app once it's deployed standalone, route this through
    // your own backend (e.g. a Supabase Edge Function or small serverless function)
    // that holds the API key server-side — never ship an API key to the browser.
    setEmailContact(c);
    setEmailLoading(true);
    setShowEmail(true);
    const tmpl = EMAIL_TEMPLATES[c.segment] || DEFAULT_TEMPLATE;
    const subject = tmpl.subject(c);
    const baseBody = tmpl.body(c);
    setEmailDraft({ subject, body: baseBody });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are writing on behalf of ${BUSINESS.fromName} at ${BUSINESS.name}. ${BUSINESS.tagline}\n\nWrite a warm, professional reply email to ${c.firstName} ${c.lastName} from ${c.org}.\n\nTheir original message: "${c.message}"\n\nNotes: ${c.notes}\n\nStart from this draft and improve it — make it feel personal and directly address their inquiry. Keep it under 200 words. No markdown formatting. Sign off as ${BUSINESS.fromName}, ${BUSINESS.name}.\n\nBase draft:\n${baseBody}\n\nReturn only the improved email body, no subject line.`,
          }],
        }),
      });
      const data = await res.json();
      const aiBody = data.content?.find(b => b.type === "text")?.text || baseBody;
      setEmailDraft({ subject, body: aiBody });
    } catch (e) {}
    setEmailLoading(false);
  }

  async function deleteCampaign(campaign) {
    await Promise.all(campaign.recipients.map(({ contact, entry }) => {
      const history = (contact.emailHistory || []).filter(e =>
        campaign.isBulk ? e.bulkId !== campaign.key : e.campaignId !== campaign.key
      );
      return updateContact(contact.id, { emailHistory: history });
    }));
  }

  async function generateFollowUpEmail(contact, originalEntry) {
    setFollowUpEntry(originalEntry);
    setEmailContact(contact);
    setEmailLoading(true);
    setShowEmail(true);
    const subject = `Following up: ${originalEntry.subject}`;
    setEmailDraft({ subject, body: "" });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          messages: [{
            role: "user",
            content: `You are writing on behalf of ${BUSINESS.fromName} at ${BUSINESS.name}. ${BUSINESS.tagline}\n\nWrite a brief, warm follow-up email to ${contact.firstName} ${contact.lastName} from ${contact.org}. We sent them an email ${daysSince(originalEntry.sentAt)} days ago with subject "${originalEntry.subject}" and haven't heard back.\n\nThis follow-up should:\n- Be concise (under 100 words)\n- Not feel pushy — just a gentle check-in\n- Invite them to respond or ask if they have any questions\n- Sign off as ${BUSINESS.fromName}, ${BUSINESS.name}\n\nReturn only the email body, no subject line.`,
          }],
        }),
      });
      const data = await res.json();
      const aiBody = data.content?.find(b => b.type === "text")?.text || "";
      setEmailDraft({ subject, body: aiBody });
    } catch (_) {}
    setEmailLoading(false);
  }

  if (hash === "#intake") return <IntakeForm />;

  return (
    <div style={{fontFamily:"'Inter', system-ui, sans-serif", height:"100vh", overflow:"hidden", background:BRAND.grayLight, display:"flex", flexDirection:"column"}}>

      {/* Header */}
      <div className="crm-header" style={{background:BRAND.navy, padding:"0 20px", display:"flex", alignItems:"center", gap:16, height:52, flexShrink:0, zIndex:10}}>
        <div className="crm-header-left" style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:32, height:32, borderRadius:8, background:BRAND.navyMid, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <LogoMark size={22}/>
          </div>
          <div className="crm-header-brand-text">
            <span style={{fontWeight:600, fontSize:14, color:BRAND.white, letterSpacing:"0.01em"}}>{BUSINESS.name}</span>
            <span style={{fontSize:11, color:BRAND.sand, marginLeft:5, letterSpacing:"0.05em", textTransform:"lowercase"}}>crm</span>
          </div>
        </div>
        <nav className="crm-nav" style={{display:"flex", gap:2, marginLeft:12}}>
          {["contacts","pipeline","analytics"].map(v => (
            <button key={v} className="crm-nav-btn" style={{padding:"6px 14px", borderRadius:6, border:"none", background:view===v?"rgba(255,255,255,0.12)":"transparent", color:view===v?BRAND.white:BRAND.sand, cursor:"pointer", fontSize:13, fontWeight:view===v?500:400, letterSpacing:"0.01em"}} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button
            className="crm-nav-btn"
            style={{padding:"6px 14px", borderRadius:6, border:"none", background:view==="emails"?"rgba(255,255,255,0.12)":"transparent", color:view==="emails"?BRAND.white:BRAND.sand, cursor:"pointer", fontSize:13, fontWeight:view==="emails"?500:400, letterSpacing:"0.01em", display:"flex", alignItems:"center", gap:6}}
            onClick={() => setView("emails")}
          >
            Emails
            {followUpCount > 0 && (
              <span style={{background:BRAND.amber, color:BRAND.white, borderRadius:99, fontSize:10, fontWeight:700, padding:"1px 6px", lineHeight:"16px"}}>
                {followUpCount}
              </span>
            )}
          </button>
          <button
            className="crm-nav-btn"
            style={{padding:"6px 14px", borderRadius:6, border:"none", background:view==="tasks"?"rgba(255,255,255,0.12)":"transparent", color:view==="tasks"?BRAND.white:BRAND.sand, cursor:"pointer", fontSize:13, fontWeight:view==="tasks"?500:400, letterSpacing:"0.01em", display:"flex", alignItems:"center", gap:6}}
            onClick={() => setView("tasks")}
          >
            Tasks
            {dueTaskCount > 0 && (
              <span style={{background:BRAND.amber, color:BRAND.white, borderRadius:99, fontSize:10, fontWeight:700, padding:"1px 6px", lineHeight:"16px"}}>
                {dueTaskCount}
              </span>
            )}
          </button>
          <button
            className="crm-nav-btn"
            style={{padding:"6px 14px", borderRadius:6, border:"none", background:view==="intake"?"rgba(255,255,255,0.12)":"transparent", color:view==="intake"?BRAND.white:BRAND.sand, cursor:"pointer", fontSize:13, fontWeight:view==="intake"?500:400, letterSpacing:"0.01em", display:"flex", alignItems:"center", gap:6}}
            onClick={() => setView("intake")}
          >
            Intake
            {pendingCount > 0 && (
              <span style={{background:BRAND.amber, color:BRAND.white, borderRadius:99, fontSize:10, fontWeight:700, padding:"1px 6px", lineHeight:"16px"}}>
                {pendingCount}
              </span>
            )}
          </button>
        </nav>
        <div className="crm-header-stats" style={{marginLeft:"auto", fontSize:12, color:BRAND.sand, display:"flex", alignItems:"center", gap:14}}>
          {loading ? "Loading…" : `${contacts.filter(c => !c.pending).length} contacts · ${contacts.filter(c => c.tier === "Hot" && !c.pending).length} hot leads`}
          <button
            onClick={() => setShowSettings(true)}
            title="Workspace settings"
            style={{background:"none", border:"none", color:BRAND.sand, cursor:"pointer", fontSize:15, padding:0}}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="crm-main" style={{flex:1, padding:16, overflow:"hidden", position:"relative"}}>

        {!isConfigured && (
          <div style={{maxWidth:520, margin:"60px auto", textAlign:"center"}}>
            <div style={{fontSize:40, marginBottom:16}}>🔌</div>
            <div style={{fontSize:20, fontWeight:700, color:BRAND.navy, marginBottom:8}}>Connect your database</div>
            <div style={{fontSize:14, color:BRAND.gray, lineHeight:1.7, marginBottom:24}}>
              The CRM is running, but it needs a Supabase project to store data.
              Open <code style={{background:BRAND.grayLight, padding:"2px 6px", borderRadius:4, fontSize:12}}>.env</code> in
              your project folder and replace the placeholder values with your real Supabase URL and anon key
              from <strong>Settings → API</strong> in the Supabase dashboard. Then restart the dev server.
            </div>
            <div style={{background:BRAND.grayLight, borderRadius:10, padding:"16px 20px", textAlign:"left", fontSize:12, fontFamily:"monospace", lineHeight:1.8, color:BRAND.black}}>
              REACT_APP_SUPABASE_URL=https://<em style={{color:BRAND.navy}}>your-project-id</em>.supabase.co<br/>
              REACT_APP_SUPABASE_ANON_KEY=<em style={{color:BRAND.navy}}>eyJ...your-key</em><br/>
              DISABLE_ESLINT_PLUGIN=true
            </div>
            <div style={{fontSize:12, color:BRAND.gray, marginTop:16}}>
              Don't have a Supabase project yet? Create one free at{" "}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{color:BRAND.navy}}>supabase.com</a>,
              then run the SQL schema from README.md in the SQL Editor.
            </div>
          </div>
        )}
        {view === "contacts" && (
          <ContactList
            filtered={filtered}
            selected={selected}
            setSelected={setSelected}
            search={search}
            setSearch={setSearch}
            filterTier={filterTier}
            setFilterTier={setFilterTier}
            filterSeg={filterSeg}
            setFilterSeg={setFilterSeg}
            filterStage={filterStage}
            setFilterStage={setFilterStage}
            onOpenAdd={() => setShowAdd(true)}
            onOpenImport={() => setShowImport(true)}
            generateEmail={generateEmail}
            checkedIds={checkedIds}
            onToggleCheck={toggleCheck}
            onSelectAll={selectAll}
            onToggleJourneyType={toggleJourneyType}
            onBulkEdit={bulkEdit}
            contacts={contacts}
            onOpenBulkEmail={() => setShowBulkEmail(true)}
            hasMore={hasMore}
            loadMore={loadMore}
          />
        )}
        {view === "pipeline" && (
          <PipelineView
            pipelineByStage={pipelineByStage}
            onSelectContact={setSelected}
            updateContact={updateContact}
          />
        )}
        {view === "analytics" && (
          <AnalyticsView
            contacts={contacts}
            onSelectContact={setSelected}
            generateEmail={generateEmail}
          />
        )}
        {view === "emails" && (
          <div style={{height:"100%", display:"flex", flexDirection:"column", gap:0}}>
            {/* Sub-tab toggle */}
            <div style={{display:"flex", gap:6, marginBottom:14, flexShrink:0}}>
              {[["campaigns","Sent Campaigns"],["followups","Follow-up Queue"]].map(([key, lbl]) => (
                <button
                  key={key}
                  onClick={() => setEmailSubView(key)}
                  style={{
                    padding:"6px 16px", borderRadius:99, border:"1px solid",
                    fontSize:12, cursor:"pointer", fontWeight: emailSubView===key ? 500 : 400,
                    borderColor: emailSubView===key ? BRAND.navy : BRAND.border,
                    background:  emailSubView===key ? BRAND.navy : BRAND.white,
                    color:       emailSubView===key ? BRAND.white : BRAND.gray,
                    display:"flex", alignItems:"center", gap:6,
                  }}
                >
                  {lbl}
                  {key === "followups" && followUpCount > 0 && (
                    <span style={{background:BRAND.amber, color:BRAND.white, borderRadius:99, fontSize:10, fontWeight:700, padding:"1px 6px", lineHeight:"16px"}}>
                      {followUpCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div style={{flex:1, overflowY:"auto"}}>
              {emailSubView === "campaigns" && (
                <CampaignTracker
                  contacts={contacts}
                  onSelectContact={setSelected}
                  onDeleteCampaign={deleteCampaign}
                />
              )}
              {emailSubView === "followups" && (
                <FollowUpQueue
                  contacts={contacts}
                  updateContact={updateContact}
                  onGenerateFollowUp={generateFollowUpEmail}
                />
              )}
            </div>
          </div>
        )}
        {view === "tasks" && (
          <div style={{height:"100%", overflowY:"auto", maxWidth:640}}>
            <div style={{fontWeight:500, fontSize:16, color:BRAND.navy, marginBottom:14}}>Tasks</div>
            <TaskList
              tasks={tasks}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              showContactName
              onSelectContact={setSelected}
            />
          </div>
        )}
        {view === "intake" && (
          <div style={{height:"100%", overflowY:"auto"}}>
            <IntakeQueue
              onApprove={approvedContact => {
                setView("contacts");
                setSelected(approvedContact);
              }}
            />
          </div>
        )}

        {/* Modals */}
        {showEmail && (
          <EmailModal
            emailContact={emailContact}
            emailDraft={emailDraft}
            setEmailDraft={setEmailDraft}
            emailLoading={emailLoading}
            onClose={() => setShowEmail(false)}
            generateEmail={generateEmail}
            onMarkSent={handleMarkSent}
            onUpdateContact={updates => emailContact && updateContact(emailContact.id, updates)}
          />
        )}
        {showBulkEmail && (
          <BulkEmailModal
            selectedContacts={contacts.filter(c => checkedIds.has(c.id))}
            updateContact={updateContact}
            onClose={() => setShowBulkEmail(false)}
            onDone={() => setCheckedIds(new Set())}
          />
        )}
        {showFieldDefs && (
          <FieldDefsManager
            fieldDefs={fieldDefs}
            addFieldDef={addFieldDef}
            updateFieldDef={updateFieldDef}
            deleteFieldDef={deleteFieldDef}
            onClose={() => setShowFieldDefs(false)}
          />
        )}
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onManageCustomFields={() => { setShowSettings(false); setShowFieldDefs(true); }}
          />
        )}
        {showAdd && (
          <AddModal
            onSave={addContact}
            onClose={() => setShowAdd(false)}
            contacts={contacts}
            fieldDefs={fieldDefs}
          />
        )}
        {showImport && (
          <ImportModal
            existingContacts={contacts}
            onImport={importContacts}
            onClose={() => setShowImport(false)}
          />
        )}
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setSelected(null)}
        style={{
          position:"fixed", top:52, left:0, right:0, bottom:0,
          background:"rgba(20,20,20,0.22)",
          opacity: selected ? 1 : 0,
          pointerEvents: selected ? "auto" : "none",
          transition:"opacity 0.25s ease",
          zIndex:8,
        }}
      />

      {/* Slide-in detail panel */}
      <div className="crm-detail-panel" style={{
        position:"fixed", top:0, right:0, bottom:0,
        width:"max(500px, 38vw)",
        background:BRAND.white,
        borderLeft:`1px solid ${BRAND.border}`,
        boxShadow:"-8px 0 32px rgba(0,0,0,0.1)",
        transform: selected ? "translateX(0)" : "translateX(105%)",
        transition:"transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex:9,
        display:"flex", flexDirection:"column",
      }}>
        <div style={{height:52, flexShrink:0}} />
        <div className="crm-detail-inner" style={{flex:1, overflowY:"auto"}}>
          {panelContact && (
            <DetailPanel
              c={panelContact}
              onClose={() => setSelected(null)}
              updateContact={updateContact}
              generateEmail={generateEmail}
              deleteContact={requestDeleteContact}
              fieldDefs={fieldDefs}
            />
          )}
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.name}?`}
          message="This will permanently remove this contact and all their associated data. This cannot be undone."
          confirmLabel="Delete contact"
          onConfirm={executeDeleteContact}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
