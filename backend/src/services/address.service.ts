import Prisma from "../db/db.js";
import type {
  Address,
  AddressInput,
  City,
  CityInput,
  State,
  StateInput,
} from "../types/address.types.js";
import { ApiError } from "../utils/ApiError.js";

class AddressServices {
  // 🔹 Show a specific address with relations
  static async showAddress(id: string): Promise<Address> {
    if (!id) {
      throw ApiError.badRequest("Address ID is required");
    }

    const address = await Prisma.address.findUnique({
      where: { id },
      include: {
        state: true,
        city: true,
      },
    });

    if (!address) {
      throw ApiError.notFound("Address not found");
    }

    return address;
  }

  // 🔹 Create a new address
  static async storeUserAddress(payload: AddressInput): Promise<Address> {
    const stateExists = await Prisma.state.findUnique({
      where: { id: payload.stateId },
    });
    if (!stateExists) {
      throw ApiError.notFound("State not found");
    }

    const cityExists = await Prisma.city.findUnique({
      where: { id: payload.cityId },
    });
    if (!cityExists) {
      throw ApiError.notFound("City not found");
    }

    const createdAddress = await Prisma.address.create({
      data: {
        address: payload.address,
        pinCode: payload.pinCode,
        stateId: payload.stateId,
        cityId: payload.cityId,
      },
      include: {
        state: true,
        city: true,
      },
    });

    return createdAddress;
  }

  // 🔹 Update an existing address
  static async updateUserAddress(
    payload: AddressInput,
    addressId: string
  ): Promise<Address> {
    if (!addressId) {
      throw ApiError.badRequest("Address ID is required");
    }

    const existingAddress = await Prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw ApiError.notFound("Address not found");
    }

    const state = await Prisma.state.findUnique({
      where: { id: payload.stateId },
    });

    if (!state) {
      throw ApiError.notFound("State not found");
    }

    const city = await Prisma.city.findUnique({
      where: { id: payload.cityId },
    });

    if (!city) {
      throw ApiError.notFound("City not found");
    }

    const updatedAddress = await Prisma.address.update({
      where: { id: addressId },
      data: {
        address: payload.address,
        pinCode: payload.pinCode,
        stateId: payload.stateId,
        cityId: payload.cityId,
      },
      include: {
        state: true,
        city: true,
      },
    });

