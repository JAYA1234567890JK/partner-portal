const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const { handleImageUpload } = require('../middleware/imageUpload');
const imageController = require('../controllers/imageController');

const router = express.Router();
router.use(authenticateUser, authorizeRoles('PARTNER'));

router.post('/properties/:propertyId/images', handleImageUpload, imageController.uploadPropertyImages);
router.get('/properties/:propertyId/images', imageController.listPropertyImages);
router.patch('/properties/:propertyId/images/order', imageController.orderPropertyImages);
router.patch('/properties/:propertyId/images/:imageId', imageController.updatePropertyImage);
router.delete('/properties/:propertyId/images/:imageId', imageController.deletePropertyImage);

router.post('/rooms/:roomId/images', handleImageUpload, imageController.uploadRoomImages);
router.get('/rooms/:roomId/images', imageController.listRoomImages);
router.patch('/rooms/:roomId/images/order', imageController.orderRoomImages);
router.patch('/rooms/:roomId/images/:imageId', imageController.updateRoomImage);
router.delete('/rooms/:roomId/images/:imageId', imageController.deleteRoomImage);

module.exports = router;
