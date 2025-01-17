import { useContext } from "react";
import LocationsContext from "../contexts/LocationsContext";
import useContinents, { Continent } from "./useContinents";
import useCountries, { Country } from "./useCountries";
import { Location } from "./useLocations";
import useNodes, { Node } from "./useNodes";

export type LocationStat = {
  entityId: string;
  numberOfNodes: number;
  diskSpace: number;
  retrievals: { "1d": number; "7d": number };
  bandwidthServed: { "1d": number; "7d": number };
  estimatedEarnings: { "1d": number; "7d": number };
  cacheHitRate: number;
  avgTTFB: number;
};

const computeStats = (
  nodes: Node[],
  entity: Location | Country | Continent | Node | undefined
) => {
  const numberOfNodes = nodes.length;
  const diskSpace = nodes.reduce((acc, el) => {
    return acc + el.diskSizeGB;
  }, 0);

  const retrievals = nodes.reduce(
    (acc, el) => {
      if (Object.keys(el.retrievalsStats).length) {
        return {
          "1d": acc["1d"] + (el.retrievalsStats["1d"] || 0),
          "7d": acc["7d"] + (el.retrievalsStats["7d"] || 0),
        };
      } else {
        return acc;
      }
    },
    { "1d": 0, "7d": 0 }
  );

  const bandwidthServed = nodes.reduce(
    (acc, el) => {
      if (Object.keys(el.bandwidthServed).length) {
        return {
          "1d": acc["1d"] + (parseInt(el.bandwidthServed["1d"]) || 0),
          "7d": acc["7d"] + (parseInt(el.bandwidthServed["7d"]) || 0),
        };
      } else {
        return acc;
      }
    },
    { "1d": 0, "7d": 0 }
  );

  const estimatedEarnings = nodes.reduce(
    (acc, el) => {
      if (Object.keys(el.estimatedEarnings).length) {
        return {
          "1d": acc["1d"] + (el.estimatedEarnings["1d"] || 0),
          "7d": acc["7d"] + (el.estimatedEarnings["7d"] || 0),
        };
      } else {
        return acc;
      }
    },
    { "1d": 0, "7d": 0 }
  );

  const avgTTFB = nodes.reduce((acc, el) => {
    if (el.ttfbStats["p95_24h"]) {
      const contrib = el.ttfbStats["p95_24h"] / numberOfNodes;
      return contrib ? acc + contrib : acc;
    } else {
      return acc;
    }
  }, 0);

  const cacheHitRate = nodes.reduce((acc, el) => {
    if (el.cacheHitRate["24h"]) {
      const contrib = el.cacheHitRate["24h"] / numberOfNodes;
      return contrib ? acc + contrib : acc;
    } else {
      return acc;
    }
  }, 0);

  return {
    entityId: entity ? entity.id : "",
    numberOfNodes,
    diskSpace,
    retrievals,
    avgTTFB,
    estimatedEarnings,
    bandwidthServed,
    cacheHitRate,
  };
};

export const useStats = () => {
  const {
    nodes: nodesMap,
    getNodesByContinentId,
    getNodesByCountryId,
    getNodesByLocationId,
  } = useNodes();

  const nodes = Array.from(nodesMap.values());

  const { locations } = useContext(LocationsContext);
  const { continents } = useContinents();
  const { countries } = useCountries();

  const getGlobalStats = () => {
    if (!nodes) return;
    const globalStats = computeStats(nodes, undefined);
    return globalStats;
  };

  const getStatsByContinentId = (continentId: string) => {
    if (!nodes) return;
    const continent = continents.find(
      (continent) => continent.id === continentId
    );
    if (!continent) return;
    const continentNodes = getNodesByContinentId(continent.id);
    return computeStats(continentNodes, continent);
  };

  const getStatsByCountryId = (countryId: string) => {
    if (!nodes) return;
    const country = countries.find((country) => country.id === countryId);
    if (!country) return;
    const countryNodes = getNodesByCountryId(country.id);
    return computeStats(countryNodes, country);
  };

  const getStatsByLocationId = (locationId: string) => {
    if (!nodes) return;
    const location = locations.find((location) => location.id === locationId);
    if (!location) return;
    const locationNodes = getNodesByLocationId(location.id);
    return computeStats(locationNodes, location);
  };

  const getStatsByNodeId = (nodeId: string) => {
    if (!nodes) return;
    const node = nodes.find((node) => node.id === nodeId);
    if (!node) return;
    return computeStats([node], node);
  };

  return {
    getGlobalStats,
    getStatsByContinentId,
    getStatsByCountryId,
    getStatsByLocationId,
    getStatsByNodeId,
  };
};
