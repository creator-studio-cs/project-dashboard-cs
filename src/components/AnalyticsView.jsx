import { useState } from "react";
import { BRAND, SEGMENTS, STAGES, STAGE_COLORS, TIER_COLORS, TIER_BG, JOURNEY_TYPES, JOURNEY_TYPE_COLORS, DEAL_TYPES } from "../constants/business.config";
import { pill, card, metricCard, btnSecondary } from "../constants/styles";
import { fmt$ } from "../utils/helpers";

export default function AnalyticsView({ contacts, onSelectContact, generateEmail }) {
  const [tab, setTab]             = useState("overview");
  const [expandedBulk, setExpandedBulk] = useState(null);
  const bySeg = SEGMENTS
    .map(seg => ({ seg, count: contacts.filter(c => c.segment === seg).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxC = Math.max(...bySeg.map(x => x.count), 1);

  const byStage = STAGES
    .map(st => ({ st, count: contacts.filter(c => c.stage === st).length }))
    .filter(x => x.count > 0);
  const maxSt = Math.max(...byStage.map(x => x.count), 1);

  const byTier = [["Hot", BRAND.navy, BRAND.navyLight], ["Warm", BRAND.sand, BRAND.sandLight], ["Cold", BRAND.gray, BRAND.grayLight]]
    .map(([t, color, bg]) => ({ t, color, bg, count: contacts.filter(c => c.tier === t).length }));

  const actionableC = contacts.filter(c => c.tags?.includes("Actionable"));

  const dealTypeBreakdown = DEAL_TYPES.map(dt => {
    const dtContacts = contacts.filter(c => c.revenueType === dt);
    return { label: dt, count: dtContacts.length, total: dtContacts.reduce((s, c) => s + (c.value || 0), 0) };
  });
  const untypedContacts = contacts.filter(c => !c.revenueType);
  const untypedTotal    = untypedContacts.reduce((s, c) => s + (c.value || 0), 0);
  const totalVal        = dealTypeBreakdown.reduce((s, d) => s + d.total, 0) + untypedTotal;

  // ── Campaigns tab data ──────────────────────────────────────────────────
  const allHistory = contacts.flatMap(c =>
    (c.emailHistory || []).map(h => ({ ...h, contact: c }))
  );
  const totalSent   = allHistory.length;
  const neverEmailed = contacts.filter(c => !(c.emailHistory?.length));

  const openRateBySeg = SEGMENTS.map(seg => {
    const emails = allHistory.filter(h => h.contact.segment === seg);
    return { label: seg, total: emails.length };
  }).filter(x => x.total > 0);

  // Group bulk sends by bulkId
  const bulkGroups = {};
  contacts.forEach(c => {
    (c.emailHistory || []).forEach(h => {
      if (!h.bulkId) return;
      if (!bulkGroups[h.bulkId]) {
        bulkGroups[h.bulkId] = { bulkId: h.bulkId, label: h.bulkLabel || h.bulkId, sentAt: h.sentAt, records: [] };
      }
      bulkGroups[h.bulkId].records.push({ ...h, contact: c });
    });
  });
  const bulkCampaigns = Object.values(bulkGroups).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  const openRateByJourney = JOURNEY_TYPES.map(jt => {
    const emails = allHistory.filter(h => (h.journeyType || h.contact.journeyType) === jt);
    return { label: jt, total: emails.length, color: JOURNEY_TYPE_COLORS[jt] };
  }).filter(x => x.total > 0);

  const openRateByStage = STAGES.map(stage => {
    const emails = allHistory.filter(h => h.contact.stage === stage);
    return { label: stage, total: emails.length };
  }).filter(x => x.total > 0);

  return (
    <div style={{height:"100%", overflowY:"auto", display:"flex", flexDirection:"column", gap:12}}>
      {/* Tab bar */}
      <div style={{display:"flex", gap:4, borderBottom:`1px solid ${BRAND.border}`, paddingBottom:0, flexShrink:0}}>
        {["overview","campaigns"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding:"7px 16px", border:"none", cursor:"pointer", fontSize:13,
              borderBottom: tab === t ? `2px solid ${BRAND.navy}` : "2px solid transparent",
              background:"transparent",
              color: tab === t ? BRAND.navy : BRAND.gray,
              fontWeight: tab === t ? 500 : 400,
              marginBottom:-1,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "campaigns" && (
        <>
          {/* Summary metric cards */}
          <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
            {[
              ["Total Sent",   totalSent,     "emails logged"],
              ["Open Rate",    "—", "not tracked (no email provider connected)"],
              ["Not Emailed",  neverEmailed.length, "contacts never contacted"],
            ].map(([l, v, sub]) => (
              <div key={l} style={metricCard}>
                <div style={{fontSize:11, color:BRAND.gray, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4}}>{l}</div>
                <div style={{fontSize:24, fontWeight:500, color:BRAND.navy}}>{v}</div>
                <div style={{fontSize:11, color:BRAND.gray, marginTop:2}}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
            {/* Emails sent by segment */}
            <div style={{...card, flex:1, minWidth:220}}>
              <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:14}}>Emails sent by segment</div>
              {openRateBySeg.length === 0 ? (
                <div style={{fontSize:12, color:BRAND.gray}}>No emails logged yet.</div>
              ) : openRateBySeg.map(({ label, total }) => (
                <div key={label} style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8}}>
                  <span style={{color:BRAND.gray}}>{label}</span>
                  <span style={{color:BRAND.navy, fontWeight:500}}>{total}</span>
                </div>
              ))}
            </div>

            {/* Emails sent by journey type */}
            <div style={{...card, flex:1, minWidth:200}}>
              <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:14}}>Emails sent by journey type</div>
              {openRateByJourney.length === 0 ? (
                <div style={{fontSize:12, color:BRAND.gray}}>No emails logged yet.</div>
              ) : openRateByJourney.map(({ label, total, color }) => (
                <div key={label} style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8}}>
                  <span style={{color:BRAND.gray}}>{label}</span>
                  <span style={{color, fontWeight:500}}>{total}</span>
                </div>
              ))}
            </div>

            {/* Emails sent by pipeline stage */}
            <div style={{...card, flex:1, minWidth:200}}>
              <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:14}}>Emails sent by pipeline stage</div>
              {openRateByStage.length === 0 ? (
                <div style={{fontSize:12, color:BRAND.gray}}>No emails logged yet.</div>
              ) : openRateByStage.map(({ label, total }) => (
                <div key={label} style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8}}>
                  <span style={{color:STAGE_COLORS[label] || BRAND.navy, fontWeight:500}}>{label}</span>
                  <span style={{color:BRAND.navy, fontWeight:500}}>{total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk campaigns */}
          {bulkCampaigns.length > 0 && (
            <div style={card}>
              <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:12}}>Bulk Campaigns</div>
              {bulkCampaigns.map(group => {
                const isExpanded  = expandedBulk === group.bulkId;
                return (
                  <div key={group.bulkId} style={{borderBottom:`1px solid ${BRAND.border}`, paddingBottom:10, marginBottom:10}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:13, fontWeight:500, color:BRAND.navy}}>{group.label}</div>
                        <div style={{fontSize:12, color:BRAND.gray, marginTop:2}}>
                          {group.records.length} recipients · {new Date(group.sentAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        style={{...btnSecondary, padding:"3px 10px", fontSize:12}}
                        onClick={() => setExpandedBulk(isExpanded ? null : group.bulkId)}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                    {isExpanded && (
                      <div style={{marginTop:10}}>
                        {group.records.map((r, i) => (
                          <div key={r.campaignId || i} style={{display:"flex", justifyContent:"space-between", fontSize:12, padding:"5px 0", borderBottom:`1px solid ${BRAND.border}`}}>
                            <span style={{color:BRAND.navy}}>{r.contact.firstName} {r.contact.lastName} <span style={{color:BRAND.gray}}>· {r.contact.org}</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Contacts never emailed */}
          <div style={card}>
            <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:12}}>
              Contacts never emailed ({neverEmailed.length})
            </div>
            {neverEmailed.length === 0 ? (
              <div style={{fontSize:12, color:BRAND.gray}}>All contacts have been emailed.</div>
            ) : (
              neverEmailed.map(c => (
                <div key={c.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${BRAND.border}`}}>
                  <div>
                    <span style={{fontSize:13, fontWeight:500, color:BRAND.navy}}>{c.firstName} {c.lastName}</span>
                    <span style={{fontSize:12, color:BRAND.gray, marginLeft:8}}>{c.org}</span>
                  </div>
                  <div style={{display:"flex", gap:6}}>
                    <span style={pill(TIER_COLORS[c.tier], TIER_BG[c.tier])}>{c.tier}</span>
                    <button style={{...btnSecondary, fontSize:12}} onClick={() => onSelectContact(c)}>View</button>
                    <button style={{...btnSecondary, fontSize:12, color:BRAND.sand, borderColor:BRAND.sandMid}} onClick={() => generateEmail(c)}>✉ Draft</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "overview" && <>
      <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
        {[
          ["Total Contacts",  contacts.length,                                                        "inquiries logged"],
          ["Hot Leads",       contacts.filter(c => c.tier === "Hot").length,                          "need attention"],
          ["Actionable",      actionableC.length,                                                      "ready to respond"],
          ["Pipeline Value",  fmt$(totalVal),                                                          "estimated"],
          ["Active",          contacts.filter(c => !["Closed Won","Closed Lost"].includes(c.stage)).length, "in pipeline"],
        ].map(([l, v, sub]) => (
          <div key={l} style={metricCard}>
            <div style={{fontSize:11, color:BRAND.gray, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4}}>{l}</div>
            <div style={{fontSize:24, fontWeight:500, color:BRAND.navy}}>{v}</div>
            <div style={{fontSize:11, color:BRAND.gray, marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
        <div style={{...card, flex:2, minWidth:240}}>
          <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:14}}>Inquiries by segment</div>
          {bySeg.map(({ seg, count }) => (
            <div key={seg} style={{marginBottom:10}}>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3}}>
                <span style={{color:BRAND.gray}}>{seg}</span>
                <span style={{color:BRAND.navy, fontWeight:500}}>{count}</span>
              </div>
              <div style={{height:6, borderRadius:3, background:BRAND.sandLight, overflow:"hidden"}}>
                <div style={{height:"100%", borderRadius:3, background:BRAND.navy, width:(count/maxC*100)+"%"}}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{...card, flex:1, minWidth:180}}>
          <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:14}}>Stage breakdown</div>
          {byStage.map(({ st, count }) => (
            <div key={st} style={{marginBottom:10}}>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3}}>
                <span style={{color:BRAND.gray}}>{st}</span>
                <span style={{color:STAGE_COLORS[st], fontWeight:500}}>{count}</span>
              </div>
              <div style={{height:5, borderRadius:3, background:BRAND.sandLight, overflow:"hidden"}}>
                <div style={{height:"100%", borderRadius:3, background:STAGE_COLORS[st], width:(count/maxSt*100)+"%"}}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{...card, flex:1, minWidth:150}}>
          <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:14}}>By tier</div>
          {byTier.map(({ t, color, bg, count }) => (
            <div key={t} style={{marginBottom:10, padding:"12px 14px", borderRadius:8, background:bg, border:`1px solid color-mix(in srgb, ${color} 13%, transparent)`}}>
              <div style={{fontSize:11, fontWeight:500, color, textTransform:"uppercase", letterSpacing:"0.05em"}}>{t}</div>
              <div style={{fontSize:26, fontWeight:500, color}}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Deal type breakdown */}
      <div style={{...card}}>
        <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:12}}>Pipeline by deal type</div>
        <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
          {[
            ...dealTypeBreakdown.map((d, i) => [d.label, d.count, d.total, i % 2 === 0 ? BRAND.navy : BRAND.green, i % 2 === 0 ? BRAND.navyLight : BRAND.greenLight]),
            ["Untyped", untypedContacts.length, untypedTotal, BRAND.gray, BRAND.grayLight],
          ].map(([lbl, count, total, color, bg]) => (
            <div key={lbl} style={{flex:1, minWidth:140, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", borderRadius:8, background:bg, border:`1px solid color-mix(in srgb, ${color} 13%, transparent)`}}>
              <div>
                <div style={{fontSize:12, fontWeight:500, color}}>{lbl}</div>
                <div style={{fontSize:11, color:BRAND.gray, marginTop:2}}>{count} contact{count !== 1 ? "s" : ""}</div>
              </div>
              <div style={{fontSize:18, fontWeight:500, color}}>{total > 0 ? fmt$(total) : "—"}</div>
            </div>
          ))}
        </div>
        {dealTypeBreakdown.every(d => d.count === 0) && (
          <div style={{fontSize:12, color:BRAND.gray, marginTop:10}}>No deal types assigned yet — set one in each contact's detail panel.</div>
        )}
      </div>

      <div style={card}>
        <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:12}}>Action items — needs response</div>
        {actionableC.length === 0 ? (
          <div style={{fontSize:13, color:BRAND.gray}}>No actionable items tagged.</div>
        ) : (
          actionableC.map(c => (
            <div key={c.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${BRAND.border}`}}>
              <div>
                <span style={{fontSize:13, fontWeight:500, color:BRAND.navy}}>{c.firstName} {c.lastName}</span>
                <span style={{fontSize:12, color:BRAND.gray, marginLeft:8}}>{c.org}</span>
              </div>
              <div style={{display:"flex", gap:6, alignItems:"center"}}>
                <span style={pill(TIER_COLORS[c.tier], TIER_BG[c.tier])}>{c.tier}</span>
                <button style={{...btnSecondary, fontSize:12}} onClick={() => onSelectContact(c)}>View</button>
                <button style={{...btnSecondary, fontSize:12, color:BRAND.sand, borderColor:BRAND.sandMid}} onClick={() => generateEmail(c)}>✉ Draft</button>
              </div>
            </div>
          ))
        )}
      </div>
      </>}
    </div>
  );
}
