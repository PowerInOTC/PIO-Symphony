"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fake_1 = require("./blockchain/fake");
//import { test } from './blockchain/open';
//
async function bullExample() {
    (0, fake_1.test)();
}
bullExample();
