const GalleryImage = require('../../../models/GalleryImage');

// Add Image In Gallery
exports.addImage = async (req, res) => {
    try {
        await GalleryImage.create(req.body);
        req.flash('success_msg', 'Image Uploaded');
        res.redirect('/admin/dashboard?section=gallery');
    } catch (err) { res.redirect('/admin/dashboard?section=gallery'); }
};

// Delete Image From Gallery
exports.delImage = async (req, res) => {
    try {
        await GalleryImage.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Image Deleted');
        res.redirect('/admin/dashboard?section=gallery');
    } catch (err) { res.redirect('/admin/dashboard?section=gallery'); }
};