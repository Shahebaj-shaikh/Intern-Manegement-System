const router = require('express').Router();

const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const c = require('../controllers/offer.controller');

router.use(protect);

// View offers
router.get(
  '/',
  authorize('super_admin', 'hr', 'intern'),
  c.getOffers
);

// View single offer
router.get(
  '/:id',
  authorize('super_admin', 'hr', 'intern'),
  c.getOfferById
);

// HR/Admin operations
router.post(
  '/',
  authorize('super_admin', 'hr'),
  c.createOffer
);

router.put(
  '/:id',
  authorize('super_admin', 'hr'),
  c.updateOffer
);

router.put(
  '/:id/send',
  authorize('super_admin', 'hr'),
  c.sendOffer
);

router.put(
  '/:id/withdraw',
  authorize('super_admin', 'hr'),
  c.withdrawOffer
);

// Intern operations
router.put(
  '/:id/accept',
  authorize('intern'),
  c.acceptOffer
);

router.put(
  '/:id/reject',
  authorize('intern'),
  c.rejectOffer
);

module.exports = router;