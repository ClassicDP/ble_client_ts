// generate_cpp.ts
import * as fs from 'fs';
import * as path from 'path';
import { Address, User } from './1';

const typesMap: { [key: string]: string } = {
    'string': 'std::string',
    'number': 'int',
    'boolean': 'bool',
    'array': 'std::vector',
    'set': 'std::unordered_set',
    'map': 'std::unordered_map'
};

function getTypeScriptType(type: string | undefined): string {
    if (type) {
        if (type.toLowerCase() in typesMap) {
            return typesMap[type.toLowerCase()];
        }
        return type; // for user-defined types like Address
    }
    return 'auto';
}

function generateCppClass(tsClass: any, className: string): string {
    const fields = tsClass.prototype.constructor.fields;
    let classDef = `class ${className} {\npublic:\n`;

    fields.forEach((field: any) => {
        const cppType = getTypeScriptType(field.type);
        classDef += `    ${cppType} ${field.propertyKey};\n`;
    });

    classDef += `\n    ${className}() = default;\n`;
    classDef += `    ~${className}() = default;\n`;

    // Constructor
    classDef += `    ${className}(`;
    fields.forEach((field: any, index: number) => {
        const cppType = getTypeScriptType(field.type);
        classDef += `${cppType} ${field.propertyKey}`;
        if (index < fields.length - 1) classDef += ', ';
    });
    classDef += `) : `;
    fields.forEach((field: any, index: number) => {
        classDef += `${field.propertyKey}(${field.propertyKey})`;
        if (index < fields.length - 1) classDef += ', ';
    });
    classDef += ` {}\n`;

    classDef += `};\n`;

    return classDef;
}

function generateHeaderFile(classes: any[], outputPath: string) {
    let headerFileContent = `#ifndef GENERATED_CLASSES_HPP\n#define GENERATED_CLASSES_HPP\n\n#include <string>\n#include <vector>\n#include <unordered_set>\n#include <unordered_map>\n\n`;

    classes.forEach(cls => {
        headerFileContent += generateCppClass(cls.classDef, cls.className) + '\n';
    });

    headerFileContent += `#endif // GENERATED_CLASSES_HPP\n`;

    fs.writeFileSync(outputPath, headerFileContent, 'utf8');
}

const classes = [
    { classDef: Address, className: 'Address' },
    { classDef: User, className: 'User' }
];

generateHeaderFile(classes, path.join(__dirname, 'GeneratedClasses.hpp'));
