const express = require("express");
const router = express.Router();

const {
    obtenerBonuses,
    crearBonus,
    redimirBono,
    actualizarBonus,
} = require("../../controllers/bonuses/bonuses_controller");

router.get("/", obtenerBonuses);
router.post("/", crearBonus);
router.post("/redeem", redimirBono);
router.put("/:id", actualizarBonus);

module.exports = router;
