//Import Models
const GalleryImage = require('../../models/GalleryImage'); 

// Home Page
exports.homePage = async (req, res) => {
  try {
    const galleryImages = await GalleryImage.find()
      .sort({ createdAt: -1 })
      .limit(6) 
      .lean();
    
    res.render('index', { 
      title: 'HMS - Next Gen Hostel',
      galleryImages, 
      path: '/' 
    });

  } catch (err) {
    res.render('index', { 
        title: 'HMS', 
        galleryImages: [],
        path: '/'
    });
  }
};