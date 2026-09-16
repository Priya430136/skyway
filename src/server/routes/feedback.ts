import { Router } from "express";
import { getDb, isDbConnected, schema } from "../../db";
import { store, type FeedbackRecord } from "../store";
import { desc, eq } from "drizzle-orm";

export const feedbackRouter = Router();

// Ensure PostgreSQL feedback table exists when DB is connected
async function ensureFeedbackTable() {
  try {
    const connected = await isDbConnected();
    if (!connected) return;
    const db = getDb();
    // Raw query to ensure table schema matches PostgreSQL expectations
    await (db as any).$client?.query?.(`
      CREATE TABLE IF NOT EXISTS feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pnr VARCHAR(12),
        flight_number VARCHAR(20),
        passenger_name TEXT NOT NULL,
        passenger_email TEXT NOT NULL,
        overall_rating INTEGER NOT NULL,
        flight_crew_rating INTEGER DEFAULT 5,
        cabin_cleanliness_rating INTEGER DEFAULT 5,
        food_beverage_rating INTEGER DEFAULT 5,
        punctuality_rating INTEGER DEFAULT 5,
        recommend_airline BOOLEAN DEFAULT true,
        comments TEXT,
        highlight_tags JSONB DEFAULT '[]'::jsonb,
        follow_up_requested BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
  } catch (err) {
    // Non-blocking initialization
    console.warn("Feedback table check note:", err);
  }
}

// Fire table check non-blockingly
ensureFeedbackTable().catch(() => {});

// GET /api/feedback - Retrieve passenger feedback surveys
feedbackRouter.get("/", async (req, res) => {
  const email = req.query.email as string;
  const pnr = req.query.pnr as string;

  try {
    const connected = await isDbConnected();
    if (connected) {
      const db = getDb();
      const records = await db.select().from(schema.feedback).orderBy(desc(schema.feedback.createdAt));
      
      let filtered = records;
      if (email) {
        filtered = filtered.filter(
          (f) => f.passengerEmail.toLowerCase() === email.toLowerCase()
        );
      }
      if (pnr) {
        filtered = filtered.filter(
          (f) => f.pnr?.toUpperCase() === pnr.toUpperCase()
        );
      }

      return res.json({
        success: true,
        source: "postgresql",
        feedback: filtered,
      });
    }
  } catch (dbErr) {
    console.warn("Falling back to store for feedback:", dbErr);
  }

  // In-memory fallback
  let items = store.feedback;
  if (email) {
    items = items.filter(
      (f) => f.passengerEmail.toLowerCase() === email.toLowerCase()
    );
  }
  if (pnr) {
    items = items.filter(
      (f) => f.pnr?.toUpperCase() === pnr.toUpperCase()
    );
  }

  return res.json({
    success: true,
    source: "memory_store",
    feedback: items,
  });
});

// GET /api/feedback/summary - Aggregate satisfaction survey statistics
feedbackRouter.get("/summary", async (req, res) => {
  try {
    let allFeedback: any[] = [];
    const connected = await isDbConnected();
    if (connected) {
      try {
        const db = getDb();
        allFeedback = await db.select().from(schema.feedback);
      } catch {
        allFeedback = store.feedback;
      }
    } else {
      allFeedback = store.feedback;
    }

    if (allFeedback.length === 0) {
      return res.json({
        success: true,
        totalSurveys: 0,
        averageOverallRating: 4.8,
        npsScore: 92,
        criteriaAverages: {
          flightCrew: 4.9,
          cleanliness: 4.8,
          foodBeverage: 4.6,
          punctuality: 4.8,
        },
        topTags: ["Smooth Landing", "Attentive Crew", "On-Time Arrival"],
      });
    }

    const total = allFeedback.length;
    const avgOverall = (
      allFeedback.reduce((acc, f) => acc + (f.overallRating || 5), 0) / total
    ).toFixed(1);

    const avgCrew = (
      allFeedback.reduce((acc, f) => acc + (f.flightCrewRating || 5), 0) / total
    ).toFixed(1);

    const avgClean = (
      allFeedback.reduce((acc, f) => acc + (f.cabinCleanlinessRating || 5), 0) / total
    ).toFixed(1);

    const avgFood = (
      allFeedback.reduce((acc, f) => acc + (f.foodBeverageRating || 5), 0) / total
    ).toFixed(1);

    const avgPunctuality = (
      allFeedback.reduce((acc, f) => acc + (f.punctualityRating || 5), 0) / total
    ).toFixed(1);

    const recommendCount = allFeedback.filter((f) => f.recommendAirline !== false).length;
    const npsScore = Math.round((recommendCount / total) * 100);

    // Tag counts
    const tagMap: Record<string, number> = {};
    for (const f of allFeedback) {
      const tags = Array.isArray(f.highlightTags) ? f.highlightTags : [];
      for (const t of tags) {
        tagMap[t] = (tagMap[t] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);

    return res.json({
      success: true,
      totalSurveys: total,
      averageOverallRating: parseFloat(avgOverall),
      npsScore,
      criteriaAverages: {
        flightCrew: parseFloat(avgCrew),
        cleanliness: parseFloat(avgClean),
        foodBeverage: parseFloat(avgFood),
        punctuality: parseFloat(avgPunctuality),
      },
      topTags: topTags.length > 0 ? topTags : ["Attentive Crew", "Smooth Landing", "On-Time Arrival"],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to calculate feedback summary",
    });
  }
});

// POST /api/feedback - Submit post-flight satisfaction survey
feedbackRouter.post("/", async (req, res) => {
  const {
    pnr,
    flightNumber,
    passengerName,
    passengerEmail,
    overallRating,
    flightCrewRating = 5,
    cabinCleanlinessRating = 5,
    foodBeverageRating = 5,
    punctualityRating = 5,
    recommendAirline = true,
    comments = "",
    highlightTags = [],
    followUpRequested = false,
  } = req.body || {};

  if (!passengerName || !passengerEmail || !overallRating) {
    return res.status(400).json({
      success: false,
      message: "passengerName, passengerEmail, and overallRating (1-5) are required.",
    });
  }

  const numericRating = Math.min(5, Math.max(1, parseInt(String(overallRating), 10) || 5));

  const newFeedbackRecord: FeedbackRecord = {
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    pnr: pnr ? String(pnr).trim().toUpperCase() : undefined,
    flightNumber: flightNumber ? String(flightNumber).trim().toUpperCase() : undefined,
    passengerName: String(passengerName).trim(),
    passengerEmail: String(passengerEmail).trim().toLowerCase(),
    overallRating: numericRating,
    flightCrewRating: Math.min(5, Math.max(1, parseInt(String(flightCrewRating), 10) || 5)),
    cabinCleanlinessRating: Math.min(5, Math.max(1, parseInt(String(cabinCleanlinessRating), 10) || 5)),
    foodBeverageRating: Math.min(5, Math.max(1, parseInt(String(foodBeverageRating), 10) || 5)),
    punctualityRating: Math.min(5, Math.max(1, parseInt(String(punctualityRating), 10) || 5)),
    recommendAirline: Boolean(recommendAirline),
    comments: comments ? String(comments).trim() : "",
    highlightTags: Array.isArray(highlightTags) ? highlightTags : [],
    followUpRequested: Boolean(followUpRequested),
    createdAt: new Date().toISOString(),
  };

  // Sync with in-memory store
  store.addFeedback(newFeedbackRecord);

  // Persist into PostgreSQL
  let dbInserted = false;
  try {
    const connected = await isDbConnected();
    if (connected) {
      const db = getDb();
      await db.insert(schema.feedback).values({
        pnr: newFeedbackRecord.pnr,
        flightNumber: newFeedbackRecord.flightNumber,
        passengerName: newFeedbackRecord.passengerName,
        passengerEmail: newFeedbackRecord.passengerEmail,
        overallRating: newFeedbackRecord.overallRating,
        flightCrewRating: newFeedbackRecord.flightCrewRating,
        cabinCleanlinessRating: newFeedbackRecord.cabinCleanlinessRating,
        foodBeverageRating: newFeedbackRecord.foodBeverageRating,
        punctualityRating: newFeedbackRecord.punctualityRating,
        recommendAirline: newFeedbackRecord.recommendAirline,
        comments: newFeedbackRecord.comments,
        highlightTags: newFeedbackRecord.highlightTags,
        followUpRequested: newFeedbackRecord.followUpRequested,
      });
      dbInserted = true;
    }
  } catch (dbErr) {
    console.warn("Could not insert feedback directly into PostgreSQL:", dbErr);
  }

  return res.status(201).json({
    success: true,
    message: "Post-flight satisfaction feedback recorded successfully. Thank you for helping us elevate SkyWay Airlines!",
    storedInPostgres: dbInserted,
    bonusMilesAwarded: 250,
    feedback: newFeedbackRecord,
  });
});
