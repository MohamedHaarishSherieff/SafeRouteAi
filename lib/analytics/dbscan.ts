import { AccidentRecord } from '@/types/accidents';
import { haversineDistanceMeters } from './haversine';

export interface Cluster {
  id: string;
  centroidLat: number;
  centroidLng: number;
  radiusMeters: number;
  recordIds: string[];
}

/**
 * Density-Based Spatial Clustering of Applications with Noise (DBSCAN)
 * Optimized with geographic grid-bin hashing for sub-second spatial queries.
 *
 * @param records Accident records to cluster
 * @param epsMeters Maximum neighbor distance in meters (default 450m for MoRTH 500m blackspot threshold)
 * @param minPts Minimum number of incidents to form a dense cluster (default 6)
 */
export function runDBSCAN(
  records: AccidentRecord[],
  epsMeters: number = 450,
  minPts: number = 6
): { clusters: Cluster[]; noiseCount: number } {
  const n = records.length;
  if (n === 0) return { clusters: [], noiseCount: 0 };

  // Spatial grid index: 1 deg lat ~= 111,000m. Grid cell size approx epsMeters * 1.2
  const cellSizeDeg = (epsMeters * 1.5) / 111000;
  const grid = new Map<string, number[]>();

  const getCellKey = (lat: number, lng: number) => {
    const latIndex = Math.floor(lat / cellSizeDeg);
    const lngIndex = Math.floor(lng / cellSizeDeg);
    return `${latIndex}:${lngIndex}`;
  };

  // Populate grid
  for (let i = 0; i < n; i++) {
    const key = getCellKey(records[i].lat, records[i].lng);
    const cell = grid.get(key);
    if (cell) {
      cell.push(i);
    } else {
      grid.set(key, [i]);
    }
  }

  // Fast neighbor lookup inspecting 3x3 adjacent grid bins
  const getNeighbors = (index: number): number[] => {
    const origin = records[index];
    const neighbors: number[] = [];
    const baseLatIndex = Math.floor(origin.lat / cellSizeDeg);
    const baseLngIndex = Math.floor(origin.lng / cellSizeDeg);

    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLng = -1; dLng <= 1; dLng++) {
        const key = `${baseLatIndex + dLat}:${baseLngIndex + dLng}`;
        const candidates = grid.get(key);
        if (!candidates) continue;

        for (const candidateIndex of candidates) {
          const cand = records[candidateIndex];
          const dist = haversineDistanceMeters(origin.lat, origin.lng, cand.lat, cand.lng);
          if (dist <= epsMeters) {
            neighbors.push(candidateIndex);
          }
        }
      }
    }
    return neighbors;
  };

  const visited = new Uint8Array(n); // 0 = unvisited, 1 = visited
  const clusterAssignments = new Int32Array(n).fill(-1); // -1 = noise or unassigned
  let clusterCounter = 0;
  const clusterMemberIndices: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    visited[i] = 1;

    const neighbors = getNeighbors(i);
    if (neighbors.length < minPts) {
      clusterAssignments[i] = -1; // Flagged as noise initially
    } else {
      const currentClusterId = clusterCounter++;
      const currentCluster: number[] = [i];
      clusterAssignments[i] = currentClusterId;

      const queue = [...neighbors];
      let queueHead = 0;

      while (queueHead < queue.length) {
        const neighborIdx = queue[queueHead++];
        if (!visited[neighborIdx]) {
          visited[neighborIdx] = 1;
          const subNeighbors = getNeighbors(neighborIdx);
          if (subNeighbors.length >= minPts) {
            for (const sn of subNeighbors) {
              queue.push(sn);
            }
          }
        }

        if (clusterAssignments[neighborIdx] === -1) {
          clusterAssignments[neighborIdx] = currentClusterId;
          currentCluster.push(neighborIdx);
        }
      }

      clusterMemberIndices.push(currentCluster);
    }
  }

  // Form structured clusters with centroid and bounding radius
  const clusters: Cluster[] = clusterMemberIndices.map((members, cIdx) => {
    let sumLat = 0;
    let sumLng = 0;
    const recordIds: string[] = [];

    for (const m of members) {
      sumLat += records[m].lat;
      sumLng += records[m].lng;
      recordIds.push(records[m].id);
    }

    const centroidLat = sumLat / members.length;
    const centroidLng = sumLng / members.length;

    let maxDist = 0;
    for (const m of members) {
      const d = haversineDistanceMeters(centroidLat, centroidLng, records[m].lat, records[m].lng);
      if (d > maxDist) maxDist = d;
    }

    return {
      id: `cluster-${cIdx + 1}`,
      centroidLat,
      centroidLng,
      radiusMeters: Math.max(150, Math.min(800, maxDist)),
      recordIds,
    };
  });

  const noiseCount = clusterAssignments.filter(c => c === -1).length;

  return { clusters, noiseCount };
}
