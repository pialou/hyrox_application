const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';

// PostgreSQL connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hyrox_app_db',
    user: process.env.DB_USER || 'hyrox_admin',
    password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// CHAT - OpenClaw CLI Proxy
// ============================================
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

app.post('/api/chat', async (req, res) => {
    const { message, sessionKey = 'hyrox-main' } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        console.log('[Chat] Processing message:', message.slice(0, 50) + '...');

        // Escape message for shell
        const escapedMessage = message.replace(/'/g, "'\\''");

        // Use openclaw CLI in --local mode via bash login shell for full environment
        // This ensures PATH and Google OAuth tokens are available
        const command = `bash -l -c "timeout 120 openclaw agent --local --session-id '${sessionKey}' --message '${escapedMessage}' --json" 2>&1`;

        console.log('[Chat] Executing OpenClaw CLI (local mode via bash -l)...');
        const { stdout, stderr } = await execAsync(command, {
            timeout: 130000, // 130s timeout
            maxBuffer: 1024 * 1024 * 5, // 5MB buffer for long responses
        });

        // Parse JSON response
        let response;
        try {
            response = JSON.parse(stdout);
        } catch (parseErr) {
            // If not JSON, use raw stdout as response
            console.log('[Chat] Non-JSON response, using raw output');
            response = { reply: stdout.trim() || 'Réponse reçue mais format inattendu.' };
        }

        console.log('[Chat] Response received, length:', JSON.stringify(response).length);

        // Extract the actual message from response
        const replyText = response.reply
            || response.message
            || response.content
            || response.text
            || response.result
            || (typeof response === 'string' ? response : JSON.stringify(response));

        res.json({
            success: true,
            message: replyText,
            sessionKey: sessionKey
        });

    } catch (error) {
        console.error('[Chat] Error:', error.message);

        // Check if it's a timeout
        if (error.killed || error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
            return res.status(504).json({
                error: 'Le modèle IA prend trop de temps. Réessaie avec une question plus simple.',
                timeout: true
            });
        }

        // Try to extract useful info from stderr
        if (error.stderr) {
            console.error('[Chat] stderr:', error.stderr);
        }

        res.status(500).json({
            error: 'Erreur lors du traitement. Vérifie que OpenClaw est actif sur le serveur.',
            details: error.message
        });
    }
});

// ============================================
// OBJECTIVES CRUD
// ============================================
app.get('/api/objectives', async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM objectives';
        let params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ' ORDER BY target_date ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching objectives:', error);
        res.status(500).json({ error: 'Failed to fetch objectives' });
    }
});

