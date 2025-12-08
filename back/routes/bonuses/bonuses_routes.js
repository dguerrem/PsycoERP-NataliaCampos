const express = require("express");
const router = express.Router();

const {
  obtenerBonuses,
} = require("../../controllers/bonuses/bonuses_controller");

router.get("/", obtenerBonuses);

module.exports = router;
