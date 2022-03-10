const axios = require('axios');
const fs = require('fs');

const inputFile = './osm.relations.txt';
const outputFile = './ukraine_regions.geojson';

const relations = fs.readFileSync(inputFile).toString().split('\r\n').map(line => line.split(' '));

osm2geojson(relations);

async function osm2geojson(rels) {
  const res = await Promise.all(rels.map(rel => {
    const [name, id] = rel;
    
    if (!id || !name) return;

    const promise = axios(`http://polygons.openstreetmap.fr/get_geojson.py?id=${id}&params=0`, {
      method: 'GET',
    }).then(r => ({ id, name, geo: r.data })).catch(err => console.log(err))
    
    return promise;
  }));
  
  save(res);
}

function save(data) {
  const geojson = { "type": "FeatureCollection", "features": [] }
  for (const id in data) {
    const region = data[id]
    geojson.features.push({
      "type": "Feature", 
      "properties": {
        "osm-relation-id": region.id,
        "name": region.name
      },
      "geometry": region.geo.geometries[0]
    })
  }
  fs.writeFileSync(outputFile, JSON.stringify(geojson, null, 2))
}