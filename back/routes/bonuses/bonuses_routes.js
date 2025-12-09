const express = require("express");
const router = express.Router();

const {
    obtenerBonuses,
    crearBonus,
    redimirBono,
} = require("../../controllers/bonuses/bonuses_controller");

router.get("/", obtenerBonuses);
router.post("/", crearBonus);
router.post("/redeem", redimirBono);

module.exports = router;
