/**
 * ownershipGuard.js — IDOR (Insecure Direct Object Reference) Protection
 *
 * What IDOR is:
 *   Attacker logs in as User A, then changes a resource ID in the URL
 *   to access User B's private medical records. E.g.:
 *   GET /api/resource/USER-B-UUID  →  gets User B's data while logged in as User A
 *
 * This middleware:
 *   1. Fetches the requested resource from DB
 *   2. Verifies its user_id === req.user.id
 *   3. Returns 403 (Forbidden) — NOT 404 — if it doesn't match
 *      (404 would reveal whether the resource exists, leaking information)
 *   4. Logs the IDOR attempt as a security event
 *   5. Attaches the resource to req.resource to avoid a second DB query in the handler
 *
 * Usage example:
 *   const ownershipGuard = require('../middleware/ownershipGuard');
 *   const MyModel = require('../models/MyModel');
 *
 *   router.get(
 *     '/resource/:id',
 *     authMiddleware,
 *     ownershipGuard(MyModel, 'id'),   // 'id' = param name in router
 *     async (req, res) => {
 *       // req.resource is already fetched and verified
 *       return res.json({ data: req.resource });
 *     }
 *   );
 */

const { logSecurityEvent, EVENTS } = require('./auditLogger');
const logger = require('../utils/logger');

/**
 * @param {object} Model         - Sequelize model class
 * @param {string} routeParam    - Name of req.params key holding the resource ID (default: 'id')
 * @param {string} userIdField   - Field on the model that stores the owner's user_id (default: 'user_id')
 */
const ownershipGuard = (Model, routeParam = 'id', userIdField = 'user_id') => {
  return async (req, res, next) => {
    const resourceId = req.params[routeParam];

    // No resource ID in params — skip (handler will deal with missing param)
    if (!resourceId) return next();

    try {
      const resource = await Model.findByPk(resourceId);

      if (!resource) {
        // Resource not found — return standard 404
        return res.status(404).json({ success: false, error: 'Resource not found.' });
      }

      const ownerId = resource[userIdField]?.toString();
      const requesterId = req.user?.id?.toString();

      if (ownerId !== requesterId) {
        // ── IDOR DETECTED ──
        // Attacker is trying to access another user's data
        logger.warn('IDOR attempt detected', {
          requesterId,
          ownerId,
          resourceId,
          model: Model.name,
          method: req.method,
          path: req.path,
          ip: req.ip,
        });

        await logSecurityEvent(req, EVENTS.IDOR_ATTEMPT, {
          userId: requesterId,
          metadata: {
            targetResourceId: resourceId,
            targetOwnerId: ownerId,
            model: Model.name,
            method: req.method,
            path: req.path,
          },
        });

        // Return 403 Forbidden — NOT 404
        // Returning 404 would tell the attacker "this resource exists but isn't yours"
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      // ── Ownership verified ──
      // Attach resource to avoid a second DB round-trip in the route handler
      req.resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = ownershipGuard;
