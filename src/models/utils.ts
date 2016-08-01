'use strict';
import * as getmac from 'getmac';
import * as crypto from 'crypto';
import * as os from 'os';
import vscode = require('vscode');
import Constants = require('./constants');
import {ExtensionContext} from 'vscode';

// Interface for package.json information
export interface IPackageInfo {
    name: string;
    version: string;
    aiKey: string;
}

// Get information from the extension's package.json file
export function getPackageInfo(context: ExtensionContext): IPackageInfo {
    let extensionPackage = require(context.asAbsolutePath('./package.json'));
    if (extensionPackage) {
        return {
            name: extensionPackage.name,
            version: extensionPackage.version,
            aiKey: extensionPackage.aiKey
        };
    }
}

// Generate a new GUID
export function generateGuid(): string {
    let hexValues: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    // c.f. rfc4122 (UUID version 4 = xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    let oct: string = '';
    let tmp: number;
    /* tslint:disable:no-bitwise */
    for (let a: number = 0; a < 4; a++) {
        tmp = (4294967296 * Math.random()) | 0;
        oct +=  hexValues[tmp & 0xF] +
                hexValues[tmp >> 4 & 0xF] +
                hexValues[tmp >> 8 & 0xF] +
                hexValues[tmp >> 12 & 0xF] +
                hexValues[tmp >> 16 & 0xF] +
                hexValues[tmp >> 20 & 0xF] +
                hexValues[tmp >> 24 & 0xF] +
                hexValues[tmp >> 28 & 0xF];
    }

    // 'Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively'
    let clockSequenceHi: string = hexValues[8 + (Math.random() * 4) | 0];
    return oct.substr(0, 8) + '-' + oct.substr(9, 4) + '-4' + oct.substr(13, 3) + '-' + clockSequenceHi + oct.substr(16, 3) + '-' + oct.substr(19, 12);
    /* tslint:enable:no-bitwise */
}

// Generate a unique, deterministic ID for the current user of the extension
export function generateUserId(): Promise<string> {
    return new Promise<string>(resolve => {
        try {
            getmac.getMac((error, macAddress) => {
                if (!error) {
                    resolve(crypto.createHash('sha256').update(macAddress + os.homedir(), 'utf8').digest('hex'));
                } else {
                    resolve(generateGuid()); // fallback
                }
            });
        } catch (err) {
            resolve(generateGuid()); // fallback
        }
    });
}

// Return 'true' if the active editor window has a .sql file, false otherwise
export function isEditingSqlFile(): boolean {
    let sqlFile = false;
    let editor = getActiveTextEditor();
    if (editor) {
        if (editor.document.languageId === Constants.languageId) {
            sqlFile = true;
        }
    }
    return sqlFile;
}

// Return the active text editor if there's one
export function getActiveTextEditor(): vscode.TextEditor {
    let editor = undefined;
    if (vscode.window && vscode.window.activeTextEditor) {
        editor = vscode.window.activeTextEditor;
    }
    return editor;
}

// Helper to log messages to "MSSQL" output channel
export function logToOutputChannel(msg: any): void {
    let outputChannel = vscode.window.createOutputChannel(Constants.outputChannelName);
    outputChannel.show();
    if (msg instanceof Array) {
        msg.forEach(element => {
            outputChannel.appendLine(element.toString());
        });
    } else {
        outputChannel.appendLine(msg.toString());
    }
}

// Helper to log debug messages
export function logDebug(msg: any): void {
    let config = vscode.workspace.getConfiguration(Constants.extensionName);
    let logDebugInfo = config[Constants.configLogDebugInfo];
    if (logDebugInfo === true) {
        let currentTime = new Date().toLocaleTimeString();
        let outputMsg = '[' + currentTime + ']: ' + msg ? msg.toString() : '';
        console.log(outputMsg);
    }
}

// Helper to show an info message
export function showInfoMsg(msg: string): void {
    vscode.window.showInformationMessage(Constants.extensionName + ': ' + msg );
}

// Helper to show an warn message
export function showWarnMsg(msg: string): void {
    vscode.window.showWarningMessage(Constants.extensionName + ': ' + msg );
}

// Helper to show an error message
export function showErrorMsg(msg: string): void {
    vscode.window.showErrorMessage(Constants.extensionName + ': ' + msg );
}

export function isEmpty(str: any): boolean {
    return (!str || '' === str);
}

export function isNotEmpty(str: any): boolean {
    return <boolean>(str && '' !== str);
}

// One-time use timer for performance testing
export class Timer {
    private _startTime: number[];
    private _endTime: number[];

    constructor() {
        this.start();
    }

    // Get the duration of time elapsed by the timer, in milliseconds
    public getDuration(): number {
        if (!this._startTime || !this._endTime) {
            return -1;
        } else {
            return this._endTime[0] * 1000 + this._endTime[1] / 1000000;
        }
    }

    public start(): void {
        this._startTime = process.hrtime();
    }

    public end(): void {
        if (!this._endTime) {
            this._endTime = process.hrtime(this._startTime);
        }
    }
}