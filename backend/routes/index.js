import express from 'express';
import tableRoutes from './tableRoutes.js';
import localizationRoutes from './localizationRoutes.js';
import designationRoutes from './designationRoutes.js';
import stimulationRoutes from './stimulationRoutes.js';
import testRoutes from './testRoutes.js';
import searchRoutes from './searchRoutes.js';

const router = express.Router();

// Apply all routes
router.use('/', tableRoutes);
router.use('/', localizationRoutes);
router.use('/', designationRoutes);
router.use('/', stimulationRoutes);
router.use('/', testRoutes);
router.use('/', searchRoutes);

export default router; 