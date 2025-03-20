import { db } from '../../config/firebaseConfig.js';

export const uploadProfilepic = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['Athlete', 'Coach', 'Sponsor'].includes(role)) {
    return res
      .status(400)
      .json({ error: 'Invalid role. Choose Athlete, Coach, or Sponsor.' });
  }

  try {
    if (!req.uploadedFileUrl) {
      return res.status(400).json({ error: 'Failed to upload file.' });
    }

    const collection =
      role === 'Athlete'
        ? 'Athletes'
        : role === 'Coach'
        ? 'Coaches'
        : 'Sponsors';

    // Update the user's document with the profile photo URL
    await db.collection(collection).doc(id).update({
      profilePhoto: req.uploadedFileUrl,
    });

    res.status(200).json({
      message: 'Profile photo uploaded successfully',
      profilePhoto: req.uploadedFileUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfilepic = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['Athlete', 'Coach', 'Sponsor'].includes(role)) {
      return res
        .status(400)
        .json({
          status: false,
          error: 'Invalid role. Choose Athlete, Coach, or Sponsor.',
        });
    }

    const collection =
      role === 'Athlete'
        ? 'Athletes'
        : role === 'Coach'
        ? 'Coaches'
        : 'Sponsors';

    const userDoc = await db.collection(collection).doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ status: true, error: 'User not found' });
    }

    const userData = userDoc.data();

    if (!userData.profilePhoto) {
      return res
        .status(404)
        .json({ status: true, error: 'Profile photo not found' });
    }

    res.status(200).json({ status: true, profilePhoto: userData.profilePhoto });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};
