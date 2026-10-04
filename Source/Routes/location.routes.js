import CountriesAndStatesController from '../../Source/Controllers/countriesAndStates.controller.js';
import express from 'express';

const router = express.Router();

// Gets all the countries with their own states for dropdown buttons
router.get(
  '/countries-states',
  CountriesAndStatesController.getAllCountriesWithStates
);

export default router;
