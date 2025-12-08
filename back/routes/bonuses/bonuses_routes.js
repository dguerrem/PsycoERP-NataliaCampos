const express = require("express");
const router = express.Router();

const {
    obtenerBonuses,
    crearBonus,
} = require("../../controllers/bonuses/bonuses_controller");

router.get("/", obtenerBonuses);
router.post("/", crearBonus);

module.exports = router;
