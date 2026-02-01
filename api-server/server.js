const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hyrox_app_db',
    user: process.env.DB_USER || 'pialou',
    password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get workouts (with date filter)
app.get('/api/workouts', async (req, res) => {
    try {
        const { date, status } = req.query;

        let query = 'SELECT id, title, category, session_date, status, planned_details, duration_minutes FROM training_plan';
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

        query += ' ORDER BY session_date DESC LIMIT 20';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// Get single workout by ID
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

// Save workout result
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

// Trigger n8n workflow
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

// Get athlete metrics
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

// Get Strava activities
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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Hyrox API Server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    pool.end();
    process.exit(0);
});
