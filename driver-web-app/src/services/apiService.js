const BASE_URL = 'http://localhost:5000/api';

/**
 * Syncs a newly registered Firebase user with the backend MongoDB.
 * 
 * @param {Object} userData - User details including firebaseUid, email, name, role.
 * @returns {Promise<Object>} The standard response from the server.
 */
export const syncUserWithBackend = async (userData) => {
    try {
        const response = await fetch(`${BASE_URL}/user/sync`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to sync user data');
        }

        return await response.json();
    } catch (error) {
        console.error('Error syncing user:', error);
        throw error;
    }
};

/**
 * Updates driver profile details like campusId (vehicle plate).
 */
export const updateDriverProfile = async (firebaseUid, profileData) => {
    try {
        const response = await fetch(`${BASE_URL}/user/${firebaseUid}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) throw new Error('Failed to update profile');
        return await response.json();
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};
