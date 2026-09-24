import express from 'express';
import helpTypeController from '../Controllers/helpType.controller.js';

const router = express.Router();

//Catalogue for the "¿Que ayuda esperas recibir?" dropdown
router.get('/help-types', helpTypeController.listHelpTypes);

export default router;
