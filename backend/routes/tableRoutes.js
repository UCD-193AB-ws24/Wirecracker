import express from 'express';
import { supabase, TABLE_NAMES } from './utils.js';

const router = express.Router();

// Fetch table names
router.get("/tables", async (req, res) => {
  res.json({ tables: TABLE_NAMES });
});

// Fetch data from a specific table
router.get("/tables/:table", async (req, res) => {
  const { table } = req.params;
  
  if (!TABLE_NAMES.includes(table)) {
    return res.status(400).json({ error: "Invalid table name" });
  }

  try {
    const { data, error } = await supabase.from(table).select("*").limit(100);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Error fetching table data" });
  }
});

export default router; 