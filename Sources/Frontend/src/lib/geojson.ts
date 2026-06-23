import { FeatureCollection } from "geojson";

export const WARD_CENTERS: Record<string, [number, number]> = {
  "Hải Châu": [16.044, 108.22],
  "Thanh Khê": [16.06, 108.192],
  "Sơn Trà": [16.084, 108.246],
  "Ngũ Hành Sơn": [16.027, 108.246],
  "Liên Chiểu": [16.072, 108.15],
  "Cẩm Lệ": [16.02, 108.2],
  "Hòa Vang": [15.99, 108.12],
};

export const WARD_BOUNDARIES: Record<string, FeatureCollection> = {
  "Hải Châu": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Hải Châu" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.21, 16.035],
              [108.23, 16.035],
              [108.23, 16.055],
              [108.21, 16.055],
              [108.21, 16.035],
            ],
          ],
        },
      },
    ],
  },
  "Thanh Khê": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Thanh Khê" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.18, 16.05],
              [108.204, 16.05],
              [108.204, 16.07],
              [108.18, 16.07],
              [108.18, 16.05],
            ],
          ],
        },
      },
    ],
  },
  "Sơn Trà": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Sơn Trà" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.23, 16.07],
              [108.26, 16.07],
              [108.26, 16.1],
              [108.23, 16.1],
              [108.23, 16.07],
            ],
          ],
        },
      },
    ],
  },
  "Ngũ Hành Sơn": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Ngũ Hành Sơn" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.23, 16.01],
              [108.26, 16.01],
              [108.26, 16.04],
              [108.23, 16.04],
              [108.23, 16.01],
            ],
          ],
        },
      },
    ],
  },
  "Liên Chiểu": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Liên Chiểu" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.13, 16.055],
              [108.17, 16.055],
              [108.17, 16.09],
              [108.13, 16.09],
              [108.13, 16.055],
            ],
          ],
        },
      },
    ],
  },
  "Cẩm Lệ": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Cẩm Lệ" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.185, 16.005],
              [108.215, 16.005],
              [108.215, 16.035],
              [108.185, 16.035],
              [108.185, 16.005],
            ],
          ],
        },
      },
    ],
  },
  "Hòa Vang": {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Hòa Vang" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [108.08, 15.96],
              [108.16, 15.96],
              [108.16, 16.02],
              [108.08, 16.02],
              [108.08, 15.96],
            ],
          ],
        },
      },
    ],
  },
};
