"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const init_1 = require("./utils/init");
const open_1 = require("./blockchain/open");
async function bullExample() {
    (0, open_1.test)();
    try {
        let counter = 0;
        const interval = setInterval(() => {
            init_1.logger.info(counter);
            //sendRfq(rfq, token);
            counter++;
        }, 1000);
    }
    catch (error) {
        if (error instanceof Error) {
            init_1.logger.error(error);
        }
        else {
            init_1.logger.error('An unknown error occurred');
        }
    }
}
bullExample();
