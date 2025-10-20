// Simple test script to test the delete room endpoint
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

async function testDeleteRoom() {
  try {
    console.log('Testing delete room endpoint...');
    
    // First, get all rooms to see what's available
    console.log('\n1. Fetching all rooms...');
    const roomsResponse = await fetch(`${API_BASE_URL}/api/rooms`);
    const roomsData = await roomsResponse.json();
    
    if (!roomsResponse.ok) {
      console.error('Failed to fetch rooms:', roomsData);
      return;
    }
    
    console.log(`Found ${roomsData.total} rooms`);
    if (roomsData.data && roomsData.data.length > 0) {
      const firstRoom = roomsData.data[0];
      console.log(`First room: ID=${firstRoom.id}, Name=${firstRoom.name}`);
      
      // Test delete (uncomment to actually delete)
      console.log('\n2. Testing delete room (DRY RUN - not actually deleting)');
      console.log(`Would delete room ID: ${firstRoom.id}`);
      
      // Uncomment the following lines to actually test deletion:
      /*
      const deleteResponse = await fetch(`${API_BASE_URL}/api/rooms/${firstRoom.id}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.json();
      
      console.log('Delete response status:', deleteResponse.status);
      console.log('Delete response data:', deleteData);
      */
      
    } else {
      console.log('No rooms found to test deletion');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testDeleteRoom();
