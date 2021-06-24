import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Fill, Stroke, Text } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import Circle from 'ol/geom/Circle';
import { fromLonLat } from 'ol/proj';
import { GeoJSON, DevicesLocation } from '../../types';
import { Coordinate } from 'ol/coordinate';

interface SingleData {
  hash_id: string;
  timestamp: number;
  distance: { [key: string]: number };
  rssi: { [key: string]: number };
  latitude: number;
  longitude: number;
}

export const parseDeviceLocation = (geojson: GeoJSON) => {
  const devicesLocation: { [key: string]: Coordinate } = {};
  geojson.features.map(feature => {
    devicesLocation[feature.properties.id.replace(':', '').toLowerCase()] = fromLonLat(feature.geometry.coordinates);
  });

  return devicesLocation;
};

export const processData = (data: SingleData[], devicesLocation: DevicesLocation) => {
  const deviceData = data[0];
  const circleFeatures: Feature[] = [];
  Object.keys(deviceData.distance).map(id => {
    if (devicesLocation[id]) {
      const feature = new Feature(new Circle(devicesLocation[id], deviceData.distance[id]));
      feature.set('label', `${id}\n(${deviceData.rssi[id]}) ${deviceData.distance[id].toFixed(1)}`);
      circleFeatures.push(feature);
    }
  });

  if (deviceData.longitude) {
    let radius = 0.3;
    if (deviceData.distance) {
      radius = Math.min(...Object.values(deviceData.distance));
    }
    const predictedPoint = new Feature(new Circle(fromLonLat([deviceData.longitude, deviceData.latitude]), radius));
    predictedPoint.setStyle(
      new Style({
        stroke: new Stroke({ color: '#FFA040', width: 3 }),
        text: new Text({
          stroke: new Stroke({
            color: '#b7b7b7',
            width: 1,
          }),
          font: '10px/1 sans-serif',
          text: deviceData.hash_id,
        }),
      })
    );
    circleFeatures.push(predictedPoint);
  }
  return new VectorLayer({
    source: new VectorSource({
      features: circleFeatures,
    }),

    style: function(feature: FeatureLike) {
      const label = feature.get('label');
      return new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.05)',
        }),
        stroke: new Stroke({
          color: '#49A8DE',
          width: 2,
        }),
        text: new Text({
          stroke: new Stroke({
            color: '#b7b7b7',
            width: 1,
          }),
          font: '10px/1 sans-serif',
          text: label,
        }),
      });
    },
    zIndex: 2,
  });
};
