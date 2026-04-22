/**
 * Utility functions for geographical calculations.
 */

/**
 * Calculates the distance between two geographical coordinates (latitude and longitude) using the Haversine formula.
 * 
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} The distance in kilometers between the two points.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    
    // Haversine formula calculation
    const a = 0.5 - c((lat2 - lat1) * p) / 2 + 
              c(lat1 * p) * c(lat2 * p) * 
              (1 - c((lon2 - lon1) * p)) / 2;
              
    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

module.exports = {
    calculateDistance
};
