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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const config_1 = require("../config");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
class Logger {
    static setLogLevel(levelString) {
        levelString = levelString.toUpperCase();
        const level = LogLevel[levelString];
        if (level !== undefined) {
            Logger.logLevel = level;
        }
    }
    static getTimestamp() {
        const now = new Date();
        return now.toISOString();
    }
    static getLogFileName(type) {
        const dateStr = Logger.getTimestamp().split('T')[0];
        return `${type}_${dateStr}.log`;
    }
    static writeToLogFile(logFileName, logMessage) {
        const logDirectory = config_1.config.logDirectory;
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory, { recursive: true });
        }
        fs.appendFileSync(logDirectory + '/' + logFileName, logMessage + '\n', 'utf-8');
    }
    static debug(type, message) {
        if (Logger.logLevel <= LogLevel.DEBUG) {
            const logMessage = `[${Logger.getTimestamp()}] [DEBUG] [${type}] ${message}`;
            console.debug(logMessage);
            Logger.writeToLogFile(Logger.getLogFileName(type), logMessage);
        }
    }
    static info(type, message) {
        if (Logger.logLevel <= LogLevel.INFO) {
            const logMessage = `[${Logger.getTimestamp()}] [INFO] [${type}] ${message}`;
            console.info(logMessage);
            Logger.writeToLogFile(Logger.getLogFileName(type), logMessage);
        }
    }
    static warn(type, message) {
        if (Logger.logLevel <= LogLevel.WARN) {
            const logMessage = `[${Logger.getTimestamp()}] [WARN] [${type}] ${message}`;
            console.warn(logMessage);
            Logger.writeToLogFile(Logger.getLogFileName(type), logMessage);
        }
    }
    static error(type, message) {
        if (Logger.logLevel <= LogLevel.ERROR) {
            const logMessage = `[${Logger.getTimestamp()}] [ERROR] [${type}] ${message}`;
            console.error(logMessage);
            Logger.writeToLogFile(Logger.getLogFileName(type), logMessage);
        }
    }
}
Logger.logLevel = LogLevel.ERROR;
exports.default = Logger;
