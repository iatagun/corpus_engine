"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const start = async () => {
    const app = await (0, app_1.buildApp)();
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = '0.0.0.0';
    try {
        await app.listen({ port, host });
        console.log(`Server listening on http://${host}:${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map