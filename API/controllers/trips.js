const { db, bucket } = require("../database/database");


exports.getTrips = async (req, res) => {
  const userName = req.userName;

  try {
    const usersRef = db.collection("users");

    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userSnapshot.docs[0].id;
    const userRef = usersRef.doc(userId);

    const tripsSnapshot = await userRef.collection('trips').get();

    const trips = tripsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({ trips });

  } catch (error) {
    console.error('Error fetching trips:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}


exports.postTrip = async (req, res) => {
  const userName = req.userName;
  const { departureDate, arrivalDate, city, country, touristSpots } = req.body;
  console.log(userName, departureDate, arrivalDate, city, country, touristSpots)

  if (!departureDate || !arrivalDate || !city || !country || !touristSpots) {
    return res.status(400).json({ message: 'All fields are required (departureDate, arrivalDate, city, country, touristSpots).' });
  }

  try {
    const usersRef = db.collection("users");

    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();
    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userSnapshot.docs[0].id;
    const userRef = usersRef.doc(userId);

    const tripData = {
      departureDate,
      arrivalDate,
      city,
      country,
      touristSpots,
    };

    const tripRef = await userRef.collection('trips').add(tripData);

    return res.status(201).json({ tripId: tripRef.id, message: 'Trip saved successfully!' });

  } catch (error) {
    console.error('Error saving trip:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}


exports.putUserTrip = async (req, res) => {
  const userName = req.userName;
  const { tripId } = req.params;
  const { departureDate, arrivalDate, city, country, touristSpots } = req.body;

  if (!departureDate || !arrivalDate || !city || !country || !touristSpots) {
    return res.status(400).json({ message: 'All fields are required for update.' });
  }

  try {
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userSnapshot.docs[0].id;
    const tripRef = usersRef.doc(userId).collection('trips').doc(tripId);

    const tripDoc = await tripRef.get();
    if (!tripDoc.exists) {
      return res.status(404).json({ error: "Trip not found" });
    }

    await tripRef.update({
      departureDate,
      arrivalDate,
      city,
      country,
      touristSpots,
    });

    return res.status(200).json({ message: "Trip updated successfully!" });

  } catch (error) {
    console.error('Error updating trip:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

exports.deleteUserTrip = async (req, res) => {
  const userName = req.userName;
  const tripId = req.params.tripId;

  try {
    const usersRef = db.collection("users");

    const userSnapshot = await usersRef.where("name", "==", userName).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userSnapshot.docs[0].id;
    const userRef = usersRef.doc(userId);

    const tripRef = userRef.collection('trips').doc(tripId);
    const tripSnapshot = await tripRef.get();

    if (!tripSnapshot.exists) {
      return res.status(404).json({ error: "Trip not found" });
    }

    await tripRef.delete();

    return res.status(200).json({ message: "Trip deleted successfully." });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}