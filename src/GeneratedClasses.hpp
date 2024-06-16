#ifndef GENERATED_CLASSES_HPP
#define GENERATED_CLASSES_HPP

#include <string>
#include <vector>
#include <unordered_set>
#include <unordered_map>

class Address {
public:
    std::string street;
    std::string city;
    std::string zipCode;

    Address() = default;
    ~Address() = default;
    Address(std::string street, std::string city, std::string zipCode) : street(street), city(city), zipCode(zipCode) {}
};

class User {
public:
    std::string name;
    int age;
    std::vector emails;
    Address addresses;
    std::unordered_set favoriteNumbers;

    User() = default;
    ~User() = default;
    User(std::string name, int age, std::vector emails, Address addresses, std::unordered_set favoriteNumbers) : name(name), age(age), emails(emails), addresses(addresses), favoriteNumbers(favoriteNumbers) {}
};

#endif // GENERATED_CLASSES_HPP
