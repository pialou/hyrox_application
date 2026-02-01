const { Pool } = require('pg');

const pool = new Pool({
    host: '100.107.228.60',
    port: 5432,
    database: 'hyrox_app_db',
    user: 'hyrox_admin',
    password: 'hyrox_secure_pass',
});

async function checkWorkouts() {
    try {
        const res = await pool.query(`
            SELECT id, title, category, session_date, planned_details 
            FROM training_plan 
            WHERE session_date >= CURRENT_DATE 
            ORDER BY session_date ASC 
            LIMIT 3;
        `);

        console.log("Found", res.rows.length, "workouts");
        res.rows.forEach(w => {
            console.log("\n------------------------------------------------");
            console.log(`Workout: ${w.title} (${w.category}) - ${w.session_date}`);
            console.log("Structure:", JSON.stringify(w.planned_details, null, 2));
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkWorkouts();
