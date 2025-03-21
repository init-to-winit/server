import { isValidNumber } from 'aadhaar-validator';
import { db } from '../../config/firebaseConfig.js';
import { getAIResponse } from '../../services/aiService.js';
import multer from 'multer';
import cloudinary from '../../config/cloudinary.js';
import { get as httpGet } from 'http';
import { get as httpsGet } from 'https';
import { promisify } from 'util';

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware for handling file uploads
export const uploadVerificationDocs = upload.fields([
  { name: 'certificates', maxCount: 5 }, // Allow up to 5 certificates
]);

// Direct Cloudinary upload function (not middleware)
const uploadToCloudinary = (fileBuffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(fileBuffer);
  });
};

export const verifyAthlete = async (req, res) => {
  const { id } = req.params;
  const { aadharNumber } = req.body;

  try {
    // Check if athlete exists
    const athleteRef = db.collection('Athletes').doc(id);
    const athleteSnapshot = await athleteRef.get();

    if (!athleteSnapshot.exists) {
      return res
        .status(404)
        .json({ status: false, error: 'Athlete not found' });
    }

    // Validate Aadhar number
    // FIX: The isValidNumber logic appears to be inverted
    if (!aadharNumber || !isValidNumber(aadharNumber)) {
      return res.status(400).json({
        status: false,
        error: 'Valid 12-digit Aadhar number is required',
      });
    }

    // Process certificates if provided
    const certificatesResults = [];
    const certificatesVerification = [];
    const files = req.files;

    if (files && files.certificates && files.certificates.length > 0) {
      for (const certFile of files.certificates) {
        // FIX: Use direct Cloudinary upload instead of middleware
        const certResult = await uploadToCloudinary(
          certFile.buffer,
          'VISMOH/certificates',
          certFile.mimetype.startsWith('image') ? 'image' : 'raw'
        );

        certificatesResults.push({
          name: certFile.originalname,
          url: certResult.secure_url,
          publicId: certResult.public_id,
          format: certResult.format || certFile.mimetype.split('/')[1],
        });

        // Verify certificate using AI
        const aiPrompt = `
          I need to verify if this appears to be a legitimate athletic certificate or sports-related credential.
          
          Certificate name: ${certFile.originalname}
          File type: ${certFile.mimetype}
          URL: ${certResult.secure_url}
          
          Please analyze the following:
          1. Does this appear to be a genuine sports certificate based on available data?
          2. Are there any obvious signs of forgery or inconsistency?
          3. Provide a confidence score (0-100) on its authenticity.
          4. Summarize your findings in one sentence.
          
          Format your response as a JSON object with keys: isLegitimate (boolean), confidenceScore (number), reasoning (string), summary (string).
        `;

        const aiResponse = await getAIResponse(aiPrompt);
        let aiResult;

        try {
          // Parse AI response assuming it returns JSON
          aiResult = JSON.parse(aiResponse);
        } catch (parseError) {
          // Fallback if AI doesn't return valid JSON
          aiResult = {
            isLegitimate: null,
            confidenceScore: 0,
            reasoning: 'Failed to parse AI response',
            summary: aiResponse.substring(0, 100) + '...',
          };
        }

        certificatesVerification.push({
          certificate: certFile.originalname,
          aiVerification: aiResult,
        });
      }
    }

    // Create verification document in the Verification collection
    await db
      .collection('Verification')
      .doc(id)
      .set({
        athleteId: id,
        idVerification: {
          idType: 'aadhar',
          aadharNumber: `XXXX-XXXX-${aadharNumber.slice(-4)}`,
          certificates: certificatesResults,
          certificatesVerification,
          verificationStatus: 'verified',
          verificationMethod: 'ai-assisted',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      });

    // Update athlete reference to verification
    await athleteRef.update({
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      status: true,
      message: 'Athlete verification completed successfully',
      verification: {
        status: 'verified',
        idType: 'aadhar',
        aadharLastFour: aadharNumber.slice(-4),
        certificatesCount: certificatesResults.length,
        certificatesVerified: certificatesVerification.length,
      },
    });
  } catch (error) {
    console.error('Athlete verification error:', error);
    res.status(500).json({ status: false, error: error.message });
  }
};

//verifycoach controller
export const verifyCoach = async (req, res) => {
  const { id } = req.params;
  const { aadharNumber, experienceYears, teamAffiliation, licenseNumber } =
    req.body;

  try {
    // Check if coach exists
    const coachRef = db.collection('Coaches').doc(id);
    const coachSnapshot = await coachRef.get();

    if (!coachSnapshot.exists) {
      return res.status(404).json({ status: false, error: 'Coach not found' });
    }

    // Validate Aadhar number
    if (!aadharNumber || !isValidNumber(aadharNumber)) {
      return res.status(400).json({
        status: false,
        error: 'Valid 12-digit Aadhar number is required',
      });
    }

    // Process certificates if provided
    const certificatesResults = [];
    const certificatesVerification = [];
    const files = req.files;

    if (files && files.certificates && files.certificates.length > 0) {
      for (const certFile of files.certificates) {
        // Upload certificate to Cloudinary
        const certResult = await uploadToCloudinary(
          certFile.buffer,
          'VISMOH/certificates',
          certFile.mimetype.startsWith('image') ? 'image' : 'raw'
        );

        certificatesResults.push({
          name: certFile.originalname,
          url: certResult.secure_url,
          publicId: certResult.public_id,
          format: certResult.format || certFile.mimetype.split('/')[1],
        });

        // Verify certificate using AI
        const aiPrompt = `
          I need to verify if this appears to be a legitimate coaching certificate.
          
          Certificate name: ${certFile.originalname}
          File type: ${certFile.mimetype}
          URL: ${certResult.secure_url}
          
          Please analyze the following:
          1. Does this appear to be a genuine coaching certification?
          2. Are there any obvious signs of forgery or inconsistency?
          3. Provide a confidence score (0-100) on its authenticity.
          4. Summarize your findings in one sentence.
          
          Format your response as a JSON object with keys: isLegitimate (boolean), confidenceScore (number), reasoning (string), summary (string).
        `;

        const aiResponse = await getAIResponse(aiPrompt);
        let aiResult;

        try {
          aiResult = JSON.parse(aiResponse);
        } catch (parseError) {
          aiResult = {
            isLegitimate: null,
            confidenceScore: 0,
            reasoning: 'Failed to parse AI response',
            summary: aiResponse.substring(0, 100) + '...',
          };
        }

        certificatesVerification.push({
          certificate: certFile.originalname,
          aiVerification: aiResult,
        });
      }
    }

    // Create verification document in the Verification collection
    await db
      .collection('Verification')
      .doc(id)
      .set({
        coachId: id,
        idVerification: {
          idType: 'aadhar',
          aadharNumber: `XXXX-XXXX-${aadharNumber.slice(-4)}`,
          experienceYears,
          teamAffiliation,
          licenseNumber,
          certificates: certificatesResults,
          certificatesVerification,
          verificationStatus: 'verified',
          verificationMethod: 'ai-assisted',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      });

    // Update coach reference to verification
    await coachRef.update({
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      status: true,
      message: 'Coach verification completed successfully',
      verification: {
        status: 'verified',
        idType: 'aadhar',
        aadharLastFour: aadharNumber.slice(-4),
        experienceYears,
        teamAffiliation,
        licenseNumber,
        certificatesCount: certificatesResults.length,
        certificatesVerified: certificatesVerification.length,
      },
    });
  } catch (error) {
    console.error('Coach verification error:', error);
    res.status(500).json({ status: false, error: error.message });
  }
};

// verify sponsor
const urlRegex = /^(http[s]?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}\.?/;

// Check if the string matches a URL pattern
function isStringValidUrl(text) {
  return urlRegex.test(text);
}

// Check if the URL is accessible, adding 'http://' if no protocol is specified
function isValidUrl(url, callback) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }
  const client = url.startsWith('https') ? httpsGet : httpGet;
  client(url, (res) => {
    const { statusCode } = res;
    const isSuccessCode = statusCode >= 200 && statusCode < 400; // 2xx or 3xx indicates success
    callback(null, isSuccessCode);
  }).on('error', (err) => {
    callback(err, false);
  });
}

