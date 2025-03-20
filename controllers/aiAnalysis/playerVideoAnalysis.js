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

    const prompt = `Analyze the provided video to determine if it depicts a RECOGNIZABLE athletic performance. Respond with YES or NO. ONLY proceed with analysis if the answer is a definitive YES.

    **CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:**
    
    1. **VIDEO VALIDATION (STRICT CRITERIA):**
       - The video MUST clearly show one or more people ACTIVELY engaged in a recognizable sport or athletic activity. This requires obvious physical exertion and purposeful movement directly related to a known sport's techniques or training.
       - Examples of VALID sports/activities: Basketball, soccer, tennis, American football, running, weightlifting, gymnastics, swimming, volleyball, yoga (demonstrating poses/flows only), martial arts, dance (athletic styles like ballet, contemporary, hip-hop - not casual social dancing), etc.
       - **INVALID CONTENT (DO NOT ANALYZE):**
         - Buildings, landscapes, structures, or any other inanimate objects.
         - Animals (of any kind).
         - Video games, animations, or digital content.
         - Everyday activities like cooking, working, cleaning, shopping, etc.
         - Unclear, blurry, obstructed, or poorly lit videos where the activity is NOT clearly identifiable as a sport.
    
    2. **ANALYSIS (ONLY IF 100% VALID - NO EXCEPTIONS):**
       - ONLY if the video absolutely and undeniably meets ALL criteria for a VALID athletic performance:
         - Provide a detailed analysis of the athlete's performance in the video.
         - Identify specific strengths and weaknesses in their demonstrated technique.
         - Offer concrete suggestions for improvement based on the video.
         - Recommend specific training areas relevant to the observed performance.
    
    3. **OUTPUT (STRICT JSON - NO EXCEPTIONS):**
       - ALWAYS respond in valid JSON. No extra text or explanations outside the JSON.
       - If the video is VALID (100% certain):
         \`\`\`json
         {
           "valid_video": true,
           "strengths": ["Specific strength 1", "Specific strength 2"],
           "weaknesses": ["Specific weakness 1", "Specific weakness 2"],
           "performance_suggestions": ["Concrete suggestion 1", "Concrete suggestion 2"],
           "training_focus_areas": ["Specific training area 1", "Specific training area 2"]
         }
         \`\`\`
       - If the video is INVALID (for ANY reason):
         \`\`\`json
         {
           "valid_video": false,
           "reason": "A clear, concise, and SPECIFIC explanation. Examples: 'The video shows a building; no athletic activity is present.', 'No person is engaged in a recognizable sport or athletic activity.', 'The video quality is too poor to identify any athletic movement.', 'The video shows people walking, which is not suitable for performance analysis.', 'The primary focus is on [incorrect subject], not on athletic performance.'"
         }
         \`\`\`
    
    **Video URL:** ${videoUrl}
    
    **YOUR SOLE PURPOSE IS TO ANALYZE ATHLETIC PERFORMANCE. DO NOT HALLUCINATE. If the video does not show a recognizable athletic activity, return valid_video: false with a specific reason. Be EXTREMELY STRICT. Err on the side of INVALID if there is ANY doubt whatsoever. The "valid_video" and "reason" fields are ABSOLUTELY MANDATORY.**
    `;

    const analysisResponse = await getAIResponse(prompt);

    let suggestionData;
    try {
      const cleanedResponse = analysisResponse.replace(
        /^```json\n|\n```$/g,
        ''
      );
      suggestionData = JSON.parse(cleanedResponse);

      // Check if the video was deemed valid
      if (suggestionData.valid_video === false) {
        // Handle the invalid video case
        return res.status(400).json({
          success: false,
          message: 'Video is not suitable for analysis.',
          reason: suggestionData.reason,
          gere: { ...suggestionData },
        });
      }

      // If valid_video is true, proceed with saving the analysis
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI analysis' });
    }

    // Save analysis in Firestore (only if valid)
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
      return res.status(404).json({
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
