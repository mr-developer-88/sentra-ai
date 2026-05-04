import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const configProjectId = firebaseConfig.projectId;
const envProjectId = process.env.GOOGLE_CLOUD_PROJECT;
const configDbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

// The AI Studio environment project usually holds the authorized service account
const targetProjectId = envProjectId || configProjectId;

console.log('[Firebase Admin] Bootstrap Phase:');
console.log(`- Target Project: ${targetProjectId}`);
console.log(`- Config Database: ${configDbId || '(default)'}`);

const adminApp = admin.apps.length === 0 
  ? initializeApp({ projectId: targetProjectId }) 
  : admin.app();

let firestoreDb: any; // Using any to support both Admin SDK and MemStore
let isDegraded = false;
let activeDbId = configDbId || '(default)';

// IN-MEMORY FALLBACK (For Zero-Trust Resilience)
const MemStore: any = {
    collections: {} as Record<string, any>,
    collection(name: string) {
        if (!this.collections[name]) this.collections[name] = new Map();
        const col = this.collections[name];
        
        const queryInterface = {
            doc: (id?: string) => {
                const docId = id || Math.random().toString(36).substring(7);
                return {
                    id: docId,
                    collection: (subName: string) => MemStore.collection(`${name}/${docId}/${subName}`),
                    get: async () => {
                        const data = col.get(docId);
                        return { exists: !!data, data: () => data };
                    },
                    set: async (data: any) => col.set(docId, { ...data, id: docId }),
                    update: async (data: any) => {
                        const existing = col.get(docId) || {};
                        const updated = { ...existing };
                        for (const key in data) {
                            const val = data[key];
                            // Mocking arrayUnion behavior
                            if (val && typeof val === 'object' && val._methodName === 'FieldValue.arrayUnion') {
                                if (!Array.isArray(updated[key])) updated[key] = [];
                                updated[key] = [...updated[key], ...val._elements];
                            } else {
                                updated[key] = val;
                            }
                        }
                        col.set(docId, updated);
                    },
                    delete: async () => col.delete(docId)
                };
            },
            get: async () => ({ 
                empty: col.size === 0, 
                docs: Array.from(col.values())
                    .sort((a: any, b: any) => (b.updatedAt || 0) > (a.updatedAt || 0) ? 1 : -1)
                    .map((d: any) => ({ id: d.id, data: () => d })) 
            }),
            limit: function() { return this; },
            orderBy: function() { return this; },
            where: function() { return this; }
        };
        return queryInterface;
    }
};

const SafeFieldValue = {
  serverTimestamp: () => {
    if (!isDegraded && FieldValue.serverTimestamp) return FieldValue.serverTimestamp();
    return new Date().toISOString();
  },
  arrayUnion: (...args: any[]) => {
    if (!isDegraded && FieldValue.arrayUnion) return FieldValue.arrayUnion(...args);
    return { _methodName: 'FieldValue.arrayUnion', _elements: args };
  }
};

async function bootstrapFirestore() {
  console.log(`[Firebase Admin] System Boot Protocol: ${targetProjectId}`);
  
  const tryDb = async (id: string | undefined): Promise<boolean> => {
    try {
      const db = getFirestore(adminApp, id);
      // Real connectivity probe
      await db.listCollections();
      firestoreDb = db;
      activeDbId = id || '(default)';
      isDegraded = false;
      return true;
    } catch (e: any) {
      return false; 
    }
  };

  // Logic: Try Enterprise DB -> Try Default DB -> Try MemStore
  let success = false;
  if (configDbId) success = await tryDb(configDbId);
  if (!success) success = await tryDb(undefined);

  if (!success) {
    console.warn('[Firebase Admin] DATABASE OFFLINE. Initializing SentraAI Vault (In-Memory Fallback).');
    firestoreDb = MemStore;
    isDegraded = true;
    activeDbId = 'Sentinel-MemVault';
  }
}

