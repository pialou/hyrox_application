const { Pool } = require('pg');

const pool = new Pool({
    host: '100.107.228.60',
    port: 5432,
    database: 'hyrox_app_db',
    user: 'hyrox_admin',
    password: 'hyrox_secure_pass',
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function transformExercise(exStringOrObj) {
    if (typeof exStringOrObj === 'string') {
        return {
            id: uuidv4(),
            name: exStringOrObj,
            reps: null,
            duration: null
        };
    }
    // Already an object (from Notion import usually)
    return {
        id: uuidv4(),
        name: exStringOrObj.exercise || "Exercise",
        reps: parseInt(exStringOrObj.reps) || null,
        duration: null, // Could parse from unit if needed
        distance: exStringOrObj.unit === 'm' ? parseInt(exStringOrObj.reps) : null,
        notes: exStringOrObj.audio_alert
    };
}


async function migrate() {
    try {
        // Fetch all planned workouts
        const res = await pool.query(`SELECT id, title, planned_details FROM training_plan`);
        console.log(`Found ${res.rows.length} workouts to migrate...`);

        for (const row of res.rows) {
            const old = row.planned_details;

            // Skip if already migrated (has sections array)
            if (old.sections && Array.isArray(old.sections)) {
                console.log(`Skipping ${row.title} (already v2)`);
                continue;
            }

            const newStructure = {
                sections: []
            };

            // 1. Warmup
            if (old.warmup) {
                const exercises = Array.isArray(old.warmup.exercises)
                    ? old.warmup.exercises.map(transformExercise)
                    : [];

                newStructure.sections.push({
                    id: uuidv4(),
                    type: "Warmup",
                    title: "Échauffement",
                    duration: 600, // Default 10 min
                    exercises: exercises,
                    notes: old.warmup.description
                });
            }

            // 2. Main Piece
            if (old.main_piece) {
                let type = "Rounds";
                if (old.main_piece.format === "EMOM") type = "EMOM";
                else if (old.main_piece.format === "AMRAP") type = "AMRAP";
                else if (old.main_piece.format === "FOR_TIME") type = "ForTime";

                const exercises = Array.isArray(old.main_piece.intervals)
                    ? old.main_piece.intervals.map(transformExercise)
                    : [];

                newStructure.sections.push({
                    id: uuidv4(),
                    type: type,
                    title: "Corps de séance",
                    duration: (old.main_piece.time_cap_min || 0) * 60,
                    intervalDuration: type === "EMOM" ? 60 : null,
                    exercises: exercises,
                    notes: old.main_piece.notes
                });
            }

            // 3. Cool Down
            if (old.cool_down) {
                const exercises = Array.isArray(old.cool_down.exercises)
                    ? old.cool_down.exercises.map(transformExercise)
                    : [];

                newStructure.sections.push({
                    id: uuidv4(),
                    type: "CoolDown",
                    title: "Retour au calme",
                    duration: 300, // Default 5 min
                    exercises: exercises,
                    notes: old.cool_down.description
                });
            }

            // Update in DB
            await pool.query(
                `UPDATE training_plan SET planned_details = $1 WHERE id = $2`,
                [JSON.stringify(newStructure), row.id]
            );
            console.log(`Migrated: ${row.title}`);
        }
        console.log("Migration complete!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
