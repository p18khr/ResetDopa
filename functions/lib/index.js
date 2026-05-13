"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyNeuroAudit = exports.syncOfflineTransactions = exports.purchaseItem = exports.createTransaction = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
var economy_1 = require("./economy");
Object.defineProperty(exports, "createTransaction", { enumerable: true, get: function () { return economy_1.createTransaction; } });
Object.defineProperty(exports, "purchaseItem", { enumerable: true, get: function () { return economy_1.purchaseItem; } });
Object.defineProperty(exports, "syncOfflineTransactions", { enumerable: true, get: function () { return economy_1.syncOfflineTransactions; } });
var weeklyNeuroAudit_1 = require("./weeklyNeuroAudit");
Object.defineProperty(exports, "weeklyNeuroAudit", { enumerable: true, get: function () { return weeklyNeuroAudit_1.weeklyNeuroAudit; } });
//# sourceMappingURL=index.js.map