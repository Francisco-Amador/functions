const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db=admin.firestore();

exports.depUpdate = functions
    .region("us-central1").pubsub.schedule("*/10 * * * *")
    .timeZone("America/Costa_Rica")
    .onRun(async (context) => {
      await db
          .collection("departures").where("locked", "==", true)
          .get()
          .then(async (res) => {
            const docs = res.docs;
            for (const doc of docs) {
              const departure = doc.data();
              const nSeats= [];
              let locked = false;
              const dateNow = new Date();
              for (const item of departure.seats) {
                if (item.state === "blocked") {
                  const timeLock = new Date(item.timeBlock);
                  timeLock.setMinutes(timeLock.getMinutes() + 15);
                  if (dateNow.getTime() > timeLock.getTime() ) {
                    const newSeat = {...item, state: "available", timeBlock: 0};
                    nSeats.push(newSeat);
                  } else {
                    locked = true;
                    nSeats.push(item);
                  }
                } else {
                  nSeats.push(item);
                }
              }
              console.log(nSeats);
              console.log(locked);
              departure.seats = nSeats;
              departure.locked = locked;
              await db.collection("departures").doc(departure.id)
                  .update(departure);
            }
          });
    });
