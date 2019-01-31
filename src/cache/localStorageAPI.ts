import powerbi from "powerbi-visuals-api";
import * as _ from "lodash";
import ILocalVisualStorageService = powerbi.extensibility.ILocalVisualStorageService;

import { ICacheManager } from "./interfaces/ICacheManager";
import { BaseCache } from "./base";
import { getShortKey } from "./utils/utils";
import { ILocationDictionary } from "../geocoder/interfaces/geocoderInterfaces";

export class LocalStorageCache extends BaseCache implements ICacheManager {

    private static TILE_LOCATIONS = "GLOBEMAP_TILE_LOCATIONS";
    private localStorageService: ILocalVisualStorageService;

    constructor(localStorageService: ILocalVisualStorageService) {
        super();
        this.localStorageService = localStorageService;
    }

    public async loadCoordinates(keys: string[]): Promise<ILocationDictionary> {
        let result: ILocationDictionary = {};

        return new Promise<ILocationDictionary>((resolve, reject) => {
            this.localStorageService.get(LocalStorageCache.TILE_LOCATIONS).then((data) => {
                const parsedValue = JSON.parse(data);
                if (!parsedValue) {
                    reject();
                }

                if (!keys || !keys.length) {
                    for (let key in parsedValue) {
                        if (parsedValue.hasOwnProperty(key)) {
                            const location = parsedValue[key];
                            result[key] = {
                                latitude: location.lat,
                                longitude: location.lon
                            };
                        }
                    }
                } else {
                    for (let key in keys) {
                        const shortKey: string = getShortKey(key);
                        const location = parsedValue[shortKey];
                        result[key] = {
                            latitude: location.lat,
                            longitude: location.lon
                        };
                    }
                }

                resolve(result);
            })
                .catch(() => {
                    reject();
                });
        });
    }

    public async saveCoordinates(coordinates: ILocationDictionary): Promise<string> {
        const locationItemsObject: {} = {};
        for (let key in coordinates) {
            const shortKey: string = getShortKey(key);
            locationItemsObject[shortKey] = {
                "lon": coordinates[key].longitude,
                "lat": coordinates[key].latitude
            };
        }

        let valueObjectToString: string = JSON.stringify(locationItemsObject);

        return new Promise<string>((resolve, reject) => {
            this.localStorageService.get(LocalStorageCache.TILE_LOCATIONS).then((data) => {
                const locationsFromStorage = JSON.parse(data);
                const mergedObject = location ? _.extend(locationsFromStorage, valueObjectToString) : valueObjectToString;

                valueObjectToString = JSON.stringify(mergedObject);
                this.localStorageService.set(LocalStorageCache.TILE_LOCATIONS, valueObjectToString)
                    .then(() => resolve("success"))
                    .catch(() => reject());
            }).catch(() => {
                this.localStorageService.set(LocalStorageCache.TILE_LOCATIONS, valueObjectToString)
                    .then(() => resolve("success"))
                    .catch(() => reject());
            });
        });
    }
}