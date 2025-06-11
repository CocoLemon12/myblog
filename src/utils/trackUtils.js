import { doc, writeBatch, getDoc } from 'firebase/firestore';

const CHUNK_SIZE = 5000;
const MAX_CHUNK_SIZE = 800000;

export const splitTrackData = (trackData) => {
  if (!trackData?.track?.length) {
    console.warn('No track data to split');
    return null;
  }

  const track = trackData.track;
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;

  for (let i = 0; i < track.length; i++) {
    const point = track[i];
    const pointSize = JSON.stringify(point).length;

    // Start new chunk if current one is too big
    if (currentChunk.length >= CHUNK_SIZE || currentSize + pointSize > MAX_CHUNK_SIZE) {
      chunks.push([...currentChunk]); // Create copy of chunk
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(point);
    currentSize += pointSize;
  }

  // Add remaining points
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  // Ensure we have at least one chunk
  if (chunks.length === 0) {
    console.error('Failed to create any chunks from track data');
    return null;
  }

  const metadata = {
    name: trackData.metadata?.name || '',
    time: trackData.metadata?.time || new Date().toISOString(),
    totalPoints: track.length,
    totalChunks: chunks.length,
    bounds: calculateTrackBounds(track),
  };

  return {
    metadata,
    previewChunk: chunks[0],
    chunks: chunks.slice(1), // Remove first chunk as it's in previewChunk
  };
};

export const saveTrackChunks = async (db, postId, trackData) => {
  if (!trackData?.chunks?.length) {
    console.warn('No chunks to save');
    return false;
  }

  try {
    const batch = writeBatch(db);
    
    // Save chunks in batches
    trackData.chunks.forEach((chunk, index) => {
      if (!Array.isArray(chunk) || chunk.length === 0) {
        console.warn(`Invalid chunk at index ${index}`);
        return;
      }

      const chunkRef = doc(db, 'posts', postId, 'trackChunks', `chunk_${index + 1}`);
      batch.set(chunkRef, {
        points: chunk,
        index: index + 1,
        timestamp: new Date().toISOString()
      });
    });

    await batch.commit();
    console.log(`Saved ${trackData.chunks.length} chunks successfully`);
    return true;
  } catch (error) {
    console.error('Error saving track chunks:', error);
    return false;
  }
};

export const loadTrackChunks = async (db, postId, metadata) => {
  if (!postId || !metadata?.totalChunks) {
    console.warn('Missing required data for loading chunks');
    return null;
  }

  try {
    console.log(`Starting to load ${metadata.totalChunks - 1} chunks...`);
    
    // Create array of chunk loading promises
    const chunkPromises = [];
    for (let i = 1; i < metadata.totalChunks; i++) {
      const chunkRef = doc(db, 'posts', postId, 'trackChunks', `chunk_${i}`);
      chunkPromises.push(getDoc(chunkRef));
    }

    // Load all chunks in parallel
    const chunkDocs = await Promise.all(chunkPromises);
    
    // Process chunks in order
    let allPoints = [];
    chunkDocs.forEach((chunkDoc, index) => {
      if (chunkDoc.exists()) {
        const chunkData = chunkDoc.data();
        if (Array.isArray(chunkData.points)) {
          allPoints = [...allPoints, ...chunkData.points];
          console.log(`Processed chunk ${index + 1}: +${chunkData.points.length} points`);
        } else {
          console.warn(`Invalid chunk data at index ${index + 1}`);
        }
      } else {
        console.warn(`Missing chunk ${index + 1}`);
      }
    });

    console.log(`Successfully loaded ${allPoints.length} points from ${metadata.totalChunks - 1} chunks`);
    return allPoints;
  } catch (error) {
    console.error('Error loading track chunks:', error);
    return null;
  }
};

const calculateTrackBounds = (track) => {
  if (!Array.isArray(track) || track.length === 0) return null;

  return track.reduce((bounds, point) => {
    return {
      minLat: Math.min(bounds.minLat || point.lat, point.lat),
      maxLat: Math.max(bounds.maxLat || point.lat, point.lat),
      minLng: Math.min(bounds.minLng || point.lng, point.lng),
      maxLng: Math.max(bounds.maxLng || point.lng, point.lng),
      minEle: Math.min(bounds.minEle || point.ele, point.ele),
      maxEle: Math.max(bounds.maxEle || point.ele, point.ele),
    };
  }, {});
};