    return updatedAddress;
  }

  // 🔹 Delete an address
  static async deleteUserAddress(id: string): Promise<Address> {
    if (!id) {
      throw ApiError.badRequest("Address ID is required");
    }

    const existingAddress = await Prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      throw ApiError.notFound("Address not found");
    }

    const deletedAddress = await Prisma.address.delete({
      where: { id },
    });

    return deletedAddress;
  }

  // 🔹 List all states
  static async indexState(): Promise<State[]> {
    const allStates = await Prisma.state.findMany({
      orderBy: {
        stateName: "asc",
      },
    });

    if (allStates.length === 0) {
      throw ApiError.notFound("No states found");
    }

    return allStates;
  }

  // 🔹 Create new state
  static async storeState(payload: StateInput): Promise<State> {
    const formattedName =
      payload.stateName.charAt(0).toUpperCase() +
      payload.stateName.slice(1).toLowerCase();

    const alreadyExists = await Prisma.state.findFirst({
      where: { stateName: formattedName },
    });

    if (alreadyExists) {
      throw ApiError.conflict("A state with the same name already exists");
    }

    const createdState = await Prisma.state.create({
      data: {
        stateName: formattedName,
        stateCode: formattedName.toUpperCase().replace(/\s+/g, "_"),
      },
    });

    return createdState;
  }

  // 🔹 Update existing state
  static async updateState(payload: StateInput, id: string): Promise<State> {
    if (!id) {
      throw ApiError.badRequest("State ID is required");
    }

    const formattedName =
      payload.stateName.charAt(0).toUpperCase() +
      payload.stateName.slice(1).toLowerCase();

    const existingState = await Prisma.state.findUnique({
      where: { id },
    });

    if (!existingState) {
      throw ApiError.notFound("State not found");
    }

    const alreadyExists = await Prisma.state.findFirst({
      where: {
        stateName: formattedName,
        NOT: { id },
      },
    });

    if (alreadyExists) {
      throw ApiError.conflict("A state with the same name already exists");
    }

    const linkedAddresses = await Prisma.address.count({
      where: { stateId: id },
    });

    if (linkedAddresses > 0) {
      throw ApiError.forbidden("Cannot update state: linked addresses exist");
    }

    const updatedState = await Prisma.state.update({
      where: { id },
      data: {
        stateName: formattedName,
        stateCode: formattedName.toUpperCase().replace(/\s+/g, "_"),
      },
    });

    return updatedState;
  }

  // 🔹 Delete a state
  static async deleteState(id: string): Promise<State> {
    if (!id) {
      throw ApiError.badRequest("State ID is required");
    }

    const existingState = await Prisma.state.findUnique({
      where: { id },
    });

    if (!existingState) {
      throw ApiError.notFound("State not found");
    }

    const linkedAddresses = await Prisma.address.count({
      where: { stateId: id },
    });

    if (linkedAddresses > 0) {
      throw ApiError.forbidden("Cannot delete state: linked addresses exist");
    }

    const deletedState = await Prisma.state.delete({
      where: { id },
    });

    return deletedState;
  }

  // 🔹 List all cities
  static async indexCity(): Promise<City[]> {
    const allCities = await Prisma.city.findMany({
      orderBy: {
        cityName: "asc",
      },
    });

    if (allCities.length === 0) {
      throw ApiError.notFound("No cities found");
    }

    return allCities;
  }

  // 🔹 Create new city
  static async storeCity(payload: CityInput): Promise<City> {
    const formattedName =
      payload.cityName.charAt(0).toUpperCase() +
      payload.cityName.slice(1).toLowerCase();

    const existsCity = await Prisma.city.findFirst({
      where: { cityName: formattedName },
    });

    if (existsCity) {
      throw ApiError.conflict("City already exists");
    }

    const createdCity = await Prisma.city.create({
      data: {
        cityName: formattedName,
        cityCode: formattedName.toUpperCase().replace(/\s+/g, "_"),
      },
    });

    return createdCity;
  }

  // 🔹 Update existing city
  static async updateCity(payload: CityInput, id: string): Promise<City> {
    if (!id) {
      throw ApiError.badRequest("City ID is required");
    }

    const formattedName =
      payload.cityName.charAt(0).toUpperCase() +
      payload.cityName.slice(1).toLowerCase();

    const existingCity = await Prisma.city.findUnique({
      where: { id },
    });

    if (!existingCity) {
      throw ApiError.notFound("City not found");
    }

    const existsCity = await Prisma.city.findFirst({
      where: {
        cityName: formattedName,
        NOT: { id },
      },
    });

    if (existsCity) {
      throw ApiError.conflict("City already exists");
    }

    const linkedAddresses = await Prisma.address.count({
      where: { cityId: id },
    });

    if (linkedAddresses > 0) {
      throw ApiError.forbidden("Cannot update city: linked addresses exist");
    }

    const updatedCity = await Prisma.city.update({
      where: { id },
      data: {
        cityName: formattedName,
        cityCode: formattedName.toUpperCase().replace(/\s+/g, "_"),
      },
    });

    return updatedCity;
  }

  // 🔹 Delete a city
  static async deleteCity(id: string): Promise<City> {
    if (!id) {
      throw ApiError.badRequest("City ID is required");
    }

    const existingCity = await Prisma.city.findUnique({
      where: { id },
    });

    if (!existingCity) {
      throw ApiError.notFound("City not found");
    }

    const linkedAddresses = await Prisma.address.count({
      where: { cityId: id },
    });

    if (linkedAddresses > 0) {
      throw ApiError.forbidden("Cannot delete city: linked addresses exist");
    }

    const deletedCity = await Prisma.city.delete({
      where: { id },
    });

    return deletedCity;
  }
}

export default AddressServices;
