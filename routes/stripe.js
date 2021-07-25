import express from "express";

import { createConnectAccount, getAccountStatus } from "../controllers/stripe";
import { requireSignin } from "../middleware";

const router = express.Router();

router.post("/create-connect-account", requireSignin, createConnectAccount);
router.post("/get-account-status", requireSignin, getAccountStatus);

module.exports = router;
