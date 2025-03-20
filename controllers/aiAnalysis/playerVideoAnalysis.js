import { db } from '../../config/firebaseConfig.js';
import { getAIResponse } from '../../services/aiService.js';
import cloudinary from '../../config/cloudinary.js';

export const analyzePlayerPerformance = async (req, res) => {
  try {
    const { athleteId } = req.params;

    // Validate athleteId
    if (
      !athleteId ||
      typeof athleteId !== 'string' ||
      athleteId.trim() === ''
    ) {
      return res.status(400).json({ error: 'Invalid athlete ID provided' });
    }

    // Check if we have the uploaded file URL from the middleware
    if (!req.uploadedFileUrl) {
      return res.status(400).json({
        error: 'No video URL available. File upload may have failed.',
        fileInfo: req.file
          ? {
              mimetype: req.file.mimetype,
              size: req.file.size,
              buffer: req.file.buffer ? 'Buffer exists' : 'No buffer',
            }
          : 'No file data',
      });
    }

    const videoUrl = req.uploadedFileUrl;

    // Check if there's an existing document for this athlete
    let performanceData = null;
    let existingVideoUrl = null;

    try {
      const performanceDoc = await db
        .collection('AthletePerformance')
        .doc(athleteId.trim())
        .get();

      if (performanceDoc.exists) {
        performanceData = performanceDoc.data();
        existingVideoUrl = performanceData.videoUrl;
      } else {
        performanceData = {};
      }
    } catch (dbError) {
      console.error('Error fetching athlete data:', dbError);
      performanceData = {};
    }

    // If there's an existing video URL, delete it from Cloudinary
    if (existingVideoUrl && existingVideoUrl !== videoUrl) {
      try {
        // Extract public_id from the URL
        const urlParts = existingVideoUrl.split('/');
        const publicIdWithFolder = urlParts
          .slice(urlParts.length - 2)
          .join('/');
        const publicId = publicIdWithFolder.split('.')[0]; // Remove file extension if present

        if (publicId) {
          // Delete the video from Cloudinary
          await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video',
          });
          console.log(`Deleted previous video with public_id: ${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error(
          'Error deleting previous video from Cloudinary:',
          cloudinaryError
        );
        // Continue with the process even if deletion fails
      }
    }

    // Prepare AI prompt with video URL
    const prompt = `
      Analyze the player's performance based on the following video:
      ${videoUrl}
      Athlete performance data: ${JSON.stringify(performanceData)}

      Provide a detailed analysis including:
      - Strengths
      - Weaknesses
      - Suggestions for improvement
      - Recommended training areas

      Example Output:
      {
        "strengths": "[List of strengths]",
        "weaknesses": "[List of weaknesses]",
        "performance_suggestions": "[Suggestions]",
        "training_focus_areas": "[Focus areas]"
      }
    `;

    // Get AI response using Gemini API
    const analysisResponse = await getAIResponse(prompt);

    let suggestionData;
    try {
      const cleanedResponse = analysisResponse.replace(
        /^```json\n|\n```$/g,
        ''
      );
      suggestionData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI analysis' });
    }

    // Save analysis in Firestore
    await db
      .collection('AthletePerformance')
      .doc(athleteId.trim())
      .set(
        {
          videoUrl,
          ...suggestionData,
          createdAt: new Date(),
        },
        { merge: true }
      );

    return res.json({
      success: true,
      analysis: suggestionData,
      videoUrl: videoUrl,
    });
  } catch (error) {
    console.error('Error analyzing player performance:', error);
    return res.status(500).json({
      error: 'Failed to analyze player performance',
      message: error.message,
      stack: error.stack,
    });
  }
};

export const getPlayerVideoPerformance = async (req, res) => {
  try {
    const { athleteId } = req.params;
    const performanceDoc = await db
      .collection('AthletePerformance')
      .doc(athleteId.trim())
      .get();
    const performanceData = performanceDoc.exists
      ? performanceDoc.data()
      : null;

    if (!performanceData) {
      return res.status(404).json({ error: 'Performance data not found' });
    }

    const {
      strengths,
      weaknesses,
      performance_suggestions,
      training_focus_areas,
      videoUrl,
    } = performanceData;

    if (
      !strengths &&
      !weaknesses &&
      !performance_suggestions &&
      !training_focus_areas &&
      !videoUrl
    ) {
      return res
        .status(404)
        .json({
          status: true,
          message: 'Required performance fields not found',
        });
    }

    return res.json({
      success: true,
      message: 'Player performance data retrieved successfully',
      data: {
        strengths: strengths || 'No strengths available',
        weaknesses: weaknesses || 'No weaknesses available',
        performance_suggestions:
          performance_suggestions || 'No performance suggestions available',
        training_focus_areas:
          training_focus_areas || 'No training focus areas available',
        videoUrl: videoUrl || 'No video',
      },
    });
  } catch (error) {
    console.error('Error fetching player performance data:', error);
    return res.status(500).json({
      error: 'Failed to get player performance data',
    });
  }
};
