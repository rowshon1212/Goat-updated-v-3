"use strict";

/*
 * Preserve the import path used by GoatBot while delegating the complete FCA
 * implementation to the published package. This keeps protocol fixes,
 * E2EE support, and future API additions upgradeable without refactoring the
 * bot's command/event system.
 */
module.exports = require("@rxabdullah/xdi-fca");