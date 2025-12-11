const express = require("express");
const router = express.Router();

const {
    obtenerBonuses,
    crearBonus,
    redimirBono,
    actualizarBonus,
    eliminarBonus,
} = require("../../controllers/bonuses/bonuses_controller");

router.get("/", obtenerBonuses);
router.post("/", crearBonus);
router.post("/redeem", redimirBono);
router.put("/:id", actualizarBonus);
router.delete("/:id", eliminarBonus);

module.exports = router;
