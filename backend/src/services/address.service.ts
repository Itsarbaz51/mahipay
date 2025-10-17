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
  // user addresses
  static async showAddress(id: string): Promise<Address> {
    const address = await Prisma.address.findUnique({
      where: { id },
    });
    if (!address) {
      throw ApiError.notFound("Address not found");
    }
    return address;
  }

  static async storeUserAddress(payload: AddressInput): Promise<Address> {
    const stateExsits = await Prisma.state.findUnique({
      where: { id: payload.stateId },
    });
    if (!stateExsits) {
      throw ApiError.notFound("State not found for creating address");
    }

    const cityExsits = await Prisma.city.findUnique({
      where: { id: payload.cityId },
    });

    if (!cityExsits) {
      throw ApiError.notFound("City not found for creating address");
    }

    const createdAddress = await Prisma.address.create({
      data: {
        address: payload.address,
        pinCode: payload.pinCode,
        stateId: payload.stateId,
        cityId: payload.cityId,
      },
    });

    if (!createdAddress) {
      throw ApiError.internal("Failed to create address record");
    }

    return createdAddress;
  }

  static async updateUserAddress(
    payload: AddressInput,
    id: string
  ): Promise<Address> {
    const stateExsits = await Prisma.state.findUnique({
      where: { id: payload.stateId },
    });

    if (!stateExsits) {
      throw ApiError.notFound("State not found for update address");
    }

    const cityExsits = await Prisma.city.findUnique({
      where: { id: payload.cityId },
    });

    if (!cityExsits) {
      throw ApiError.notFound("City not found for update address");
    }

    const updatedAddress = await Prisma.address.update({
      where: { id },
      data: {
        address: payload.address,
        pinCode: payload.pinCode,
        stateId: payload.stateId,
        cityId: payload.cityId,
      },
    });

    if (!updatedAddress) {
      throw ApiError.internal("Failed to update address");
    }

    return updatedAddress;
  }

  static async deleteUserAddress(id: string): Promise<Address> {
    const exsitsCity = await Prisma.address.findFirst({
      where: {
        id,
      },
    });

    if (exsitsCity) {
      throw ApiError.notFound("Address not found");
    }
    const deletedAddress = await Prisma.address.delete({
      where: { id },
    });
    if (!deletedAddress) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to delete address record.",
      ]);
    }
    return deletedAddress;
  }

  // states
  static async indexState(): Promise<State[]> {
    const allStates = await Prisma.state.findMany();
    if (!allStates) {
      throw ApiError.notFound("No states found");
    }

    return allStates;
  }

  static async storeState(payload: StateInput): Promise<State> {
    const alreadyExists = await Prisma.state.findFirst({
      where: { stateName: payload.stateName },
    });

    if (alreadyExists) {
      throw ApiError.badRequest("A state with the same name already exists.");
    }

    const createdState = await Prisma.state.create({
      data: {
        stateName:
          payload.stateName.charAt(0).toUpperCase() +
          payload.stateName.slice(1),
      },
    });

    if (!createdState) {
      throw ApiError.internal("Failed to create state");
    }

    return createdState;
  }

  static async updateState(payload: StateInput, id: string): Promise<State> {
    const formattedName =
      payload.stateName.charAt(0).toUpperCase() + payload.stateName.slice(1);

    const existingState = await Prisma.state.findUnique({ where: { id } });
    if (!existingState) throw ApiError.notFound("State not found");

    const alreadyExists = await Prisma.state.findFirst({
      where: { stateName: formattedName, NOT: { id } },
    });
    if (alreadyExists) {
      throw ApiError.badRequest("A state with the same name already exists");
    }

    const linkedAddresses = await Prisma.address.count({
      where: { stateId: id },
    });
    if (linkedAddresses > 0) {
      throw ApiError.forbidden("Cannot update state: linked addresses exist");
    }

    const updatedState = await Prisma.state.update({
      where: { id },
      data: { stateName: formattedName },
    });

    return updatedState;
  }

  static async deleteState(id: string): Promise<State> {
    const existingState = await Prisma.state.findUnique({
      where: { id },
    });

    if (!existingState) throw ApiError.notFound("State not found");

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

  // cities
  static async indexCity(): Promise<City[]> {
    const allCities = await Prisma.city.findMany();
    if (!allCities) {
      throw ApiError.notFound("No cities found");
    }
    return allCities;
  }

  static async storeCity(payload: CityInput): Promise<City> {
    const exsitsCity = await Prisma.city.findFirst({
      where: {
        cityName:
          payload.cityName.charAt(0).toUpperCase() + payload.cityName.slice(1),
      },
    });

    if (exsitsCity) {
      throw ApiError.conflict("Already exsits city");
    }

    const createdCity = await Prisma.city.create({
      data: {
        cityName:
          payload.cityName.charAt(0).toUpperCase() + payload.cityName.slice(1),
      },
    });

    if (!createdCity) {
      throw ApiError.internal("Failed to create city record.");
    }

    return createdCity;
  }

  static async updateCity(payload: CityInput, id: string): Promise<City> {
    const formattedName =
      payload.cityName.charAt(0).toUpperCase() + payload.cityName.slice(1);

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
      data: { cityName: formattedName },
    });

    if (!updatedCity) {
      throw ApiError.internal("Failed to update city record");
    }

    return updatedCity;
  }

  static async deleteCity(id: string): Promise<City> {
    const existsCity = await Prisma.city.findUnique({
      where: { id },
    });

    if (!existsCity) {
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

    if (!deletedCity) {
      throw ApiError.internal("Failed to delete city record");
    }

    return deletedCity;
  }
}

export default AddressServices;