app.post('/api/objectives', async (req, res) => {
    try {
        const { title, target_date, priority, category, target_value, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO objectives (title, target_date, priority, category, target_value, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [title, target_date, priority, category, target_value, notes]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating objective:', error);
        res.status(500).json({ error: 'Failed to create objective' });
    }
});

app.put('/api/objectives/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, target_date, priority, category, target_value, achieved_value, status, notes } = req.body;
        const result = await pool.query(
            `UPDATE objectives SET
                title = COALESCE($1, title),
                target_date = COALESCE($2, target_date),
                priority = COALESCE($3, priority),
                category = COALESCE($4, category),
                target_value = COALESCE($5, target_value),
                achieved_value = COALESCE($6, achieved_value),
                status = COALESCE($7, status),
                notes = COALESCE($8, notes)
             WHERE id = $9
             RETURNING *`,
            [title, target_date, priority, category, target_value, achieved_value, status, notes, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating objective:', error);
        res.status(500).json({ error: 'Failed to update objective' });
    }
});

// ============================================
// COACH MEMORY CRUD
// ============================================
app.get('/api/memory', async (req, res) => {
    try {
        const { type, category, active_only } = req.query;
        let query = 'SELECT * FROM coach_memory WHERE 1=1';
        let params = [];

        if (type) {
            params.push(type);
            query += ` AND memory_type = $${params.length}`;
        }

        if (category) {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }

        if (active_only === 'true') {
            query += ' AND is_active = TRUE';
        }

        query += ' ORDER BY updated_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching memory:', error);
        res.status(500).json({ error: 'Failed to fetch memory' });
    }
});

app.post('/api/memory', async (req, res) => {
    try {
        const { memory_type, category, title, content, week_start } = req.body;
        const result = await pool.query(
            `INSERT INTO coach_memory (memory_type, category, title, content, week_start)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [memory_type, category, title, content, week_start]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating memory:', error);
        res.status(500).json({ error: 'Failed to create memory' });
    }
});

app.put('/api/memory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, is_active, title } = req.body;
        const result = await pool.query(
            `UPDATE coach_memory SET
                content = COALESCE($1, content),
                is_active = COALESCE($2, is_active),
                title = COALESCE($3, title),
                updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [content, is_active, title, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating memory:', error);
        res.status(500).json({ error: 'Failed to update memory' });
    }
});

// ============================================
// TRAINING LOCATIONS
// ============================================
app.get('/api/locations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM training_locations ORDER BY is_default DESC, name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

// ============================================
// STRAVA WEBHOOK TRIGGER (called by n8n)
// ============================================
app.post('/api/strava/webhook-trigger', async (req, res) => {
    try {
        const { activity_id } = req.body;

        // Get the activity from strava_sync
        const activityResult = await pool.query(
            'SELECT * FROM strava_sync WHERE activity_id = $1',
            [activity_id]
        );

        if (activityResult.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const activity = activityResult.rows[0];
        const activityDate = new Date(activity.start_date).toISOString().split('T')[0];

        // Find matching planned session on same day
        const matchResult = await pool.query(
            `SELECT * FROM training_plan
             WHERE session_date::date = $1
             AND status = 'planned'
             AND strava_activity_id IS NULL
             LIMIT 1`,
            [activityDate]
        );

        if (matchResult.rows.length > 0) {
            // Update existing planned session
            const session = matchResult.rows[0];
            await pool.query(
                `UPDATE training_plan SET
                    status = 'completed',
                    strava_activity_id = $1,
                    distance_km = $2,
                    duration_minutes = $3,
                    training_load_tss = $4,
                    updated_at = NOW()
                 WHERE id = $5`,
                [
                    activity.activity_id,
                    activity.distance / 1000,
                    Math.round(activity.moving_time / 60),
                    activity.suffer_score,
                    session.id
                ]
            );
            res.json({ action: 'updated', session_id: session.id });
        } else {
            // Create new session from Strava activity
            const newSession = await pool.query(
                `INSERT INTO training_plan (title, category, session_date, status, strava_activity_id, distance_km, duration_minutes, training_load_tss)
                 VALUES ($1, $2, $3, 'completed', $4, $5, $6, $7)
                 RETURNING id`,
                [
                    activity.name,
                    activity.type,
                    activity.start_date,
                    activity.activity_id,
                    activity.distance / 1000,
                    Math.round(activity.moving_time / 60),
                    activity.suffer_score
                ]
            );
            res.json({ action: 'created', session_id: newSession.rows[0].id });
        }
    } catch (error) {
        console.error('Strava webhook trigger error:', error);
        res.status(500).json({ error: 'Failed to process Strava activity' });
    }
});

// ============================================
// WORKOUTS (existing)
// ============================================
app.get('/api/workouts', async (req, res) => {
    try {
        const { date, status } = req.query;

        let query = 'SELECT id, title, category, session_date, status, planned_details, duration_minutes, is_structured FROM training_plan';
        let params = [];
        let conditions = [];

        if (date) {
            conditions.push(`session_date::date = $${params.length + 1}`);
            params.push(date);
        }

        if (status) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY session_date DESC LIMIT 50';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

app.get('/api/workouts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM training_plan WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching workout:', error);
        res.status(500).json({ error: 'Failed to fetch workout' });
    }
});

// Create workout (including empty ones for WOD)
app.post('/api/workouts', async (req, res) => {
    try {
        const { title, category, session_date, planned_details, is_structured, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO training_plan (title, category, session_date, planned_details, is_structured, athlete_comments)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                title || 'WOD à définir',
                category || 'CrossFit',
                session_date,
                planned_details || { sections: [] },
                is_structured ?? false,
                notes
            ]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating workout:', error);
        res.status(500).json({ error: 'Failed to create workout' });
    }
});

// Update workout
app.put('/api/workouts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, session_date, planned_details, status, is_structured } = req.body;
        const result = await pool.query(
            `UPDATE training_plan SET
                title = COALESCE($1, title),
                category = COALESCE($2, category),
                session_date = COALESCE($3, session_date),
                planned_details = COALESCE($4, planned_details),
                status = COALESCE($5, status),
                is_structured = COALESCE($6, is_structured),
                updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
            [title, category, session_date, planned_details, status, is_structured, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating workout:', error);
        res.status(500).json({ error: 'Failed to update workout' });
    }
});

// Delete workout
app.delete('/api/workouts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM training_plan WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

// Complete workout
app.post('/api/workouts/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { executedDetails, rpe, durationMinutes, athleteComments } = req.body;

        const result = await pool.query(
            `UPDATE training_plan
       SET status = 'completed',
           executed_details = $1,
           rpe = $2,
           duration_minutes = $3,
           athlete_comments = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
            [executedDetails, rpe, durationMinutes, athleteComments, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error completing workout:', error);
        res.status(500).json({ error: 'Failed to complete workout' });
    }
});

// ============================================
// ATHLETE & STRAVA STATS
// ============================================
app.get('/api/athlete/metrics', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM athlete_metrics ORDER BY updated_at DESC LIMIT 1'
        );
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error('Error fetching athlete metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

app.get('/api/athlete/profile', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM athlete_profile ORDER BY created_at DESC LIMIT 1'
        );
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error('Error fetching athlete profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.get('/api/strava/activities', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM strava_sync ORDER BY start_date DESC LIMIT 20'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching Strava activities:', error);
        res.status(500).json({ error: 'Failed to fetch Strava activities' });
    }
});

app.get('/api/strava/stats', async (req, res) => {
    try {
        // Get stats for the current week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);

        const result = await pool.query(
            `SELECT
                COALESCE(SUM(distance::numeric / 1000), 0) as total_distance_km,
                COALESCE(SUM(suffer_score), 0) as total_load,
                COUNT(*) as activity_count
             FROM strava_sync
             WHERE start_date >= $1`,
            [weekStart.toISOString()]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching Strava stats:', error);
        res.status(500).json({ error: 'Failed to fetch Strava stats' });
    }
});

// ============================================
// N8N TRIGGER (existing)
// ============================================
app.post('/api/n8n/trigger/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const n8nApiKey = process.env.N8N_API_KEY;
        const n8nUrl = process.env.N8N_URL || 'http://localhost:5678';

        const response = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}/execute`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error triggering n8n workflow:', error);
        res.status(500).json({ error: 'Failed to trigger workflow' });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Hyrox API Server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    console.log(`🤖 OpenClaw Gateway: ${OPENCLAW_GATEWAY_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    pool.end();
    process.exit(0);
});
