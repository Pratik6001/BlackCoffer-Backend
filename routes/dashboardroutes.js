const express = require("express");
const router = express.Router();
const Data = require("../models/data");

// Route to get all unique field values
router.get("/unique-filters", async (req, res) => {
  try {
    const fieldsToExtract = [
      "end_year",
      "sector",
      "topic",
      "region",
      "country",
      "pestle",
      "source",
    ];

    const result = {};

    for (const field of fieldsToExtract) {
      result[field] = await Data.distinct(field, { [field]: { $ne: "" } });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unique values", error });
  }
});

router.get("/filter-data", async (req, res) => {
  try {
    const rawQuery = req.query;

    if (!rawQuery || typeof rawQuery !== "object") {
      return res.status(400).json({ message: "Query parameters are required" });
    }

    // Build match stage dynamically
    const match = {};
    for (let key in rawQuery) {
      let value = rawQuery[key];

      if (!value || value.trim() === "") continue;
      value = value.trim();

      // Convert numeric fields
      if (key === "end_year" && !isNaN(value)) {
        value = parseInt(value);
      }

      match[key] = value;
    }

    // Aggregation pipeline
    const results = await Data.aggregate([
      { $match: match },
      {
        $facet: {
          data: [{ $match: {} }],
          averages: [
            {
              $group: {
                _id: null,
                avgIntensity: { $avg: "$intensity" },
                avgLikelihood: { $avg: "$likelihood" },
                avgRelevance: { $avg: "$relevance" },
              },
            },
          ],
        },
      },
    ]);

    const data = results[0]?.data || [];
    const averages = results[0]?.averages?.[0] || {};

    if (data.length === 0) {
      return res.status(404).json({
        message: "No data found matching the current filter criteria.",
      });
    }

    return res.status(200).json({
      data,
      averages: {
        intensity: averages.avgIntensity || 0,
        likelihood: averages.avgLikelihood || 0,
        relevance: averages.avgRelevance || 0,
      },
    });
  } catch (error) {
    console.error("Filter error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