// Promisify isValidUrl for use with async/await
const isValidUrlAsync = promisify(isValidUrl);

// CIN validation regex
export const CIN_REGEX =
  /^([LUu]{1})([0-9]{5})([A-Za-z]{2})([0-9]{4})([A-Za-z]{3})([0-9]{6})$/;

// Verify sponsor function
export const verifySponsor = async (req, res) => {
  const { id } = req.params;
  const { aadharNumber, cinNumber, companyWebsite, sponsoredTeams } = req.body;

  try {
    const sponsorRef = db.collection('Sponsors').doc(id);
    const sponsorSnapshot = await sponsorRef.get();

    if (!sponsorSnapshot.exists) {
      return res
        .status(404)
        .json({ status: false, error: 'Sponsor not found' });
    }

    if (!aadharNumber || !isValidNumber(aadharNumber)) {
      return res.status(400).json({
        status: false,
        error: 'Valid 12-digit Aadhar number is required',
      });
    }

    if (!cinNumber || !CIN_REGEX.test(cinNumber)) {
      return res.status(400).json({
        status: false,
        error: 'Invalid CIN (Corporate Identification Number)',
      });
    }

    // Step 1: Check if companyWebsite is provided and matches URL pattern
    if (!companyWebsite || !isStringValidUrl(companyWebsite)) {
      return res.status(400).json({
        status: false,
        error: 'Invalid company website URL format',
      });
    }

    // Step 2: Check if the URL is accessible
    try {
      const isValid = await isValidUrlAsync(companyWebsite);
      if (!isValid) {
        return res.status(400).json({
          status: false,
          error: 'Company website URL is not accessible',
        });
      }
    } catch (error) {
      console.error('Error validating URL:', error);
      return res.status(500).json({
        status: false,
        error: 'URL validation failed',
      });
    }

    // Update verification collection
    await db
      .collection('Verification')
      .doc(id)
      .set({
        sponsorId: id,
        idVerification: {
          idType: 'aadhar',
          aadharNumber: `XXXX-XXXX-${aadharNumber.slice(-4)}`,
          cinNumber,
          companyWebsite,
          sponsoredTeams,
          verificationStatus: 'verified',
          verificationMethod: 'manual',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      });

    // Update sponsor document
    await sponsorRef.update({
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      status: true,
      message: 'Sponsor verification completed successfully',
    });
  } catch (error) {
    console.error('Sponsor verification error:', error);
    return res.status(500).json({ status: false, error: error.message });
  }
};