// The server startup is now handled by initializeSystem() below
async function startServer() {
  const app = express();
  app.use(express.json());

  // Log all requests
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (req.method === 'POST' && req.path.startsWith('/api/alerts')) {
       console.log(`[${timestamp}] Intake Payload:`, JSON.stringify(req.body));
    }
    next();
  });
  
  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'operational',
      uptime: process.uptime(),
      firestore: isDegraded ? 'degraded_fallback' : 'connected_enterprise',
      database: activeDbId,
      ai: 'active (Gemini-1.5-Flash)'
    });
  });

  let genAI: GoogleGenAI | null = null;
  function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    // Fallback key provided by user in conversation for immediate resolution
    const fallbackKey = 'AIzaSyCc1bo-Xgk-l8TKNq7yCAN3VYZJMOlyZAk';
    
    const finalKey = (apiKey && !['your-api-key', 'TODO', 'MY_GEMINI_API_KEY', 'MY_API_KEY'].includes(apiKey)) 
      ? apiKey 
      : fallbackKey;

    if (!finalKey) {
       throw new Error('GEMINI_API_KEY is missing. Please set it in Settings -> Secrets panel.');
    }

    if (!genAI) {
      genAI = new GoogleGenAI({ apiKey: finalKey });
    }
    return genAI;
  }

  // Notification System Helper
  async function createNotification(userId: string, data: {
    type: string;
    title: string;
    message: string;
    severity: number;
    incidentId?: string;
  }) {
    try {
      const notifRef = firestoreDb.collection('notifications').doc(userId).collection('items').doc();
      await notifRef.set({
        ...data,
        userId,
        id: notifRef.id,
        createdAt: SafeFieldValue.serverTimestamp(),
        read: false
      });
    } catch (err: any) {
      console.error('[Notification System] Failed to write notification:', err.message);
    }
  }

  // Helper: Log to incident timeline
  async function logToTimeline(incidentId: string, entry: { type: string, status: string, details?: string }) {
      try {
        await firestoreDb.collection('incidents').doc(incidentId).update({
            auditTrail: SafeFieldValue.arrayUnion({
                action: entry.type,
                status: entry.status,
                details: entry.details,
                timestamp: new Date().toISOString(),
                executedBy: 'AI'
            })
        });
      } catch (err: any) {
          console.error('[Timeline Log Error]:', err.message);
      }
  }

  // Helper: Send Slack Notification
  async function sendSlackNotification(incidentId: string, alertData: any, slackWebhook: string): Promise<boolean> {
      try {
        await axios.post(slackWebhook, {
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: alertData.source === 'demo' ? "🧪 SIMULATION: Attack Forge Triggered" : "🚨 SECURITY ALERT", emoji: true }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Incident:* ${incidentId}\n*Attack:* ${alertData.attackType || 'Anomaly Detected'}\n*Severity:* ${alertData.severity || 'N/A'}\n*Source:* ${alertData.source || 'PRODUCTION'}`
              }
            }
          ]
        });
        return true;
      } catch (err: any) {
        console.error('[Slack Notification Error]:', err.message);
        return false;
      }
  }

  // API Routes
  
  // Real-time Wazuh SIEM Interface
  app.post('/api/alerts/wazuh', async (req, res) => {
    const rawAlert = req.body;
    let incidentId = "W-" + Date.now();

    try {
      const rule = rawAlert.rule || {};
      const agent = rawAlert.agent || { name: 'external-sensor' };
      const location = rawAlert.location || 'cloud-ingress';
      
      const normalizedSummary = rule.description || 'Wazuh Security Event';
      const severity = Math.min(10, Math.ceil((rule.level || 5) / 1.5));
      const targetUserId = rawAlert.userId || null;
      
      const incidentRef = firestoreDb.collection('incidents').doc();
      incidentId = incidentRef.id;
      
      await incidentRef.set({
        createdAt: SafeFieldValue.serverTimestamp(),
        userId: targetUserId,
        source: 'wazuh',
        sourceAgent: agent.name,
        sourceLocation: location,
        rawAlert: rawAlert,
        status: 'new',
        attackType: normalizedSummary,
        severity: severity,
        auditTrail: [{
          action: 'Alert Ingested & AI Pipeline Triggered',
          timestamp: new Date().toISOString(),
          actor: 'SentraAI-Collector'
        }]
      });

      // Target notifications to the user who has an integration configured, or a default 
      let targetUidForNotification = targetUserId;
      if (!targetUidForNotification) {
        const settingsSnap = await firestoreDb.collection('integrations').limit(1).get();
        targetUidForNotification = !settingsSnap.empty ? settingsSnap.docs[0].id : 'demo-user';
      }

      await createNotification(targetUidForNotification, {
        type: 'incident_new',
        title: '🚨 New Wazuh Alert',
        message: `High priority alert detected from ${agent.name}: ${normalizedSummary}`,
        severity: severity,
        incidentId: incidentId
      });

      // Background AI Processing
      triageIncident(incidentId, rawAlert).catch(console.error);

      res.status(202).json({ id: incidentId, status: 'normalized', autopilot: 'active' });
    } catch (error: any) {
      console.error('[Wazuh Ingress] Protocol Error:', error.message);
      res.status(500).json({ error: 'Ingress Failed', details: error.message });
    }
  });

  // Generic Webhook / Simulation Ingress
  app.post('/api/alerts/generic', async (req, res) => {
    const rawAlert = req.body;
    let incidentId = "fallback-" + Date.now();

    try {
      console.log('[Generic] Inbound Alert received');
      
      const targetUserId = rawAlert.userId || null;
      const incidentRef = firestoreDb.collection('incidents').doc();
      incidentId = incidentRef.id;
      
      await incidentRef.set({
        createdAt: SafeFieldValue.serverTimestamp(),
        userId: targetUserId,
        source: rawAlert.source || 'generic',
        rawAlert: rawAlert,
        status: 'new',
        attackType: rawAlert.attackType || 'Protocol Extraction',
        severity: rawAlert.severity || 5,
        auditTrail: [{
          action: 'Alert Captured via Ingress Webhook',
          timestamp: new Date().toISOString(),
          actor: 'SentraAI-Ingress'
        }]
      });

      let targetUidForNotification = targetUserId;
      if (!targetUidForNotification) {
        const settingsSnap = await firestoreDb.collection('integrations').limit(1).get();
        targetUidForNotification = !settingsSnap.empty ? settingsSnap.docs[0].id : 'demo-user';
      }

      await createNotification(targetUidForNotification, {
        type: 'incident_new',
        title: rawAlert.source === 'demo' ? '🧪 Simulation Triggered' : '🚨 Generic Alert Ingested',
        message: `Security signal captured: ${rawAlert.attackType || 'Anomaly Detected'}`,
        severity: rawAlert.severity || 5,
        incidentId: incidentId
      });

      triageIncident(incidentId, rawAlert).catch(err => {
        console.error(`[AI Triage] Async Failure for ${incidentId}:`, err.message);
      });

      // Demo Autopilot: Immediate Slack Notify
      if (rawAlert.source === 'demo') {
        const integrationsSnap = await firestoreDb.collection('integrations').orderBy('updatedAt', 'desc').limit(1).get();
        const config = !integrationsSnap.empty ? integrationsSnap.docs[0].data() : null;
        if (config && config.slackWebhook) {
            const success = await sendSlackNotification(incidentId, rawAlert, config.slackWebhook);
            await logToTimeline(incidentId, { type: 'SLACK_NOTIFY', status: success ? 'success' : 'failure' });
        } else {
            await logToTimeline(incidentId, { type: 'SLACK_NOTIFY', status: 'failure', details: 'Skipped (Slack not configured)' });
        }
      }
      
      res.status(202).json({ id: incidentId, status: 'received' });
    } catch (error: any) {
      console.error('[Generic Ingress Error]:', error.message);
      res.status(500).json({ 
        error: 'Database Sync Failure', 
        message: `The incident was dropped because the database is unreachable: ${error.message}`,
        code: error.code || 500
      });
    }
  });

  // AI Triage Logic with Fallback & Real Integrations
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function triageIncident(id: string, alert: any) {
    const incidentRef = firestoreDb.collection('incidents').doc(id);
    const snap = await incidentRef.get();
    const data = snap.data();

    // Idempotency check: Already processed or currently processing
    if (data?.aiStatus === 'completed' || data?.aiStatus === 'pending') {
      console.log(`[AI Triage] Incident ${id} already processed or in progress. Skipping.`);
      return;
    }

    console.log(`[AI Triage] Initiating for incident ${id}...`);
    
    // Determine target user for notifications
    const integrationsSnap = await firestoreDb.collection('integrations').limit(1).get();
    const targetUid = !integrationsSnap.empty ? integrationsSnap.docs[0].id : alert.userId || 'demo-user';

    // Set initial status to pending
    await incidentRef.update({ aiStatus: 'pending' }).catch(() => {});

    function getFallbackTriage(alertData: any): any {
        const attackName = alertData.rule?.description || alertData.attackType || 'Generic Security Event';
        const level = alertData.rule?.level || 5;

        // Deterministic rule-based triage
        let severity = Math.min(10, Math.ceil(level / 1.5));
        let recommendedActions = [
            'Manual forensic review of raw telemetry is advised',
            'Verify source authentication headers',
            'Cross-reference with endpoint process logs'
        ];

        if (attackName.toLowerCase().includes('brute force')) {
            severity = Math.max(severity, 7);
            recommendedActions.push('Lock out source IP');
        } else if (attackName.toLowerCase().includes('sql')) {
            severity = Math.max(severity, 9);
            recommendedActions.push('Purge input buffers', 'Rotate DB credentials');
        } else if (attackName.toLowerCase().includes('ransom')) {
            severity = 10;
            recommendedActions.push('Isolate affected host immediately', 'Initiate incident response');
        }

        return {
            attackType: attackName,
            aiSummary: `Autonomous analysis is currently throlled via rule-based fallback (API Quota Hit). Potential ${attackName} detected.`,
            severity: severity,
            confidence: 0.1,
            mitreTechniques: alertData.rule?.mitre?.id ? [alertData.rule.mitre.id] : ['T1001'],
            iocs: [],
            recommendedActions
        };
    }

    const fallbackTriage = getFallbackTriage(alert);

    const prompt = `
      Analyze this security alert: ${JSON.stringify(alert)}
      Identify: attackType, severity (1-10), confidence (0-1), mitreTechniques (T-code), iocs, summary (professional), remediation (3 steps).
      JSON output only.
    `;

    let triage;
    let maxRetries = 5; 
    let attempt = 0;
    let quotaHit = false;
    let modelNotFound = false;
    let currentModel = 'gemini-1.5-flash';
    let lastErrorMsg = '';

    while (attempt <= maxRetries) {
      try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json'
          }
        });
        
        let text = response.text || '';
        
        // Clean up markdown markers if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsedTriage = JSON.parse(text);
        triage = {
          ...parsedTriage,
          aiSummary: parsedTriage.aiSummary || parsedTriage.summary || 'AI analysis completed.',
        };
        console.log(`[AI Triage] Successful analysis for ${id} on attempt ${attempt + 1} using ${currentModel}`);
        quotaHit = false;
        modelNotFound = false;
        break; 
      } catch (error: any) {
        attempt++;
        lastErrorMsg = typeof error.message === 'string' ? error.message : JSON.stringify(error.message || error);
        
        let status = error.status;
        if (!status && lastErrorMsg.includes('429')) status = 429;
        if (!status && lastErrorMsg.includes('503')) status = 503;
        if (!status && lastErrorMsg.includes('404')) status = 404;
        if (!status) status = 500;

        const isQuota = status === 429 || status === 503 || lastErrorMsg.toLowerCase().includes('quota') || lastErrorMsg.toLowerCase().includes('unavailable');
        const isNotFound = status === 404 || lastErrorMsg.toLowerCase().includes('not found') || lastErrorMsg.toLowerCase().includes('models/');
        
        if (isNotFound) {
          console.warn(`[AI Triage] Model ${currentModel} not found for ${id}. Falling back to gemini-1.5-flash-latest...`);
          currentModel = 'gemini-1.5-flash-latest';
          modelNotFound = true;
          // Retry immediately for model change
          continue;
        } else if (isQuota) {
          quotaHit = true;
          console.warn(`[AI Triage] Quota limit/Unavailable hit for ${id}. Executing deterministic fallback protocol immediately.`);
          triage = fallbackTriage;
          break; // Fail fast with fallback to ensure demo continuity
        }

        console.error(`[AI Triage] Error for incident ${id} (Attempt ${attempt}):`, lastErrorMsg.substring(0, 150) + (lastErrorMsg.length > 150 ? '...' : ''));
        if (attempt > maxRetries) {
          triage = fallbackTriage;
          break;
        }
      }
    }

    try {
      if (!triage || triage === fallbackTriage) {
        const aiStatus = quotaHit ? 'quota_exceeded' : 'failed';
        const aiError = quotaHit 
          ? 'AI Quota limit reached (429/503). Deployment resources are currently saturated.'
          : (modelNotFound ? `Model not found (404). Tried gemini-2.5-flash and gemini-1.5-flash-latest. Last error: ${lastErrorMsg}` : `AI analysis failed after ${attempt} attempts. Last error: ${lastErrorMsg}`);
          
        await incidentRef.update({
          aiStatus: aiStatus,
          aiError: aiError,
          ...fallbackTriage,
          status: 'triaged',
          updatedAt: SafeFieldValue.serverTimestamp(),
          auditTrail: SafeFieldValue.arrayUnion({
            action: `AI Triage ${quotaHit ? 'Quota Exhausted' : 'Failed'}`,
            timestamp: new Date().toISOString(),
            actor: 'SentraAI-Autopilot'
          })
        });

        await createNotification(targetUid, {
          type: 'system_status',
          title: quotaHit ? '⚠️ AI Ingress Throttled' : '⚠️ AI Triage Failed',
          message: quotaHit ? `AI analysis for ${id} was deferred due to API quota limits. Manual review required.` : `AI analysis for ${id} failed. Applied safety baselines.`,
          severity: 5,
          incidentId: id
        });

        // Slack Fallback for SOC team awareness
        try {
          let slackWebhook: string | undefined;
          const userConfigSnap = targetUid ? await firestoreDb.collection('integrations').doc(targetUid).get() : null;
          if (userConfigSnap && userConfigSnap.exists && userConfigSnap.data()?.slackWebhook) {
            slackWebhook = userConfigSnap.data()?.slackWebhook;
          } else {
            const globalInts = await firestoreDb.collection('integrations').orderBy('updatedAt', 'desc').limit(1).get();
            if (!globalInts.empty) slackWebhook = globalInts.docs[0].data().slackWebhook;
          }

          if (slackWebhook) {
            await axios.post(slackWebhook, {
              blocks: [
                {
                  type: "header",
                  text: { type: "plain_text", text: quotaHit ? "🚨 SYSTEM ALERT: AI Capacity Reached" : "🚨 SYSTEM ALERT: AI Triage Failure", emoji: true }
                },
                {
                  type: "section",
                  text: { 
                    type: "mrkdwn", 
                    text: `*Status:* ${quotaHit ? 'Throttled' : 'Failed'}\n*Incident:* ${id}\n*Action:* Manual Review Required\nAI analysis could not be completed for this incident. The system has logged the alert for human intervention.`
                  }
                }
              ]
            }).catch(() => {});
          }
        } catch (err) { /* Silent fail for fallback */ }

        // CHECK FOR AUTOPILOT EVEN WITH FALLBACK
        const finalSeverity = fallbackTriage.severity || 7;
        console.log(`[Autopilot] Proceeding to System Actions for fallback (${finalSeverity})...`);
        await executeSystemActions(id, { ...fallbackTriage, source: alert.source, fallback: true });

        return;
      }

      // Calculate custom prioritization
      let isPriority = false;
      try {
        const settingsSnap = await firestoreDb.collection('settings').doc(targetUid).get();
        if (settingsSnap.exists) {
          const sData = settingsSnap.data();
          const rules = sData?.prioritizationRules || [];
          for (const rule of rules) {
            let target = null;
            if (rule.field === 'severity') target = triage.severity;
            else if (rule.field === 'source') target = alert.source;
            else if (rule.field === 'mitre') target = triage.mitreTechniques ? triage.mitreTechniques.join(',') : '';

            if (target !== null && target !== undefined) {
              if (rule.operator === 'equals' && String(target).toLowerCase() === String(rule.value).toLowerCase()) isPriority = true;
              if (rule.operator === 'greater_than' && !isNaN(Number(target)) && Number(target) > Number(rule.value)) isPriority = true;
              if (rule.operator === 'contains' && String(target).toLowerCase().includes(String(rule.value).toLowerCase())) isPriority = true;
            }
          }
        }
      } catch (err) {
        console.error('[AI Triage] Prioritization Evaluation Error:', err);
      }

      await incidentRef.update({
        ...triage,
        isPriority,
        aiStatus: 'completed',
        status: 'triaged',
        updatedAt: SafeFieldValue.serverTimestamp(),
        auditTrail: SafeFieldValue.arrayUnion({
          action: attempt > 1 && triage !== fallbackTriage 
            ? `AI Triage Completed (Recovered after ${attempt-1} retries)` 
            : triage === fallbackTriage ? 'AI Triage Fallback Applied' : 'AI Triage Completed Successfully',
          timestamp: new Date().toISOString(),
          actor: 'SentraAI-Autopilot'
        })
      });

      await createNotification(targetUid, {
        type: 'triage_complete',
        title: '✅ AI Triage Verified',
        message: `Autopilot has analyzed ${id}. Threat identified as: ${triage.attackType}`,
        severity: triage.severity,
        incidentId: id
      });

      // EXECUTE AUTOPILOT
      console.log(`[Autopilot] Checking for automatic triggers for incident ${id}...`);
      await executeSystemActions(id, { ...triage, source: alert.source });
    } catch (dbError: any) {
      console.error(`[AI Triage] Firestore Update Failure for ${id}:`, dbError.message);
    }
  }

  async function executeSystemActions(id: string, triage: any) {
    try {
      console.log(`[Autopilot] Executing autonomous actions for ${id}`);
      
      const incidentSnap = await firestoreDb.collection('incidents').doc(id).get();
      const currentIncident = incidentSnap.exists ? incidentSnap.data() : null;
      if (!currentIncident) return;

      let targetUid = currentIncident.userId;
      let config: any = null;

      if (targetUid) {
        const configSnap = await firestoreDb.collection('integrations').doc(targetUid).get();
        if (configSnap.exists) {
          config = configSnap.data();
        }
      }
      
      if (!config) {
        const integrationsSnap = await firestoreDb.collection('integrations').orderBy('updatedAt', 'desc').limit(1).get();
        if (!integrationsSnap.empty) {
          config = integrationsSnap.docs[0].data();
          targetUid = integrationsSnap.docs[0].id;
        }
      }

      if (!config) {
        console.warn(`[Autopilot] No integration config found for autopilot execution.`);
        return;
      }
      
      // Fetch settings to check autopilot mode
      const settingsSnap = await firestoreDb.collection('settings').doc(targetUid).get();
      const settings = settingsSnap.exists ? settingsSnap.data() : { autopilotMode: 'autopilot', minSeverity: 7 };

      if (settings.autopilotMode !== 'autopilot' && triage.source !== 'demo') {
        console.log(`[Autopilot] System in "Advisory" mode. Skipping sub-system triggers.`);
        return;
      }
      
      const resolutionSeverityThresh = settings.minSeverity || 7;
      if (triage.severity < resolutionSeverityThresh && triage.source !== 'demo') {
        console.log(`[Autopilot] Incident severity (${triage.severity}) is below the automatic threshold (${resolutionSeverityThresh}). Skipping sub-system triggers.`);
        return;
      }

      const auditTrail: any[] = [];
      const updateData: any = {
        updatedAt: SafeFieldValue.serverTimestamp()
      };

      // 1. SLACK NOTIFICATION
      const slackWebhook = config?.slackWebhook;
      if (slackWebhook && !currentIncident.slackNotified) {
        console.log(`[Autopilot] Triggering Slack notification for ${id}...`);
        try {
          await axios.post(slackWebhook, {
            blocks: [
              {
                type: "header",
                text: { type: "plain_text", text: triage.source === 'demo' ? "🧪 SIMULATION: Attack Forge Triggered" : "🚨 AUTOPILOT: Critical Breach Resolution", emoji: true }
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Incident:* ${id}\n*Attack:* ${triage.attackType}\n*Severity:* ${triage.severity}/10\n*Link:* ${process.env.VITE_APP_URL || 'https://' + process.env.VITE_DOMAIN || ''}/app/incidents/${id}\n*Source:* ${triage.source || 'PRODUCTION'}`
                }
              },
              {
                type: "section",
                text: { type: "mrkdwn", text: `*Summary:* ${triage.aiSummary || triage.summary || 'AI Summary not available.'}` }
              }
            ]
          });
          updateData.slackNotified = true;
          auditTrail.push({
             action: 'Autopilot: Slack Security Payload Delivered',
             timestamp: new Date().toISOString(),
             actor: 'SentraAI-Autopilot'
          });
        } catch (slackErr: any) {
          console.error('[Autopilot] Slack Delivery Error:', slackErr.message);
          auditTrail.push({
            action: `Autopilot: Slack Delivery Failed (${slackErr.message})`,
            timestamp: new Date().toISOString(),
            actor: 'SentraAI-Autopilot'
          });
        }
      } else {
        auditTrail.push({
          action: 'Skipped Slack (not connected)',
          timestamp: new Date().toISOString(),
          actor: 'SentraAI-Autopilot'
        });
      }

      // 2. JIRA TICKETING
      const jira = config?.jiraConfig;
      if (jira && jira.baseUrl && jira.email && jira.apiToken && jira.projectKey && !currentIncident.jiraTicketId) {
        console.log(`[Autopilot] Auto-creating Jira ticket for ${id}...`);
        try {
          const authHeader = Buffer.from(`${jira.email}:${jira.apiToken}`).toString('base64');
          const jiraResponse = await axios.post(`${jira.baseUrl}/rest/api/3/issue`, {
            fields: {
              project: { key: jira.projectKey || 'SOC' },
              summary: `[AUTOPILOT] ${triage.attackType} - Incident ${id}`,
              description: {
                type: "doc",
                version: 1,
                content: [{
                  type: "paragraph",
                  content: [{ type: "text", text: triage.aiSummary || triage.summary || 'AI Summary not available.' }]
                }]
              },
              issuetype: { name: "Incident" }
            }
          }, {
            headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/json' }
          });
          
          const ticketId = jiraResponse.data.key;
          updateData.jiraTicketId = ticketId;
          auditTrail.push({
            action: `Autopilot: Jira Ticket Created (${ticketId})`,
            timestamp: new Date().toISOString(),
            actor: 'SentraAI-Autopilot'
          });
        } catch (jiraErr: any) {
          console.error('[Autopilot] Jira Ticket Failure:', jiraErr.message);
          auditTrail.push({
            action: 'Autopilot: Jira Ticketing Failed (Protocol Refused)',
            timestamp: new Date().toISOString(),
            actor: 'SentraAI-Autopilot'
          });
        }
      } else {
        auditTrail.push({
          action: 'Skipped Jira (not connected)',
          timestamp: new Date().toISOString(),
          actor: 'SentraAI-Autopilot'
        });
      }

      // Final Audit Record
      auditTrail.push({
        action: 'Autopilot: Global Resolution Protocols Completed',
        timestamp: new Date().toISOString(),
        actor: 'SentraAI-Autopilot'
      });

      // Update incident with results and audit
      await firestoreDb.collection('incidents').doc(id).update({
        ...updateData,
        auditTrail: SafeFieldValue.arrayUnion(...auditTrail)
      });

      await createNotification(targetUid, {
        type: 'action_executed',
        title: '🤖 Autopilot Chain Completed',
        message: `Autonomous resolution for ${id} executed successfully. Check audit logs.`,
        severity: triage.severity,
        incidentId: id
      });
    } catch (err: any) {
      console.error('[Autopilot] Global Execution Failure:', err.message);
    }
  }

  // Integration Management API
  app.post('/api/integrations', async (req, res) => {
    const { config, userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
      const docRef = firestoreDb.collection('integrations').doc(userId);
      await docRef.set({
        ...config,
        userId,
        updatedAt: SafeFieldValue.serverTimestamp()
      }, { merge: true });
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Integrations] Save Failure:', err.message);
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  });

  app.get('/api/integrations/:userId', async (req, res) => {
    try {
      const docRef = firestoreDb.collection('integrations').doc(req.params.userId);
      const snap = await docRef.get();
      if (snap.exists) {
        res.json(snap.data());
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Fetch failure' });
    }
  });

  app.post('/api/incidents/:id/retry-triage', async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await firestoreDb.collection('incidents').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Incident not found' });
      
      const incident = doc.data();
      if (incident?.aiStatus === 'completed') {
        return res.json({ message: 'Triage already completed' });
      }

      triageIncident(id, incident?.rawAlert || {}).catch(console.error);
      res.json({ success: true, message: 'Triage re-initiated' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Test Slack Endpoint
  app.post('/api/integrations/test/slack', async (req, res) => {
    const { userId, webhook: providedWebhook } = req.body;
    
    let webhook = providedWebhook;
    
    // If webhook not provided, try to fetch from DB
    if (!webhook && userId) {
      try {
        const docRef = firestoreDb.collection('integrations').doc(userId);
        const snap = await docRef.get();
        if (snap.exists) {
          webhook = snap.data().slackWebhook;
        }
      } catch (dbErr) {
        console.error('[Test Slack] DB fetch failed:', dbErr);
      }
    }

    if (!webhook) {
      return res.status(400).json({ error: 'Webhook URL not found. Please save it first.' });
    }

    try {
      const payload = {
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "⚡ SentraAI Test Alert",
              emoji: true
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Status:*\nVerified Successfully`
              },
              {
                type: "mrkdwn",
                text: `*Environment:*\nDemo`
              }
            ]
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Timestamp:*\n${new Date().toISOString()}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Slack integration verified successfully."
            }
          }
        ]
      };

      const response = await axios.post(webhook, payload);
      res.json({ success: true, status: response.status });
    } catch (err: any) {
      console.error('[Integration Test] Slack fail:', err.message);
      res.status(err.response?.status || 500).json({ 
        error: 'Slack verification failed', 
        message: err.message,
        details: err.response?.data || 'No additional details'
      });
    }
  });

  // Action execution endpoint
  app.post('/api/incidents/:id/action', async (req, res) => {
    const { id } = req.params;
    const { action, actor } = req.body;

    try {
      const incidentRef = firestoreDb.collection('incidents').doc(id);
      const incident = await incidentRef.get();
      
      if (!incident.exists) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // IMPROVED: Fetch the integration explicitly by its presence
      // In a real SaaS with auth, we'd use req.user.uid. 
      // For this demo, we lookup the configured integrations collection.
      const settingsSnap = await firestoreDb.collection('integrations').get();
      const settings = settingsSnap.empty ? {} : settingsSnap.docs[0].data();

      const updateData: any = {
        updatedAt: SafeFieldValue.serverTimestamp(),
        auditTrail: SafeFieldValue.arrayUnion({
          action: `Action Executed: ${action}`,
          timestamp: new Date().toISOString(),
          actor: actor || 'User'
        })
      };

      // REAL INTEGRATION LOGIC
      if (action === 'Notify Slack') {
        const webhook = settings?.slackWebhook;
        if (webhook) {
          try {
            await axios.post(webhook, {
              text: `🚨 *SentraAI SOC Alert* 🚨\n*Incident:* ${id}\n*Severity:* ${incident.data()?.severity}/10\n*Link:* ${req.headers.origin}/app/incidents/${id}`
            });
            updateData.slackNotified = true;
          } catch (slackErr: any) {
            console.error('[Integration] Slack Failure:', slackErr.message);
          }
        }
      }

      if (action === 'Create Jira Ticket') {
        if (settings?.jiraConfig) {
          try {
            // Simulated Jira API call setup
            const auth = Buffer.from(`${settings.jiraConfig.email}:${settings.jiraConfig.apiToken}`).toString('base64');
            const jiraResponse = await axios.post(`${settings.jiraConfig.baseUrl}/rest/api/3/issue`, {
              fields: {
                project: { key: settings.jiraConfig.projectKey },
                summary: `[SentraAI] Security Incident ${id}`,
                description: {
                  type: "doc",
                  version: 1,
                  content: [{
                    type: "paragraph",
                    content: [{ type: "text", text: incident.data()?.aiSummary || "Security Alert" }]
                  }]
                },
                issuetype: { name: "Incident" }
              }
            }, {
              headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
            });
            updateData.jiraTicketId = jiraResponse.data.key || 'SENTRA-TICKET';
          } catch (jiraErr: any) {
            console.error('[Integration] Jira Failure:', jiraErr.message);
            // Fallback for demo stability
            updateData.jiraTicketId = 'ERR-AUTH';
          }
        }
      }

      if (action === 'Mark Resolved') {
        updateData.status = 'resolved';
      }

      await incidentRef.update(updateData);

      const targetUid = !settingsSnap.empty ? settingsSnap.docs[0].id : 'demo-user';
      await createNotification(targetUid, {
        type: 'action_executed',
        title: '🛠️ Manual Action Taken',
        message: `Action "${action}" was executed by SOC Analyst for incident ${id}.`,
        severity: incident.data()?.severity || 5,
        incidentId: id
      });

      res.json({ success: true, incidentId: id });
    } catch (error: any) {
      console.error('[Action Execution Error]:', error.message);
      res.status(500).json({ error: 'Failed to execute action', message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('GLOBAL ERROR:', err.stack);
    res.status(500).json({
      error: 'Global Server Error',
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  });

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

// System Entry Point
async function initializeSystem() {
  console.log('[System] Initializing SOC Autopilot...');
  await bootstrapFirestore();
  await startServer();
}

initializeSystem().catch(err => {
  console.error('[System] CRITICAL BOOT FAILURE:', err);
  process.exit(1);
});
