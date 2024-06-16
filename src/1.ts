// serializable.ts
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

export function Serializable(target: any) {
    target.prototype.isSerializable = true;
}

export function Field(type?: string | Function) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor.fields) {
            target.constructor.fields = [];
        }
        const reflectedType = Reflect.getMetadata('design:type', target, propertyKey).name.toLowerCase();
        const fieldType = typeof type === 'string' ? type : type?.name;
        target.constructor.fields.push({ propertyKey, type: fieldType || reflectedType });
    }
}

@Serializable
export class Address {
    @Field() street: string;
    @Field() city: string;
    @Field() zipCode: string;

    constructor(street: string, city: string, zipCode: string) {
        this.street = street;
        this.city = city;
        this.zipCode = zipCode;
    }
}

@Serializable
export class User {
    @Field() name: string;
    @Field() age: number;
    @Field() emails: string[];
    @Field(Address) addresses: Address[];
    @Field() favoriteNumbers: Set<number>;

    constructor(name: string, age: number, emails: string[], addresses: Address[], favoriteNumbers: Set<number>) {
        this.name = name;
        this.age = age;
        this.emails = emails;
        this.addresses = addresses;
        this.favoriteNumbers = favoriteNumbers;
    }
}
