const express = require('express');
const router = express.Router({ mergeParams: true });
const { checkAuthorization } = require('../middleware/checkAuthorization');
const {
    getFollowingStatus,
    getFollowersList,
    followAuthor,
    subscribeToAuthor,
    unsubscribeFromAuthor
} = require('../controllers/followings');

router.get('/following', checkAuthorization, getFollowingStatus);
router.get('/followers', getFollowersList);
router.put('/follow', checkAuthorization, followAuthor);
router.put('/subscribe', checkAuthorization, subscribeToAuthor);
router.put('/unsubscribe', checkAuthorization, unsubscribeFromAuthor);

module.exports = router;
