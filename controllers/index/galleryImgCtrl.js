// Import Models
const GalleryImage = require('../../models/GalleryImage');

// Show All Image in gallery
exports.showAllImg = async (req, res) => {
  try {
    const galleryImages = await GalleryImage.find()
      .sort({ createdAt: -1 })
      .lean();

    res.render('gallery', {
      title: 'Our Gallery - HMS',
      galleryImages,
      path: '/gallery' 
    });

  } catch (err) {
    console.error("Gallery Page Error:", err);
    res.redirect('/');
  }
};